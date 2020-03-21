import { TestBed } from '@angular/core/testing';

import { MerchantScheduleService } from './merchant-schedule.service';

describe('MerchantScheduleService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MerchantScheduleService = TestBed.get(MerchantScheduleService);
    expect(service).toBeTruthy();
  });
});
