
import { Injectable } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { map, switchMap, filter, startWith, distinctUntilChanged } from 'rxjs/operators';

import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { Project } from '@angular-console/schema';
import { Task, TaskCollections, TaskCollection } from '@angular-console/ui';

export const PLATFORMS = ['web', 'mobile', 'vr'];

export type PlatformType = 'web' | 'mobile' | 'vr';

export interface MetaProject extends Project {
  platformType?: PlatformType;
  meta: string[];
}

export interface ResourceTarget {
    projectName: string;
    resourcePath: string;
    platformType?: PlatformType;
}

@Injectable()
export class MetadataService {

  constructor(
    private readonly apollo: Apollo,
    private readonly router: Router
  ) {}

  getProjects(route: ActivatedRoute): Observable<Array<MetaProject>> {
    return route.params.pipe(
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

  getSelectedResource(route: ActivatedRoute): Observable<ResourceTarget> {
    return this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(null),
      map(() => {
        console.log('*** MetadataService.selectedResource$ - route.snapshot', route.snapshot); // TESTING
        const firstChild = route.snapshot.firstChild;
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
  }

  getResourceTasks(projects$: Observable<Array<MetaProject>>,
                   selectedResource$: Observable<ResourceTarget>):
                   Observable<TaskCollections<ResourceTarget>> {
    return combineLatest(projects$, selectedResource$).pipe(
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
  }

  navigateToResource(route: ActivatedRoute, resourceTarget: ResourceTarget | null) {
    console.log('*** ResourcesComponent.navigateToResource', resourceTarget); // TESTING
    if (resourceTarget) {
      const resourcePath = resourceTarget.platformType ? resourceTarget.platformType + '/' + resourceTarget.resourcePath : resourceTarget.resourcePath;
      this.router.navigate(
        [
          encodeURIComponent(resourceTarget.projectName),
          encodeURIComponent(resourcePath)
        ],
        { relativeTo: route }
      );
    } else {
      this.router.navigate(['.'], { relativeTo: route });
    }
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
/*
    private activatedRoute: ActivatedRoute;

    constructor(
        private readonly apollo: Apollo,
        private readonly router: Router,
        private readonly finder: Finder
      ) {}

    prepare(activatedRoute: ActivatedRoute): Observable<Array<Project>> {
      console.log('ProjectMetadataService.prepare', activatedRoute); // TESTING
        this.activatedRoute = activatedRoute;
        return activatedRoute.params.pipe(
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
    }

    createMetadata(project: Project): ProjectMetadata {
        return new ProjectMetadata(project, this.finder)
    }

    handleCommand(command: any) {
        console.log('ProjectMetadataService.handleCommand', command); // TESTING
        if (command.detail.name === 'navigateTo') {
          const resourceTarget: ResourceTarget = {
            projectName: command.detail.projectName,
            resourcePath: command.detail.resourcePath
          };
          if (command.detail.platformType) {
            resourceTarget.platformType = command.detail.platformType;
          }
          this.navigateToResource(resourceTarget);
        }
    }

    navigateToResource(resourceTarget: ResourceTarget | null) {
      console.log('ProjectMetadataService.navigateToResource', resourceTarget); // TESTING
      if (resourceTarget) {
          const resourcePath = resourceTarget.platformType ?
            resourceTarget.platformType + '/' + resourceTarget.resourcePath :
            resourceTarget.resourcePath;
          this.router.navigate(
            [
              encodeURIComponent(resourceTarget.projectName),
              encodeURIComponent(resourceTarget.resourcePath)
            ],
            { relativeTo: this.activatedRoute }
          );
        } else {
          this.router.navigate(['.'], { relativeTo: this.activatedRoute });
        }
    }
*/
}
