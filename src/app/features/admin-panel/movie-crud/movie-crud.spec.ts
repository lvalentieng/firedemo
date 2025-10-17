import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovieCrud } from './movie-crud';

describe('MovieCrud', () => {
  let component: MovieCrud;
  let fixture: ComponentFixture<MovieCrud>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovieCrud]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MovieCrud);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
