
import { Injectable } from '@angular/core';
/*
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';

import { Project } from '@angular-console/schema';
import { Finder } from '@angular-console/utils';
import { ProjectMetadata } from './project-metadata';
import { ResourceTarget } from '../../resource/resource-tasks';
*/

@Injectable()
export class ProjectMetadataService {
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
