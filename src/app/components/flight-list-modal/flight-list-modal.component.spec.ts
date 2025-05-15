import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlightListModalComponent } from './flight-list-modal.component';

describe('FlightListModalComponent', () => {
  let component: FlightListModalComponent;
  let fixture: ComponentFixture<FlightListModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlightListModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlightListModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
