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
import { ResourceTasks, ResourceTarget } from '../resource/resource-tasks';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mbd-resources',
  templateUrl: './resources.component.html',
  styleUrls: ['./resources.component.scss']
})
export class ResourcesComponent implements OnInit, OnDestroy {

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
      return [...((r as any).data.workspace.projects)];
    })
  );

  private readonly selectedResource$: Observable<ResourceTarget> = this.router.events.pipe(
    filter(event => event instanceof NavigationEnd),
    startWith(null),
    map(() => {
      const firstChild = this.route.snapshot.firstChild;
      if (firstChild) {
        return {
          projectName: decodeURIComponent(firstChild.params.project),
          resourcePath: decodeURIComponent(firstChild.params.resource)
        };
      }
      return {
        projectName: '',
        resourcePath: ''
      };
    }),
    distinctUntilChanged(
      (a: ResourceTarget, b: ResourceTarget) =>
        a.projectName === b.projectName && a.resourcePath === b.resourcePath
    )
  );

  private resourceTasksSubject = new ReplaySubject<TaskCollections<ResourceTarget>>(1);
  readonly resourceTasks$ = this.resourceTasksSubject.asObservable();

  readonly workspaceProjects$: Observable<ResourceTasks<ProjectMetadata>> =
    combineLatest(this.projects$, this.selectedResource$).pipe(
      map(([projects, resource]) => {
        const metadataArray: Array<ProjectMetadata> = projects.map(
          project => new ProjectMetadata(project, this.finder)
        );
        return new ResourceTasks<ProjectMetadata>(this.route.snapshot.params.path, metadataArray, resource, ['templates']);
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
    this.projectsub = this.workspaceProjects$.subscribe((resourceTasks) => {
      resourceTasks.tasksSubject = this.resourceTasksSubject;
    });
  }

  ngOnDestroy() {
    if (this.projectsub) {
      this.projectsub.unsubscribe();
    }
  }

  navigateToResource(resourceTarget: ResourceTarget | null) {
    if (resourceTarget) {
      this.router.navigate(
        [
          encodeURIComponent(resourceTarget.projectName),
          encodeURIComponent(resourceTarget.resourcePath)
        ],
        { relativeTo: this.route }
      );
    } else {
      this.router.navigate(['.'], { relativeTo: this.route });
    }
  }
}
