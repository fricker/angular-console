import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  Input,
  OnInit,
  OnDestroy
} from '@angular/core';
import { BehaviorSubject, merge, Subscription, EMPTY } from 'rxjs';
import { map, delay } from 'rxjs/operators';
import { ContentComponent } from '../content/content.component';
import { TerminalComponent } from '@angular-console/ui';

const ANIMATION_DURATION = 300;
const DEBUGGING = false;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mbd-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
  animations: [
    trigger('growShrink', [
      state('void', style({ flex: '0 0', 'min-height': '32px' })),
      state('shrink', style({ flex: '0 0', 'min-height': '32px' })),
      state('grow', style({ flex: '1 1', 'min-height': '240px' })),
      transition(
        `shrink <=> grow`,
        animate(`${ANIMATION_DURATION}ms ease-in-out`)
      )
    ])
  ]
})
export class EditorComponent implements AfterContentInit, OnInit, OnDestroy {
  @Input() terminalWindowTitle: string;

  @ContentChild(ContentComponent) contentComponent: ContentComponent | undefined;
  @ContentChild(TerminalComponent) terminalComponent: TerminalComponent;

  terminalVisible = new BehaviorSubject(true);
  terminalAnimationState = this.terminalVisible.pipe(
    map(visible => (visible ? 'grow' : 'shrink'))
  );
  resizeSubscription: Subscription | undefined;

  ngOnInit() {
    if (DEBUGGING) { console.log('+++ EditorComponent.ngOnInit'); }
  }

  ngAfterContentInit() {
    const TIME_BUFFER = 50;
    const DELAY = ANIMATION_DURATION + TIME_BUFFER;
    const contentComponentResize$ = this.contentComponent
      ? this.contentComponent.resizeFlags.pipe(delay(DELAY))
      : EMPTY;
    this.resizeSubscription = merge(
      contentComponentResize$,
      this.terminalVisible.pipe(delay(DELAY))
    ).subscribe(() => {
      this.terminalComponent.resizeTerminal();
    });
  }

  ngOnDestroy() {
    if (DEBUGGING) { console.log('--- EditorComponent.ngOnDestroy'); }
    if (this.resizeSubscription) {
      this.resizeSubscription.unsubscribe();
    }
  }
}
