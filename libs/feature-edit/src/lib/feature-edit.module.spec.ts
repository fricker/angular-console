
import { async, TestBed } from '@angular/core/testing';
import { FeatureEditModule } from './feature-edit.module';

describe('FeatureEntitiesModule', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ FeatureEditModule ]
    })
    .compileComponents();
  }));

  it('should create', () => {
    expect(FeatureEditModule).toBeDefined();
  });
});