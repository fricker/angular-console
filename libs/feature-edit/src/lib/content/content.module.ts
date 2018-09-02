import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiModule } from '@angular-console/ui';
import { ContentComponent } from './content.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, UiModule],
  declarations: [ContentComponent],
  exports: [ContentComponent]
})
export class ContentModule {}
