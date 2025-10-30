import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FstoreVideoNavigator } from './fstore-video-navigator';

describe('FstoreVideoNavigator', () => {
  let component: FstoreVideoNavigator;
  let fixture: ComponentFixture<FstoreVideoNavigator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FstoreVideoNavigator]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FstoreVideoNavigator);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
