import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TmdbNavigator } from './tmdb-navigator';

describe('TmdbNavigator', () => {
  let component: TmdbNavigator;
  let fixture: ComponentFixture<TmdbNavigator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TmdbNavigator]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TmdbNavigator);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
