import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FstoreMovieNavigator } from './fstore-movie-navigator';

describe('FstoreMovieNavigator', () => {
  let component: FstoreMovieNavigator;
  let fixture: ComponentFixture<FstoreMovieNavigator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FstoreMovieNavigator]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FstoreMovieNavigator);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
