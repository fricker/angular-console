import { Component, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Task, TaskCollections, TaskCollection } from '@angular-console/ui';
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
import { PLATFORMS, PlatformType, ResourceTarget } from '../resource/resource-tasks';

export interface MetaProject extends Project {
  platformType?: PlatformType;
  meta: string[];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mbd-resources',
  templateUrl: './resources.component.html',
  styleUrls: ['./resources.component.scss']
})
export class ResourcesComponent /*implements OnInit, OnDestroy*/ {

  private readonly projects$: Observable<Array<MetaProject>> = this.route.params.pipe(
    map(m => m.path),
    switchMap(path => {
      return this.apollo.watchQuery({
        pollInterval: 5000,
        query: gql`
          query($path: String!) {
            metadata(path: $path) {
              projects {
                name
                root
                projectType,
                platformType,
                meta
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
      return [...((r as any).data.metadata.projects)];
    })
  );

  private readonly selectedResource$: Observable<ResourceTarget> = this.router.events.pipe(
    filter(event => event instanceof NavigationEnd),
    startWith(null),
    map(() => {
      console.log('*** ResourcesComponent.selectedResource$ - route.snapshot', this.route.snapshot); // TESTING
      const firstChild = this.route.snapshot.firstChild;
      if (firstChild) {
        const projectName = decodeURIComponent(firstChild.params.project);
        const resourcePath = decodeURIComponent(firstChild.params.resource);
        const resourceSegments = resourcePath.split('/');
        if (resourceSegments.length && PLATFORMS.indexOf(resourceSegments[0]) !== -1) {
          const platformType = resourceSegments[0];
          resourceSegments.splice(0, 1);
          return {
            projectName: projectName,
            resourcePath: resourceSegments.join('/'),
            platformType: platformType
          };
        }
        return {
          projectName: projectName,
          resourcePath: resourcePath
        };
      }
      return {
        projectName: '',
        resourcePath: ''
      };
    }),
    distinctUntilChanged(
      (a: ResourceTarget, b: ResourceTarget) => {
        console.log('*** ResourcesComponent.distinctUntilChanged',
          a.projectName === b.projectName &&
          a.resourcePath === b.resourcePath &&
          a.platformType === b.platformType); // TESTING
        return a.projectName === b.projectName &&
               a.resourcePath === b.resourcePath &&
               a.platformType === b.platformType;
      }
    )
  );

  // private resourceTasksSubject = new ReplaySubject<TaskCollections<ResourceTarget>>(1);
  // readonly resourceTasks$ = this.resourceTasksSubject.asObservable();

  /*
  readonly workspaceProjects$: Observable<ResourceTasks<ProjectMetadata>> =
    combineLatest(this.projects$, this.selectedResource$).pipe(
      map(([projects, resource]) => {
        const metadataArray: Array<ProjectMetadata> = projects.map(
          project => new ProjectMetadata(project, this.finder)
        );
        return new ResourceTasks<ProjectMetadata>(this.route.snapshot.params.path, metadataArray, resource, ['templates']);
      })
    );
  */

 readonly resourceTasks$: Observable<TaskCollections<ResourceTarget>> =
  combineLatest(this.projects$, this.selectedResource$).pipe(
    map(([projects, target]) => {
      const collections: Array<TaskCollection<ResourceTarget>> = projects.map(project => {
        const collectionName = project.platformType ? project.name + ' - ' + project.platformType : project.name;
        const collection: TaskCollection<ResourceTarget> =  {
          collectionName: collectionName,
          tasks: []
        };
        project.meta.forEach((metaFile) => {
          const task: ResourceTarget = {
            projectName: project.name,
            resourcePath: metaFile
          };
          if (project.platformType) {
            task.platformType = project.platformType;
          }
          collection.tasks.push({
            taskName: metaFile,
            task: task
          });
        });
        return collection;
      });
      const selectedTask = this.getSelectedTask(collections, target);
      console.log('*** ResourcesComponent.resourceTasks$ - selectedTask', selectedTask); // TESTING
      const taskCollections: TaskCollections<ResourceTarget> = {
        selectedTask: selectedTask,
        taskCollections: collections
      };
      return taskCollections;
    })
  );

  // private projectsub: Subscription;

  constructor(
    private readonly apollo: Apollo,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly finder: Finder,
    private readonly metadataService: ProjectMetadataService
  ) {}

  /*
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
  */

  private getSelectedTask(collections: Array<TaskCollection<ResourceTarget>>, target: ResourceTarget): Task<ResourceTarget> | null {
    if (!target.projectName || !target.resourcePath) {
      return null;
    }
    const selectedTask = collections.reduce(
      (tasks, collection) => [...tasks, ...collection.tasks],
      [] as Array<Task<ResourceTarget>>
    ).find(
      ({ task }) =>
        task.projectName === target.projectName &&
        task.resourcePath === target.resourcePath &&
        task.platformType === target.platformType
    );
    return selectedTask || null;
  }

  navigateToResource(resourceTarget: ResourceTarget | null) {
    console.log('*** ResourcesComponent.navigateToResource', resourceTarget); // TESTING
    if (resourceTarget) {
      const resourcePath = resourceTarget.platformType ? resourceTarget.platformType + '/' + resourceTarget.resourcePath : resourceTarget.resourcePath;
      this.router.navigate(
        [
          encodeURIComponent(resourceTarget.projectName),
          encodeURIComponent(resourcePath)
        ],
        { relativeTo: this.route }
      );
    } else {
      this.router.navigate(['.'], { relativeTo: this.route });
    }
  }
}
