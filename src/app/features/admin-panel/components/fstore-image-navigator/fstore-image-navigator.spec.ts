import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FstoreImageNavigator } from './fstore-image-navigator';

describe('FstoreImageNavigator', () => {
  let component: FstoreImageNavigator;
  let fixture: ComponentFixture<FstoreImageNavigator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FstoreImageNavigator]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FstoreImageNavigator);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
