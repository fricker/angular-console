
import { Component, ChangeDetectionStrategy, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  Observable,
  Subject,
  BehaviorSubject,
  of
} from 'rxjs';
import {
  map,
  publishReplay,
  refCount,
  switchMap,
  withLatestFrom,
  tap
} from 'rxjs/operators';

import { Project } from '@angular-console/schema';
import {
  ContextualActionBarService,
  FlagsComponent,
  TaskRunnerComponent,
  TerminalComponent
} from '@angular-console/ui';
import {
  CommandOutput,
  CommandRunner,
  Serializer
} from '@angular-console/utils';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mbd-entity',
  templateUrl: './entity.component.html',
  styleUrls: ['./entity.component.css']
})
export class EntityComponent implements OnInit {

  project$: Observable<Project>;
  commandArray$ = new BehaviorSubject<{ commands: string[]; valid: boolean }>({
    commands: [],
    valid: true
  });
  command$: Observable<string>;
  commandOutput$: Observable<CommandOutput>;
  @ViewChild(TerminalComponent) out: TerminalComponent;
  @ViewChild(TaskRunnerComponent) taskRunner: TaskRunnerComponent;
  @ViewChild(FlagsComponent) flags: FlagsComponent;
  private readonly ngRun$ = new Subject<any>();
  private readonly ngRunDisabled$ = new BehaviorSubject(true);

  constructor(
    private readonly apollo: Apollo,
    private readonly route: ActivatedRoute,
    private readonly runner: CommandRunner,
    private readonly serializer: Serializer,
    private readonly contextActionService: ContextualActionBarService
  ) {}

  ngOnInit() {
    const targetDescription$ = this.route.params.pipe(
      map(p => {
        if (!p.project || !p.target) return null;
        return {
          path: p.path,
          project: decodeURIComponent(p.project)
        };
      })
    );

    this.project$ = targetDescription$.pipe(
      switchMap(p => {
        if (!p) {
          return of();
        }
        return this.apollo.query({
          query: gql`
            query($path: String!, $project: String!) {
              workspace(path: $path) {
                projects(name: $project) {
                  name
                  root
                  projectType
                }
              }
            }
          `,
          variables: p
        });
      }),
      map((r: any) => {
        const project: Project = r.data.workspace.projects[0];
        /*
        const architect = project.architect.map(a => ({
          ...a,
          schema: this.serializer.normalizeTarget(a.builder, a.schema)
        }));
        */
        return {
          ...project/*,
          architect*/
        };
      }),
      tap((project: Project) => {
        const contextTitle = this.getContextTitle(project);

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
      }),
      publishReplay(1),
      refCount()
    );

    this.commandOutput$ = this.ngRun$.pipe(
      withLatestFrom(this.commandArray$),
      tap(() => {
        this.flags.hideFields();
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
            path: this.path(),
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

  getContextTitle(project: Project) {
    return project.name;
  }

  path() {
    return this.route.snapshot.params.path;
  }

  onRun() {
    console.log('onRun');
  }

  onStop() {
    console.log('onStop');
  }

  onFlagsChange(e: { commands: string[]; valid: boolean }) {
    console.log('onFlagsChange', e);
  }
}
