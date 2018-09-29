
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of, Observable } from 'rxjs';
import { map, switchMap, tap, publishReplay, refCount } from 'rxjs/operators';

import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';

import { ResourceTarget } from './resource-target';
import { ResourceConfig } from './resource-config';

const REQUIRED_PARAMS = ['path', 'project', 'resource'];

@Injectable()
export class ResourceService {

  constructor(private readonly apollo: Apollo) {}

  getConfiguration(route: ActivatedRoute, tapConfig: (resourceConfig: ResourceConfig) => void): Observable<ResourceConfig> {

    const resourceParams$ = route.params.pipe(
      map(params => {
        if (!params.project || !params.resource) return null;
        return {
          workspacePath: params.path,
          projectName: decodeURIComponent(params.project),
          resourcePath: decodeURIComponent(params.resource)
        };
      })
    );

    return resourceParams$.pipe(
      switchMap(params => {
        if (!params) {
          return of();
        }
        return this.apollo.query({
          query: gql`
            query($workspacePath: String!, $projectName: String!, $resourcePath: String!) {
              resource(workspace: $workspacePath, project: $projectName, path: $resourcePath) {
                projectType,
                projectName,
                path,
                content,
                context
              }
            }
          `,
          variables: params
        });
      }),
      map((response: any) => {
        const resource = response.data.resource;
        const context = JSON.parse(resource.context);
        const resourceTarget: ResourceTarget = {
          projectName: resource.projectName,
          projectType: resource.projectType,
          resourcePath: resource.path
        };
        const resourceConfig: ResourceConfig = {
          target: resourceTarget,
          contentType: this.getContentType(resource.path, context),
          content: JSON.parse(resource.content),
          context: context
        };
        Object.keys(route.snapshot.params).filter(key => !REQUIRED_PARAMS.includes(key)).forEach((key) => {
          if (!resourceTarget.params) {
            resourceTarget.params = {};
          }
          resourceTarget.params[key] = route.snapshot.params[key];
        });
        return resourceConfig;
      }),
      tap(tapConfig),
      publishReplay(1),
      refCount()
    );
  }

  getContextTitle(resourceTarget: ResourceTarget): string {
    const platformType = resourceTarget.platformType ?
                         resourceTarget.platformType :
                         resourceTarget.resourcePath.substring(0, resourceTarget.resourcePath.indexOf('/'));
    if (resourceTarget.projectType === 'application' || resourceTarget.projectName === platformType) {
      return resourceTarget.projectName;
    }
    return resourceTarget.projectName + ' - ' + platformType;
  }

  getResourceTitle(resourceTarget: ResourceTarget): string | undefined {
    if (resourceTarget) {
      let resourceTitle: string;
      if (resourceTarget.projectType === 'application') {
        resourceTitle = resourceTarget.resourcePath;
      } else {
        resourceTitle = resourceTarget.resourcePath.substring(resourceTarget.resourcePath.indexOf('/') + 1);
      }
      if (resourceTarget.params && resourceTarget.params.module) {
        resourceTitle += '#' + resourceTarget.params.module;
      }
      return resourceTitle;
    }
  }

  protected getContentType(resourcePath: string, context: any): string {
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
