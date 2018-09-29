
import { Component, ChangeDetectionStrategy, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  Observable,
  Subject,
  BehaviorSubject
} from 'rxjs';
import {
  map,
  publishReplay,
  refCount,
  switchMap,
  withLatestFrom,
  tap
} from 'rxjs/operators';

import {
  ContextualActionBarService,
  TerminalComponent
} from '@angular-console/ui';
import {
  CommandOutput,
  CommandRunner,
  Serializer
} from '@angular-console/utils';
import gql from 'graphql-tag';

import { EditorComponent } from '../editor/editor.component';
import { ResourceConfig } from './resource-config';
import { ResourceService } from './resource.service';

const DEBUGGING = false;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mbd-resource',
  templateUrl: './resource.component.html',
  styleUrls: ['./resource.component.css']
})
export class ResourceComponent implements OnInit, OnDestroy {

  commandPrefix: string[] = [];
  configuration$: Observable<ResourceConfig>;
  commandArray$ = new BehaviorSubject<{ commands: string[]; valid: boolean }>({
    commands: [],
    valid: true
  });
  command$: Observable<string>;
  commandOutput$: Observable<CommandOutput>;
  @ViewChild(EditorComponent) editor: EditorComponent;
  @ViewChild(TerminalComponent) out: TerminalComponent;
  private readonly ngRun$ = new Subject<any>();
  private readonly ngRunDisabled$ = new BehaviorSubject(true);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly runner: CommandRunner,
    private readonly serializer: Serializer,
    private readonly contextActionService: ContextualActionBarService,
    private readonly resourceService: ResourceService
  ) {}

  ngOnInit() {

    if (DEBUGGING) { console.log('ResourceComponent.ngOnInit'); }

    const tapConfig = (resourceConfig: ResourceConfig) => {
      const contextTitle = this.resourceService.getContextTitle(resourceConfig.target);
      this.commandPrefix = ['g', '@mbd/schematics:pwa', '--appName=stacks', '--project=' + resourceConfig.target.projectName];
      if (DEBUGGING) {
        console.log('ResourceComponent.tapConfig', {
          resourceConfig: resourceConfig, contextTitle: contextTitle, commandPrefix: this.commandPrefix
        });
      }
      this.contextActionService.contextualActions$.next({
        contextTitle,
        actions: [
          {
            invoke: this.ngRun$,
            disabled: this.ngRunDisabled$,
            name: 'Generate Modules'
          }
        ]
      });
    };

    this.configuration$ = this.resourceService.getConfiguration(this.route, tapConfig);

    // TODO: Incorporate into CommandService
    this.commandOutput$ = this.ngRun$.pipe(
      withLatestFrom(this.commandArray$),
      tap(() => {
        // this.flags.hideFields();
        this.editor.terminalVisible.next(true);
      }),
      switchMap(([_, c]) => {
        this.out.reset();
        return this.runner.runCommand(
          gql`
            mutation($path: String!, $runCommand: [String]!) {
              runNg(path: $path, runCommand: $runCommand) {
                command
              }
            }
          `,
          {
            path: this.workspacePath(),
            runCommand: c.commands
          },
          false
        );
      }),
      publishReplay(1),
      refCount()
    );

    this.command$ = this.commandArray$.pipe(
      map(c => `ng ${this.serializer.argsToString(c.commands)}`)
    );
  }

  ngOnDestroy() {
    if (DEBUGGING) { console.log('ResourceComponent.ngOnDestroy'); }
  }

  workspacePath() {
    return this.route.snapshot.params.path;
  }

  onRun() {
    if (DEBUGGING) { console.log('ResourceComponent.onRun'); }
    // this.ngRun$.next();
  }

  onStop() {
    if (DEBUGGING) { console.log('ResourceComponent.onStop'); }
    // this.runner.stopCommand();
  }

  onCommandsChange(e: { commands: string[]; valid: boolean }) {
    setTimeout(() => this.commandArray$.next(e), 0);
    this.ngRunDisabled$.next(!e.valid);
  }
}
