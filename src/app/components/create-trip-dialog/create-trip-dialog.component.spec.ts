import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateTripDialogComponent } from './create-trip-dialog.component';

describe('CreateTripDialogComponent', () => {
  let component: CreateTripDialogComponent;
  let fixture: ComponentFixture<CreateTripDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateTripDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateTripDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
