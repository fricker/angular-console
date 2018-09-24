
import { Injectable } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd, Params, NavigationExtras } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { map, switchMap, filter, startWith, distinctUntilChanged } from 'rxjs/operators';

import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { Project } from '@angular-console/schema';
import { Task, TaskCollections, TaskCollection } from '@angular-console/ui';
import { ResourceService } from '../resource/resource.service';
export const PLATFORMS = ['web', 'mobile', 'vr'];

export type PlatformType = 'web' | 'mobile' | 'vr';

export interface MetaProject extends Project {
  platformType?: PlatformType;
  meta: string[];
}

export interface ResourceTarget {
    title: string;
    projectName: string;
    resourcePath: string;
    platformType?: PlatformType;
    params?: Params;
}

@Injectable()
export class MetadataService {

  currentRoute: ActivatedRoute;

  constructor(
    private readonly apollo: Apollo,
    private readonly router: Router,
    private readonly resourceService: ResourceService
  ) {}

  getProjects(): Observable<Array<MetaProject>> {
    if (!this.currentRoute) {
      throw new Error('currentRoute not set on MetadataService');
    }
    return this.currentRoute.params.pipe(
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
  }

  getSelectedResource(): Observable<ResourceTarget> {
    if (!this.currentRoute) {
      throw new Error('currentRoute not set on MetadataService');
    }
    return this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(null),
      map(() => {
        const firstChild = this.currentRoute.snapshot.firstChild;
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
          return a.projectName === b.projectName &&
                 a.resourcePath === b.resourcePath &&
                 a.platformType === b.platformType;
        }
      )
    );
  }

  getResourceTasks(projects$: Observable<Array<MetaProject>>,
                   selectedResource$: Observable<ResourceTarget>):
                   Observable<TaskCollections<ResourceTarget>> {
    return combineLatest(projects$, selectedResource$).pipe(
      map(([projects, target]) => {
        const collections: Array<TaskCollection<ResourceTarget>> = projects.map(project => {
          const collectionName = this.resourceService.getContextTitle(project.projectType, project.name, project.platformType);
          const collection: TaskCollection<ResourceTarget> =  {
            collectionName: collectionName,
            tasks: []
          };
          project.meta.forEach((metaFile) => {
            const task: ResourceTarget = {
              title: metaFile,
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
        const taskCollections: TaskCollections<ResourceTarget> = {
          selectedTask: selectedTask,
          taskCollections: collections
        };
        return taskCollections;
      })
    );
  }

  navigateToResource(target: ResourceTarget | null) {
    if (!this.currentRoute) {
      throw new Error('currentRoute not set on MetadataService');
    }
    const extras: NavigationExtras = { relativeTo: this.currentRoute };
    let path: any[];
    if (target) {
      const resourcePath = target.platformType ? target.platformType + '/' + target.resourcePath : target.resourcePath;
      path = [encodeURIComponent(target.projectName), encodeURIComponent(resourcePath)];
      if (target.params) {
        path.push(target.params);
      }
    } else {
      path = ['.'];
    }
    this.router.navigate(path, extras);
  }

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
}
