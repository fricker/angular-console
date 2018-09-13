
import { Injectable } from '@angular/core';
/*
import { ActivatedRoute } from '@angular/router';
import { of, Observable } from 'rxjs';
import { map, switchMap, tap, publishReplay, refCount } from 'rxjs/operators';

import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';

import { ResourceConfig } from '../resource-config';
import { ResourceMetadata } from './resource-metadata';
*/

@Injectable()
export class ResourceMetadataService {

    /*
    constructor(private readonly apollo: Apollo) {}

    prepare(activatedRoute: ActivatedRoute, tapResourceConfig: (resourceConfig: ResourceConfig) => void): Observable<ResourceConfig> {

        const resourceParams$ = activatedRoute.params.pipe(
          map(params => {
            console.log('ResourceMetadataService.prepare - params', params); // TESTING
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
          tap(tapResourceConfig),
          publishReplay(1),
          refCount()
        );
    }

    createMetadata(): ResourceMetadata {
        return new ResourceMetadata();
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
    */
  }
