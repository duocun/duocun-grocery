import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QuitMerchantDialogComponent } from './quit-merchant-dialog.component';

describe('QuitMerchantDialogComponent', () => {
  let component: QuitMerchantDialogComponent;
  let fixture: ComponentFixture<QuitMerchantDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QuitMerchantDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuitMerchantDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
