import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChargeItemListComponent } from './charge-item-list.component';

describe('ChargeItemListComponent', () => {
  let component: ChargeItemListComponent;
  let fixture: ComponentFixture<ChargeItemListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChargeItemListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChargeItemListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
