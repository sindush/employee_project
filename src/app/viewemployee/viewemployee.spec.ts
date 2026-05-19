import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Viewemployee } from './viewemployee';

describe('Viewemployee', () => {
  let component: Viewemployee;
  let fixture: ComponentFixture<Viewemployee>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Viewemployee]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Viewemployee);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
