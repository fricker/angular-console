import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiModule } from '@angular-console/ui';
import { EntityComponent } from './entity.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, UiModule],
  declarations: [EntityComponent],
  exports: [EntityComponent]
})
export class EntityModule {}
