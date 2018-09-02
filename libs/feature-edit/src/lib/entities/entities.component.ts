import { Component, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { TaskCollections } from '@angular-console/ui';
import { Project } from '@angular-console/schema';
import { Finder } from '@angular-console/utils';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { Observable, ReplaySubject, combineLatest, Subscription } from 'rxjs';
import {
  map,
  switchMap,
  filter,
  startWith,
  distinctUntilChanged
} from 'rxjs/operators';
import { ProjectMetadata } from '../project/metadata/project-metadata';
import { ProjectMetadataService } from '../project/metadata/project-metadata.service';
import { EntityTasks, EntityTarget } from '../entity/tasks/entity-tasks';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mbd-entities',
  templateUrl: './entities.component.html',
  styleUrls: ['./entities.component.scss']
})
export class EntitiesComponent implements OnInit, OnDestroy {

  private readonly projects$: Observable<Array<Project>> = this.route.params.pipe(
    map(m => m.path),
    switchMap(path => {
      return this.apollo.watchQuery({
        pollInterval: 5000,
        query: gql`
          query($path: String!) {
            workspace(path: $path) {
              projects {
                name
                root
                projectType
              }
            }
          }
        `,
        variables: {
          path
        }
      }).valueChanges;
    }),
    map(r => {
      return [...(r as any).data.workspace.projects];
    })
  );

  private readonly selectedTargetId$: Observable<EntityTarget> = this.router.events.pipe(
    filter(event => event instanceof NavigationEnd),
    startWith(null),
    map(() => {
      const firstChild = this.route.snapshot.firstChild;
      if (firstChild) {
        return {
          projectName: decodeURIComponent(firstChild.params.project),
          targetPath: decodeURIComponent(firstChild.params.target)
        };
      }
      return {
        projectName: '',
        targetPath: ''
      };
    }),
    distinctUntilChanged(
      (a: EntityTarget, b: EntityTarget) =>
        a.projectName === b.projectName && a.targetPath === b.targetPath
    )
  );

  private entityTasksSubject = new ReplaySubject<TaskCollections<EntityTarget>>(1);
  readonly projectTasks$ = this.entityTasksSubject.asObservable();

  readonly workspaceProjects$: Observable<EntityTasks<ProjectMetadata>> =
    combineLatest(this.projects$, this.selectedTargetId$).pipe(
      map(([projects, target]) => {
        const metadataArray: Array<ProjectMetadata> = projects.map(
          project => new ProjectMetadata(project, this.finder)
        );
        console.log('workspaceProjects$ - target', target);
        return new EntityTasks<ProjectMetadata>(this.route.snapshot.params.path, metadataArray, target, ['templates']);
      })
    );

  private projectsub: Subscription;

  constructor(
    private readonly apollo: Apollo,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly finder: Finder,
    private readonly metadataService: ProjectMetadataService
  ) {}

  ngOnInit() {
    this.projectsub = this.workspaceProjects$.subscribe((entityProjects) => {
      entityProjects.entityTasksSubject = this.entityTasksSubject;
    });
  }

  ngOnDestroy() {
    if (this.projectsub) {
      this.projectsub.unsubscribe();
    }
  }

  navigateToSelectedTarget(target: EntityTarget | null) {
    if (target) {
      this.router.navigate(
        [
          encodeURIComponent(target.projectName),
          encodeURIComponent(target.targetPath)
        ],
        { relativeTo: this.route }
      );
    } else {
      this.router.navigate(['.'], { relativeTo: this.route });
    }
  }
}
