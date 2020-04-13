import { Injectable } from '@angular/core';
import * as moment from 'moment';

const N_WEEKS = 2;

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {

  constructor() { }

  // ---------------------------------------
  // args:
  // n -- dow -- 2
  // baseTime -- '23:59:00'
  // dayOffset -- 1
  // myDateTime -- '2020-03-23 23:58:00'
  // return '2020-03-24'
  // getBaseDate(n, baseTime, dayOffset, myDateTime) {
  //   const today = moment(myDateTime).format('YYYY-MM-DD');
  //   const dt = today + ' ' + baseTime;
  //   const lastDow = moment(dt).day(n - 7);
  //   const dow = moment(dt).day(n);
  //   const nextDow = moment(dt).day(n + 7);

  //   const d = moment(myDateTime).add(dayOffset, 'days');
  //   if (d.isAfter(lastDow) && d.isSameOrBefore(dow)) {
  //     return dow.format('YYYY-MM-DD');
  //   } else if (d.isAfter(dow) && d.isSameOrBefore(nextDow)) {
  //     return nextDow.format('YYYY-MM-DD');
  //   } else {
  //     return nextDow.format('YYYY-MM-DD');
  //   }
  // }

  patchTime(s) {
    const [h, m] = s.split(':').map(x => +x);
    return (h > 9 ? h : '0' + h) + ':' + (m > 9 ? m : '0' + m) + ':00';
  }

  // myDateTime -- '2020-03-23T23:58:00.000Z'
  // orderEndList -- [{dow:2, time:'10:00'}, {dow:3, time:'23:59'}, {dow:5, time: '23:59'}]
  // deliverDowList -- [2,4,6]
  // return moment list
  getBaseDateList(myDateTime, orderEndList, deliverDowList) {
    const sMyDate = moment.utc(myDateTime).format('YYYY-MM-DD');

    const orderEnds = [];
    orderEndList.map(oe => {
      const n = +oe.dow;
      const t = this.patchTime(oe.time);
      const dt = sMyDate + 'T' + t + '.000Z';
      orderEnds.push(moment.utc(dt).day(n));    // current
      orderEnds.push(moment.utc(dt).day(n + 7)); // next
    });

    const latestOrderEnd = this.getLatest(myDateTime, orderEnds);
    const delivers = [];
    deliverDowList.map(dow => {
      const n = +dow;
      const dt = sMyDate + 'T00:00:00.000Z';
      const current = moment.utc(dt).day(n);
      const next = moment.utc(dt).day(n + 7);
      const other = moment.utc(dt).day(n + 14);
      if (current.isAfter(latestOrderEnd)) {
        delivers.push(current);
      } else if (next.isAfter(latestOrderEnd)) {
        delivers.push(next);
      } else {
        delivers.push(other);
      }
    });
    return delivers.sort((a, b) => {
      if (a.isAfter(b)) {
        return 1;
      } else {
        return -1;
      }
    });
  }

  // myDateTime -- '2020-03-23T23:58:00.000Z'
  // ms --- moment objects
  // return moment object
  getLatest(myDateTime, ms) {
    const now = moment.utc(myDateTime);
    const a = ms.filter(oe => oe.isAfter(now));

    if (a.length === 1) {
      return a[0];
    } else {
      let latest = a[0];
      for (let i = 1; i < a.length; i++) {
        if (a[i].isBefore(latest)) {
          latest = a[i];
        }
      }
      return latest;
    }
  }

  getEarliest(ms) {
    if (ms.length === 1) {
      return ms[0];
    } else {
      let t = ms[0];
      for (let i = 1; i < ms.length; i++) {
        if (ms[i].isBefore(t)) {
          t = ms[i];
        }
      }
      return t;
    }
  }

  getLast(ms) {
    if (ms.length === 1) {
      return ms[0];
    } else {
      let t = ms[0];
      for (let i = 1; i < ms.length; i++) {
        if (ms[i].isAfter(t)) {
          t = ms[i];
        }
      }
      return t;
    }
  }

  // delivers --- special deliver date time, '2020-03-31T11:20'
  // return moment object array.
  // orderEndList
  getSpecialSchedule(myDateTime: string, delivers: string[]) {
    // const sMyDate = moment.utc(myDateTime).format('YYYY-MM-DD');
    const ds = [];
    delivers.map((d: string) => {
      const s = d + ':00.000Z';
      const orderEnd = moment.utc(s).add(-1, 'days');
      const deliver = moment.utc(s);
      ds.push({ orderEnd, deliver });
    });

    const rs = ds.filter(m => m.orderEnd.isAfter(moment.utc(myDateTime)));
    return rs.map(r => {
      return { date: r.deliver.format('YYYY-MM-DD'), time: r.deliver.format('HH:mm'), quantity: 0 };
    });
  }

  // baseList --- ['2020-03-24T00:00:00.000Z']
  // deliverTimeList eg. ['11:20']
  // return [{ date, time, quantity }];
  getDeliverySchedule(baseList, deliverTimeList) {
    const list = [];
    if (baseList && baseList.length > 0) {
      for (let i = 0; i < N_WEEKS; i++) {
        const dateList = baseList.map(b => moment.utc(b).add(7 * i, 'days').format('YYYY-MM-DD'));
        dateList.map(d => {
          deliverTimeList.map(t => {
            // const taxRate = product.taxRate !== null ? product.taxRate : 0;
            list.push({ date: d, time: t, quantity: 0 });
            // , quantity:0, price: product.price, cost: product.cost, taxRate });
          });
        });
      }
      return list;
    } else {
      return list;
    }
  }
}
