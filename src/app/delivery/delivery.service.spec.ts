import { TestBed } from '@angular/core/testing';

import { DeliveryService } from './delivery.service';
import * as moment from 'moment';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

describe('DeliveryService', () => {
  beforeEach(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

    TestBed.configureTestingModule({

    });
  }
  );

  it('should be created', () => {
    const service: DeliveryService = TestBed.get(DeliveryService);
    expect(service).toBeTruthy();
  });

  // it('should be this Tuesday', () => {
  //   const service: DeliveryService = TestBed.get(DeliveryService);
  //   const myDateTime = '2020-03-25 23:58:00';
  //   const date = service.getBaseDate(4, '23:59:00', 1, myDateTime);
  //   expect(date).toBe('2020-03-26');
  // });

  // it('should be next Tuesday', () => {
  //   const service: DeliveryService = TestBed.get(DeliveryService);
  //   const myDateTime = '2020-03-25 23:59:01';
  //   const date = service.getBaseDate(4, '23:59:00', 1, myDateTime);
  //   expect(date).toBe('2020-04-02');
  // });


  // myDateTime -- '2020-03-23 23:58:00'
  // ms --- moment objects
  // getLatest(myDateTime, ms)
  it('getLatest should be 03-25', () => {
    const service: DeliveryService = TestBed.get(DeliveryService);
    const myDateTime = '2020-03-25T23:58:00.000Z';
    const ms = [moment.utc('2020-03-24T23:59:00.000Z'), moment.utc('2020-03-25T23:59:00.000Z'), moment.utc('2020-03-27T23:59:00.000Z')];
    const date = service.getLatest(myDateTime, ms);
    expect(date.format('YYYY-MM-DD')).toBe('2020-03-25');
  });

  it('getLatest should be 03-27', () => {
    const service: DeliveryService = TestBed.get(DeliveryService);
    const myDateTime = '2020-03-25T23:58:00.000Z';
    const ms = [moment.utc('2020-03-24T23:59:00.000Z'), moment.utc('2020-03-27T23:59:00.000Z')];
    const date = service.getLatest(myDateTime, ms);
    expect(date.format('YYYY-MM-DD')).toBe('2020-03-27');
  });

  it('getLatest should be 04-07', () => {
    const service: DeliveryService = TestBed.get(DeliveryService);
    const myDateTime = '2020-04-07T23:58:00.000Z';
    const ms = [moment.utc('2020-04-07T23:59:00.000Z'), moment.utc('2020-04-08T23:59:00.000Z')];
    const date = service.getLatest(myDateTime, ms);
    expect(date.format('YYYY-MM-DD')).toBe('2020-04-07');
  });

  // myDateTime -- '2020-03-23 23:58:00'
  // orderEndList -- [{dow:2, time:'10:00'}, {dow:3, time:'23:59'}, {dow:5, time: '23:59'}]
  // deliverDowList -- [2,4,6]
  it('getBaseDateList should be this Tuesday', () => {
    const service: DeliveryService = TestBed.get(DeliveryService);
    const myDateTime = '2020-03-25T23:58:00.000Z';
    const oeList = [{ dow: 1, time: '23:59' }, { dow: 3, time: '23:59' }, { dow: 5, time: '23:59' }];
    const dates = service.getBaseDateList(myDateTime, oeList, [2, 4, 6]);
    // dates.map(d => console.log(d.format('YYYY-MM-DD')));
    expect(dates[0].format('YYYY-MM-DD')).toBe('2020-03-26');
    expect(dates[1].format('YYYY-MM-DD')).toBe('2020-03-28');
    expect(dates[2].format('YYYY-MM-DD')).toBe('2020-03-31');
  });

  it('getBaseDateList should be this Tuesday', () => {
    const service: DeliveryService = TestBed.get(DeliveryService);
    const myDateTime = '2020-03-27T23:58:00.000Z';
    const oeList = [{ dow: 1, time: '23:59' }, { dow: 3, time: '23:59' }, { dow: 5, time: '23:59' }];
    const dates = service.getBaseDateList(myDateTime, oeList, [2, 4, 6]);
    // dates.map(d => console.log(d.format('YYYY-MM-DD')));
    expect(dates[0].format('YYYY-MM-DD')).toBe('2020-03-28');
    expect(dates[1].format('YYYY-MM-DD')).toBe('2020-03-31');
    expect(dates[2].format('YYYY-MM-DD')).toBe('2020-04-02');
  });

  it('getBaseDateList should be this Tuesday', () => {
    const service: DeliveryService = TestBed.get(DeliveryService);
    const myDateTime = '2020-03-29T23:58:00.000Z';
    const oeList = [{ dow: 1, time: '23:59' }, { dow: 3, time: '23:59' }, { dow: 5, time: '23:59' }];
    const dates = service.getBaseDateList(myDateTime, oeList, [2, 4, 6]);
    // dates.map(d => console.log(d.format('YYYY-MM-DD')));
    expect(dates[0].format('YYYY-MM-DD')).toBe('2020-03-31');
    expect(dates[1].format('YYYY-MM-DD')).toBe('2020-04-02');
    expect(dates[2].format('YYYY-MM-DD')).toBe('2020-04-04');
  });


  it('getBaseDateList should be this Tuesday', () => {
    const service: DeliveryService = TestBed.get(DeliveryService);
    const myDateTime = '2020-03-30T23:12:00.000Z';
    const oeList = [{ dow: 1, time: '8:59' }, { dow: 3, time: '8:59' }, { dow: 5, time: '8:59' }];
    const dates = service.getBaseDateList(myDateTime, oeList, [5]);
    // dates.map(d => console.log(d.format('YYYY-MM-DD')));
    expect(dates[0].format('YYYY-MM-DD')).toBe('2020-04-03');
  });

  it('getBaseDateList should be this Tuesday', () => {
    const service: DeliveryService = TestBed.get(DeliveryService);
    const myDateTime = '2020-03-30T23:12:00.000Z';
    const oeList = [
      { dow: 0, time: '8:59' },
      { dow: 1, time: '8:59' },
      { dow: 2, time: '8:59' },
      { dow: 3, time: '8:59' },
      { dow: 4, time: '8:59' },
      { dow: 5, time: '8:59' }
    ];
    const dates = service.getBaseDateList(myDateTime, oeList, [5]);
    // dates.map(d => console.log(d.format('YYYY-MM-DD')));
    expect(dates[0].format('YYYY-MM-DD')).toBe('2020-04-03');
  });

  it('getBaseDateList should be this Tuesday', () => {
    const service: DeliveryService = TestBed.get(DeliveryService);
    const myDateTime = '2020-03-31T10:12:00.000Z';
    const oeList = [
      { dow: 1, time: '8:59' },
      { dow: 2, time: '8:59' },
      { dow: 3, time: '8:59' },
      { dow: 4, time: '8:59' },
      { dow: 5, time: '8:59' },
      { dow: 0, time: '8:59' }
    ];
    const dates = service.getBaseDateList(myDateTime, oeList, [1, 3, 5]);
    // dates.map(d => console.log(d.format('YYYY-MM-DD')));
    expect(dates[0].format('YYYY-MM-DD')).toBe('2020-04-03');
  });

  it('getBaseDateList should be this Tuesday', () => {
    const service: DeliveryService = TestBed.get(DeliveryService);
    const myDateTime = '2020-03-31T08:52:00.000Z';
    const oeList = [
      { dow: 1, time: '8:59' },
      { dow: 2, time: '08:59' },
      { dow: 3, time: '08:59' },
      { dow: 4, time: '08:59' },
      { dow: 5, time: '08:59' },
      { dow: 0, time: '08:59' }
    ];
    const dates = service.getBaseDateList(myDateTime, oeList, [1, 3, 5]);
    // dates.map(d => console.log(d.format('YYYY-MM-DD')));
    expect(dates[0].format('YYYY-MM-DD')).toBe('2020-04-01');
  });


  it('getBaseDateList should be this Tuesday', () => {
    const service: DeliveryService = TestBed.get(DeliveryService);
    const myDateTime = '2020-03-31T10:12:00.000Z';
    const oeList = [
      { dow: 1, time: '8:59' },
      { dow: 2, time: '8:59' },
      { dow: 3, time: '8:59' },
      { dow: 4, time: '8:59' },
      { dow: 5, time: '8:59' },
      { dow: 0, time: '8:59' }
    ];
    const baseDates = service.getBaseDateList(myDateTime, oeList, [1, 3, 5]);
    const dates = baseDates.map(b => b.format('YYYY-MM-DD'));
    const rs = service.getDeliverySchedule(dates, ['11:20']);
    // rs.map(d => console.log(d.date));
    expect(rs[0].date).toBe('2020-04-03');
  });

  it('getBaseDateList should be this Thursday', () => {
    const service: DeliveryService = TestBed.get(DeliveryService);
    const myDateTime = '2020-04-08T13:12:00.000Z';
    const oeList = [
      { dow: 1, time: '23:59' },
      { dow: 2, time: '23:59' },
      { dow: 3, time: '23:59' },
      { dow: 4, time: '23:59' },
      { dow: 5, time: '23:59' },
      { dow: 0, time: '23:59' }
    ];
    const baseDates = service.getBaseDateList(myDateTime, oeList, [2, 4, 6]);
    const dates = baseDates.map(b => b.format('YYYY-MM-DD'));
    const rs = service.getDeliverySchedule(dates, ['11:20']);
    expect(rs[0].date).toBe('2020-04-09');
  });

  it('getSpecialSchedule should be this Tuesday', () => {
    const service: DeliveryService = TestBed.get(DeliveryService);
    const myDateTime = '2020-03-30T11:20:00.000Z';
    const ss = service.getSpecialSchedule(myDateTime, ['2020-04-05T11:20']);
    // rs.map(d => console.log(d.date));
    expect(ss[0].date).toBe('2020-04-05'); // .format('YYYY-MM-DD')
  });

  it('getSpecialSchedule should be this Tuesday', () => {
    const service: DeliveryService = TestBed.get(DeliveryService);
    const myDateTime = '2020-04-04T11:21:00.000Z';
    const ss = service.getSpecialSchedule(myDateTime, ['2020-04-05T11:20']);
    // rs.map(d => console.log(d.date));
    expect(ss.length).toBe(0); // .format('YYYY-MM-DD')
  });
});
