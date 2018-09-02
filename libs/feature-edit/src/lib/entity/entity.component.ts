
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

import {
  ContextualActionBarService,
  // FlagsComponent,
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
import {ProjectMetadataService} from '../project/metadata/project-metadata.service';
import {EntityConfig} from './entity-config';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mbd-entity',
  templateUrl: './entity.component.html',
  styleUrls: ['./entity.component.css']
})
export class EntityComponent implements OnInit {

  configuration$: Observable<EntityConfig>;
  commandArray$ = new BehaviorSubject<{ commands: string[]; valid: boolean }>({
    commands: [],
    valid: true
  });
  command$: Observable<string>;
  commandOutput$: Observable<CommandOutput>;
  @ViewChild(TerminalComponent) out: TerminalComponent;
  @ViewChild(TaskRunnerComponent) taskRunner: TaskRunnerComponent;
  // @ViewChild(FlagsComponent) flags: FlagsComponent;
  private readonly ngRun$ = new Subject<any>();
  private readonly ngRunDisabled$ = new BehaviorSubject(true);

  constructor(
    private readonly apollo: Apollo,
    private readonly route: ActivatedRoute,
    private readonly runner: CommandRunner,
    private readonly serializer: Serializer,
    private readonly contextActionService: ContextualActionBarService,
    private readonly metadataService: ProjectMetadataService
  ) {}

  ngOnInit() {

    const targetParams$ = this.route.params.pipe(
      map(params => {
        if (!params.project || !params.target) return null;
        return {
          workspacePath: params.path,
          projectName: decodeURIComponent(params.project),
          targetPath: decodeURIComponent(params.target)
        };
      })
    );

    this.configuration$ = targetParams$.pipe(
      switchMap(params => {
        console.log('EntityComponent.ngOnInit - params', params); // TESTING
        if (!params) {
          return of();
        }
        return this.apollo.query({
          query: gql`
            query($workspacePath: String!, $projectName: String!, $targetPath: String!) {
              metadata(workspace: $workspacePath, project: $projectName, path: $targetPath) {
                projectType,
                projectName,
                path,
                content
              }
            }
          `,
          variables: params
        });
      }),
      map((response: any) => {
        const metadata = response.data.metadata;
        return {
          projectType: metadata.projectType,
          projectName: metadata.projectName,
          path: metadata.path,
          content: JSON.parse(metadata.content)
        }
      }),
      tap((entityConfig: EntityConfig) => {
        console.log('EntityComponent.ngOnInit - entityConfig', entityConfig); // TESTING
        const contextTitle = entityConfig.projectName;
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
    console.log('onRun');
  }

  onStop() {
    console.log('onStop');
  }

  onFlagsChange(e: { commands: string[]; valid: boolean }) {
    console.log('onFlagsChange', e);
    setTimeout(() => this.commandArray$.next(e), 0);
    this.ngRunDisabled$.next(!e.valid);
  }
}
