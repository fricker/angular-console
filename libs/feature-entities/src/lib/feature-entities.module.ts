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

import { EntityModule } from './entity/entity.module';
import { EntityComponent } from './entity/entity.component';
import { EntitiesComponent } from './entities/entities.component';
import { EditorComponent } from './editor/editor.component';

export const entityRoutes: Route[] = [
  {
    path: '',
    component: EntitiesComponent,
    children: [
      { path: ':project/:target', component: EntityComponent },
      { path: '', pathMatch: 'full', component: EntityComponent }
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
    EntityModule
  ],
  declarations: [EntitiesComponent, EditorComponent]
})
export class FeatureEntitiesModule {}
