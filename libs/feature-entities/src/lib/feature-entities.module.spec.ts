
import { async, TestBed } from '@angular/core/testing';
import { FeatureEntitiesModule } from './feature-entities.module';

describe('FeatureEntitiesModule', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ FeatureEntitiesModule ]
    })
    .compileComponents();
  }));

  it('should create', () => {
    expect(FeatureEntitiesModule).toBeDefined();
  });
});