import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChildren,
  ViewEncapsulation,
  OnInit,
  OnDestroy
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatExpansionPanel } from '@angular/material';
import { Completions, Serializer, EditorSupport } from '@angular-console/utils';
import { CompletetionValue, Field } from '@angular-console/schema';
import { Subscription } from 'rxjs';
import {
  debounceTime,
  map,
  publishReplay,
  refCount,
  startWith,
  switchMap
} from 'rxjs/operators';
import {ElementConfig} from './element-config';
import {ResourceService} from '../resource/resource.service';
import {MetadataService} from '../resources/metadata.service';

interface FieldGrouping {
  type: 'important' | 'optional';
  fields: Array<Field>;
  expanded: boolean;
}

const DEBOUNCE_TIME = 300;
const DEBUGGING = true;

export interface ContentAction {
  name: string;
  description: string;
  icon: string,
  invoke: (event: Event) => void
};

@Component({
  selector: 'mbd-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('actionFadeIn', [
      state('void', style({ opacity: 0 })),
      state('*', style({ opacity: 1 })),
      transition(`:enter`, animate(`500ms ease-in-out`))
    ])
  ]
})
export class ContentComponent implements OnInit, OnDestroy {
  private _fields: Field[];
  private subscription: Subscription;

  @ViewChildren(MatExpansionPanel)
  matExpansionPanels: QueryList<MatExpansionPanel>;

  fieldGroups: Array<FieldGrouping> = [];

  @Input() workspacePath: string;
  @Input() configurations: { name: string }[];
  @Input() prefix: string[];
  @Input() init: { [k: string]: any };
  @Input()
  get fields() {
    return this._fields;
  }
  set fields(f: Field[]) {
    this._fields = f;
    this.fieldGroups = this.toFieldGroups(f);
    this.setForm();
  }
  @Input() elementConfig: ElementConfig;

  @Output() readonly value = new EventEmitter();
  @Output() readonly action = new EventEmitter();
  @Output() readonly stop = new EventEmitter();
  @Output() readonly resizeFlags = new EventEmitter();

  formGroup: FormGroup;
  private editorSubscription: Subscription;
  actions: ContentAction[] = [];

  constructor(
    private readonly serializer: Serializer,
    private readonly elementRef: ElementRef,
    private readonly completions: Completions,
    private readonly metadataService: MetadataService,
    private readonly resourceService: ResourceService,
    private readonly editorSupport: EditorSupport
  ) {}

  ngOnInit() {
    if (DEBUGGING) {
      console.log('***** +++ ContentComponent.ngOnInit', {
        elementConfig: this.elementConfig
      });
    }
    this.editorSubscription = this.editorSupport.editors.subscribe(editors => {
      this.actions = editors.map(
        (editor) => {
          return {
            name: editor.name,
            description: `Open in ${editor.name}`,
            icon: editor.icon,
            invoke: (event: Event) => {
              event.stopPropagation();
              this.openInEditor(editor.name);
            }
          };
        }
      );
    });
  }

  ngOnDestroy() {
    if (DEBUGGING) { console.log('***** --- ContentComponent.ngOnDestroy'); }
    if (this.editorSubscription) {
      this.editorSubscription.unsubscribe();
    }
  }

  openInEditor(editorName: string) {
    const projectSegment = this.elementConfig.target.projectType === 'application' ? '/apps/' : '/libs/';
    const contentDir = this.workspacePath + projectSegment + this.elementConfig.target.projectName + '/src/meta/';
    const resourcePath = editorName === 'Finder' ? this.directoryPath(this.elementConfig.target.resourcePath) : this.elementConfig.target.resourcePath;
    if (DEBUGGING) { console.log('--> openInEditor', editorName, contentDir + resourcePath); }
    this.editorSupport.openInEditor(editorName, contentDir + resourcePath);
  }

  private directoryPath(resourcePath: string): string {
    const lastSegment = resourcePath.lastIndexOf('/');
    return lastSegment === -1 ? '' : resourcePath.substring(0, lastSegment);
  }

  get resourceTitle(): string | undefined {
    return this.resourceService.getResourceTitle(this.elementConfig.target);
  }

  hideFields() {
    this.matExpansionPanels.forEach((panel: MatExpansionPanel) => {
      panel.close();
    });
  }

  fieldEnumOptions(field: Field) {
    if (field.defaultValue) {
      return field.enum;
    } else {
      return [null, ...field.enum];
    }
  }

  fieldOption(value: any) {
    return value === null ? '--' : value;
  }

  onSubmit() {
    this.action.next();
  }

  onReset() {
    this.setForm();
  }

  onStop() {
    this.stop.next();
  }

  clearFormField(f: Field) {
    const formControl = this.formGroup.get(f.name);
    if (formControl) {
      formControl.reset();
    }
  }

  toggleBooleanField(f: Field) {
    const formControl = this.formGroup.get(f.name);
    if (formControl) {
      formControl.setValue(!formControl.value);
    }
  }

  private toFieldGroups(fields: Array<Field>): Array<FieldGrouping> {
    const importantFields: FieldGrouping = {
      type: 'important',
      fields: fields.filter(f => f.important),
      expanded: true
    };

    const optionalFields: FieldGrouping = {
      type: 'optional',
      fields: fields.filter(f => !f.important),
      expanded: false
    };

    if (importantFields.fields.length) {
      const groupings: Array<FieldGrouping> = [importantFields];

      if (optionalFields.fields.length) {
        groupings.push(optionalFields);
      }

      return groupings;
    } else {
      return [
        {
          ...importantFields,
          fields
        }
      ];
    }
  }

  private setForm() {
    const children = this._fields.reduce(
      (m, f) => {
        const value =
          this.init && this.init[f.name] ? this.init[f.name] : f.defaultValue;
        const formControl = new FormControl(
          value,
          f.required ? Validators.required : null
        );

        if (f.completion) {
          f.completionValues = formControl.valueChanges.pipe(
            debounceTime(DEBOUNCE_TIME),
            startWith(formControl.value),
            switchMap((v: string | null) =>
              this.completions.completionsFor(this.workspacePath, f, v || '')
            ),
            publishReplay(1),
            refCount()
          );
        } else if (f.enum) {
          const completionValues: CompletetionValue[] = this.fieldEnumOptions(
            f
          ).map(o => {
            const completion: CompletetionValue = {
              value: o,
              display: o || '--'
            };
            return completion;
          });
          f.completionValues = formControl.valueChanges.pipe(
            debounceTime(DEBOUNCE_TIME),
            startWith(formControl.value),
            map((v: string | null) => {
              if (!v) {
                return completionValues;
              } else {
                const lowercase = v.toLowerCase();
                return completionValues.filter(
                  c => c.value && c.value.indexOf(lowercase) !== -1
                );
              }
            }),
            publishReplay(1),
            refCount()
          );
        }

        m[f.name] = formControl;

        return m;
      },
      {} as any
    );
    if (this.configurations && this.configurations.length > 0) {
      children.configurations = new FormControl(null);
    }
    this.formGroup = new FormGroup(children);

    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.subscription = this.formGroup.valueChanges
      .pipe(startWith(this.formGroup.value))
      .subscribe(value => {
        this.emitNext(value);
      });
  }

  private emitNext(value: { [p: string]: any }) {
    const configuration =
      this.configurations && value.configurations
        ? [`--configuration=${value.configurations}`]
        : [];
    if (DEBUGGING) {
      console.log('ContentComponent.emitNext', {
        prefix: this.prefix,
        configuration: configuration,
        value: value,
        fields: this._fields
      });
    }
    this.value.next({
      commands: [
        ...this.prefix,
        ...configuration,
        ...this.serializer.serializeArgs(value, this._fields)
      ],
      valid: this.formGroup.valid
    });
    const e = this.elementRef.nativeElement as HTMLElement;
    if (e.scrollTo) {
      e.scrollTo({
        top: 0,
        behavior: 'auto'
      });
    }
  }

  // this is needed because of a bug in MatAutocomplete
  triggerValueUpdate(name: string, value: string) {
    (this.formGroup.get(name) as FormControl).setValue(value, {
      emitEvent: true
    });
  }

  handleCommand(command: any) {
    if (DEBUGGING) { console.log('***** ContentComponent.handleCommand', command.detail); }
    if (command.detail.name === 'navigateTo') {
      this.metadataService.navigateToResource(command.detail.target);
    }
  }
}
