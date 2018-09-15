
import { Component, ChangeDetectionStrategy, ViewChild, OnInit } from '@angular/core';
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
  TaskRunnerComponent,
  TerminalComponent
} from '@angular-console/ui';
import {
  CommandOutput,
  CommandRunner,
  Serializer
} from '@angular-console/utils';
import gql from 'graphql-tag';
import {ResourceConfig} from './resource-config';
import {ResourceService} from './resource.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mbd-resource',
  templateUrl: './resource.component.html',
  styleUrls: ['./resource.component.css']
})
export class ResourceComponent implements OnInit {

  configuration$: Observable<ResourceConfig>;
  commandArray$ = new BehaviorSubject<{ commands: string[]; valid: boolean }>({
    commands: [],
    valid: true
  });
  command$: Observable<string>;
  commandOutput$: Observable<CommandOutput>;
  @ViewChild(TerminalComponent) out: TerminalComponent;
  @ViewChild(TaskRunnerComponent) taskRunner: TaskRunnerComponent;
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

    const tapConfig = (resourceConfig: ResourceConfig) => {
      const contextTitle = resourceConfig.projectName;
      this.contextActionService.contextualActions$.next({
        contextTitle,
        actions: [
          {
            invoke: this.ngRun$,
            disabled: this.ngRunDisabled$,
            name: 'Run'
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
        this.taskRunner.terminalVisible.next(true);
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

  workspacePath() {
    return this.route.snapshot.params.path;
  }

  onRun() {
    console.log('ResourceComponent.onRun');
    // this.ngRun$.next();
  }

  onStop() {
    console.log('ResourceComponent.onStop');
    // this.runner.stopCommand();
  }

  onFlagsChange(e: { commands: string[]; valid: boolean }) {
    setTimeout(() => this.commandArray$.next(e), 0);
    this.ngRunDisabled$.next(!e.valid);
  }
}
