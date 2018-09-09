
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
import {ResourceConfig} from './resource-config';

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

    const resourceParams$ = this.route.params.pipe(
      map(params => {
        if (!params.project || !params.resource) return null;
        return {
          workspacePath: params.path,
          projectName: decodeURIComponent(params.project),
          resourcePath: decodeURIComponent(params.resource)
        };
      })
    );

    this.configuration$ = resourceParams$.pipe(
      switchMap(params => {
        if (!params) {
          return of();
        }
        return this.apollo.query({
          query: gql`
            query($workspacePath: String!, $projectName: String!, $resourcePath: String!) {
              metadata(workspace: $workspacePath, project: $projectName, path: $resourcePath) {
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
          contentType: this.getContentType(metadata.path, metadata.content),
          content: JSON.parse(metadata.content)
        }
      }),
      tap((resourceConfig: ResourceConfig) => {
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
    console.log('ResourceComponent.onRun');
    // this.ngRun$.next();
  }

  onStop() {
    console.log('ResourceComponent.onStop');
    // this.runner.stopCommand();
  }

  onFlagsChange(e: { commands: string[]; valid: boolean }) {
    console.log('ResourceComponent.onFlagsChange', e);
    setTimeout(() => this.commandArray$.next(e), 0);
    this.ngRunDisabled$.next(!e.valid);
  }

  protected getContentType(resourcePath: string, content: any): string {
    const lastSlashIndex = resourcePath.lastIndexOf('/');
    const lastDotIndex = resourcePath.lastIndexOf('.');
    let fileName: string;
    if (lastSlashIndex === -1) {
      fileName = lastDotIndex === -1 ?
                 resourcePath :
                 resourcePath.substring(0, lastDotIndex);
    } else {
      fileName = lastDotIndex === -1 ?
                 resourcePath.substring(lastSlashIndex + 1) :
                 resourcePath.substring(lastSlashIndex + 1, lastDotIndex);
    }
    return 'mbd/' + fileName;
  }
}
