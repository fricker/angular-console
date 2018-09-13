import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';

import { ActivatedRoute } from '@angular/router';
import { TaskCollections } from '@angular-console/ui';
import {
  map,
  filter,
  startWith,
  distinctUntilChanged
} from 'rxjs/operators';
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
    private readonly route: ActivatedRoute,
    private readonly  metadataService: MetadataService
  ) {
    const projects$ = metadataService.getProjects(this.route);
    const selectedResource$ = metadataService.getSelectedResource(this.route);
    this.resourceTasks$ = metadataService.getResourceTasks(projects$, selectedResource$);
  }

  navigateToResource(resourceTarget: ResourceTarget | null) {
    this.metadataService.navigateToResource(this.route, resourceTarget);
  }
}
