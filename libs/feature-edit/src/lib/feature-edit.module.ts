import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import {
  MatIconModule,
  MatListModule,
  MatOptionModule
} from '@angular/material';
import { Route, RouterModule } from '@angular/router';
import { UiModule } from '@angular-console/ui';

import { MetadataService } from './resources/metadata.service';
import { ResourceService } from './resource/resource.service';
import { ResourcesComponent } from './resources/resources.component';
import { ResourceComponent } from './resource/resource.component';
import { EditorComponent } from './editor/editor.component';
import { ContentModule } from './content/content.module';

export const editRoutes: Route[] = [
  {
    path: '',
    component: ResourcesComponent,
    children: [
      { path: ':project/:resource', component: ResourceComponent },
      { path: '', pathMatch: 'full', component: ResourceComponent }
    ]
  }
];

@NgModule({
  imports: [
    MatIconModule,
    MatListModule,
    FlexLayoutModule,
    MatOptionModule,
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    UiModule,
    ContentModule
  ],
  providers: [MetadataService, ResourceService],
  declarations: [ResourcesComponent, ResourceComponent, EditorComponent]
})
export class FeatureEditModule {}
