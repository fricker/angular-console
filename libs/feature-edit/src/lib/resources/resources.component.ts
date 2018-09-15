import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';

import { ActivatedRoute } from '@angular/router';
import { TaskCollections } from '@angular-console/ui';
import { MetadataService, ResourceTarget } from './metadata.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mbd-resources',
  templateUrl: './resources.component.html',
  styleUrls: ['./resources.component.scss']
})
export class ResourcesComponent {

  resourceTasks$: Observable<TaskCollections<ResourceTarget>>;

  constructor(
    route: ActivatedRoute,
    readonly metadataService: MetadataService
  ) {
    metadataService.currentRoute = route;
    const projects$ = metadataService.getProjects();
    const selectedResource$ = metadataService.getSelectedResource();
    this.resourceTasks$ = metadataService.getResourceTasks(projects$, selectedResource$);
  }
}
