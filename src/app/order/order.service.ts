
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { EntityService, HttpStatus } from '../entity.service';
import { AuthService } from '../account/auth.service';
import { Observable } from 'rxjs';
import { IOrder, OrderType, OrderStatus } from './order.model';
import { PaymentMethod, PaymentStatus } from '../payment/payment.model';


@Injectable()
export class OrderService extends EntityService {
  url;

  constructor(
    public authSvc: AuthService,
    public http: HttpClient
  ) {
    super(authSvc, http);
    this.url = super.getBaseUrl() + 'Orders';
  }

  getDistinctArray(items: any, field: string) {
    const a: any[] = [];
    items.map((item: any) => {
      if (item.hasOwnProperty(field)) {
        const b = a.find(x => x[field] === item[field]);
        if (!b) {
          a.push(item);
        }
      }
    });
    return a;
  }

  getGroupDiscount(orders, bNew) {
    const a = this.getDistinctArray(orders, 'clientId');
    if (bNew) { // new order didn't insert yet
      if (a && a.length > 0) {
        return 2;
      } else {
        return 0;
      }
    } else {
      if (a && a.length > 1) {
        return 2;
      } else {
        return 0;
      }
    }
  }

  // for display purpose, update price should be run on backend
  // dateType --- string 'today', 'tomorrow'
  checkGroupDiscount(clientId: string, merchantId: string, dateType: string, address: string): Observable<any> {
    const url = this.url + '/checkGroupDiscount';
    return this.doPost(url, { clientId: clientId, merchantId: merchantId, dateType: dateType, address: address });
  }

  // pickup --- has to be '11:20' or '12:00' for now
  updateDeliveryTime(orderId: string, pickup: string): Observable<IOrder> {
    const url = this.url + '/updateDelivered';
    return this.doPatch(url, { orderId: orderId, pickup: pickup });
  }

  afterRemoveOrder(orderId: string): Observable<any> {
    const url = this.url + '/afterRemoveOrder';
    return this.doPost(url, { orderId: orderId });
  }

  // afterAddOrder( clientId: string,  merchantId: string, dateType: string,  address: string, paid: number ): Observable<any> {
  //   const url = this.url + '/afterAddOrder';
  //   return this.doPost(url, { clientId: clientId, merchantId: merchantId, dateType: dateType, address: address, paid: paid });
  // }
  loadHistory(clientId: string, currentPageNumber: number, itemsPerPage: number): Observable<any> {
    const url = this.url + '/history/' + currentPageNumber + '/' + itemsPerPage;
    return this.doGet(url, { clientId });
  }
  loadPage(filter: any, currentPageNumber: number, itemsPerPage: number): Observable<any> {
    const url = this.url + '/loadPage/' + currentPageNumber + '/' + itemsPerPage;
    return this.doGet(url, filter);
  }

  placeOrders(orders) {
    const url = this.url + '/placeOrders';
    return this.doPost(url, orders);
  }

  // cart:
  //  {date + T + time: {// map key
  //    date,
  //    time,
  //    merchantMap:
  //      { merchantId: { // map key
  //        merchant: {_id, name }, // merchant Name
  //        productMap:
  //          {productId: { // map key
  //            product: {_id, name, price, cost, taxRate},
  //            quantity
  //          }
  //        ]
  //      },
  //    ]
  //  }
  // return --- [{date, time, merchant, items: [{productId, quantity, price, cost, taxRate}] }]
  getOrderGroups(cart) { // group by date time
    const orders = [];
    const dts = Object.keys(cart);
    dts.map(dt => { //  {product, deliveries:[{date, time, quantity }]}
      const merchantMap = cart[dt].merchantMap;
      const mIds = Object.keys(merchantMap);
      const date = cart[dt].date;
      const time = cart[dt].time;
      mIds.map(mId => {
        const merchant = merchantMap[mId].merchant;
        const productMap = merchantMap[mId].productMap;
        const pIds = Object.keys(productMap);
        const order = orders.find(t => t.date === date && t.time === time && t.merchant._id === mId);
        if (order) {
          pIds.forEach(pId => {
            const product = productMap[pId].product;
            const quantity = productMap[pId].quantity;
            order.items.push({
              productId: product._id, quantity, price: product.price, cost: product.cost, taxRate: product.taxRate
            });
          });
        } else {
          pIds.forEach(pId => {
            const product = productMap[pId].product;
            const quantity = productMap[pId].quantity;
            orders.push({
              date: date,
              time: time,
              merchant: merchant,
              items: [
                { productId: product._id, quantity, price: product.price, cost: product.cost, taxRate: product.taxRate }
              ]
            });
          });
        }
      });
    });
    return orders;
  }

  // groups --- [{date, time, merchant, items: [{productId, quantity, price, cost, taxRate}] }]
  getSummary(groups, overRangeCharge) {
    let totalPrice = 0;
    let totalCost = 0;
    let totalTax = 0;
    const totalTips = 0;
    let totalOverRangeCharge = 0;
    let total = 0;

    const tips = 0;
    const groupDiscount = 0;

    if (groups && groups.length > 0) {
      groups.forEach(order => {
        let price = 0;
        let cost = 0;
        let tax = 0;
        order.items.forEach(x => {
          price += x.price * x.quantity;
          cost += x.cost * x.quantity;
          tax += Math.ceil(x.price * x.quantity * x.taxRate) / 100;
        });
        const subTotal = (price + tax + tips - groupDiscount + overRangeCharge);
        totalPrice += price;
        totalCost += cost;
        totalTax += tax;
        totalOverRangeCharge += overRangeCharge;
        total += subTotal;
      });
    }

    return {
      price: Math.round(totalPrice * 100) / 100,
      cost: Math.round(totalCost * 100) / 100,
      tips: Math.round(totalTips * 100) / 100,
      tax: Math.round(totalTax * 100) / 100,
      overRangeCharge: Math.round(totalOverRangeCharge * 100) / 100,
      deliveryCost: 0, // merchant.deliveryCost,
      deliveryDiscount: 0, // merchant.deliveryCost,
      groupDiscount, // groupDiscount,
      total: Math.round(total * 100) / 100
    };
  }

  // return --- [{date, time, items: [{_id, name, quantity, price, cost}] }]
  getChargeItems(cart) { // group by date time
    const chargeItems = [];

    const dts = Object.keys(cart);
    dts.map(dt => { //  {product, deliveries:[{date, time, quantity }]}
      const merchantMap = cart[dt].merchantMap;
      const mIds = Object.keys(merchantMap);
      const date = cart[dt].date;
      const time = cart[dt].time;

      const items = [];

      mIds.map(mId => {
        const productMap = merchantMap[mId].productMap;
        const pIds = Object.keys(productMap);
        pIds.forEach(pId => {
          const product = productMap[pId].product;
          const quantity = productMap[pId].quantity;
          const item = items.find(it => it._id === product._id);
          if (item) {
            item.quntity += quantity;
          } else {
            items.push({ ...product, quantity });
          }
        });
      });

      chargeItems.push({ date, time, items });
    });

    return chargeItems;
  }


  getCharge(group, overRangeCharge) {
    let price = 0;
    let cost = 0;
    let tax = 0;

    group.items.map(x => {
      price += x.price * x.quantity;
      cost += x.cost * x.quantity;
      tax += Math.ceil(x.price * x.quantity * x.taxRate) / 100;
    });

    const tips = 0;
    const groupDiscount = 0;
    const overRangeTotal = Math.round(overRangeCharge * 100) / 100;

    return {
      price, cost, tips, tax,
      overRangeCharge: overRangeTotal,
      deliveryCost: 0, // merchant.deliveryCost,
      deliveryDiscount: 0, // merchant.deliveryCost,
      groupDiscount, // groupDiscount,
      total: price + tax + tips - groupDiscount + overRangeTotal
    };
  }

  // // cart --- [{product, deliveries: [{date, time, quantity}] }]
  // // return --- [{date, time, items: [{productId, quantity, price, cost}] }]
  // getOrderGroups(cart) { // group by date time
  //   const orders = [];
  //   cart.map(it => { //  {product, deliveries:[{date, time, quantity }]}
  //     it.deliveries.map(d => {
  //       const order = orders.find(t => t.date === d.date && t.time === d.time);
  //       if (order) {
  //         order.items.push({
  //           productId: it.product._id, quantity: d.quantity, price: it.product.price, cost: it.product.cost,
  //           taxRate: it.product.taxRate
  //         });
  //       } else {
  //         orders.push({
  //           date: d.date,
  //           time: d.time,
  //           items: [{
  //             productId: it.product._id, quantity: d.quantity, price: it.product.price, cost: it.product.cost,
  //             taxRate: it.product.taxRate
  //           }]
  //         });
  //       }
  //     });
  //   });
  //   return orders;
  // }


  // // cart --- [{product, deliveries: [{date, time, quantity}] }]
  // // return --- {date, time, _id, name, quantity, price, cost}
  // getChargeItems(cart) { // group by date time
  //   const chargeItems = [];
  //   cart.map(it => { //  {product, deliveries:[{date, time, quantity}]}
  //     it.deliveries.map(d => {
  //       chargeItems.push({ ...d, ...it.product });
  //     });
  //   });
  //   return chargeItems;
  // }

  createOrder(account, merchant, items, location, deliverDate, deliverTime, charge, note, paymentMethod, lang) {

    // const sCreated = moment().toISOString();
    // const { deliverDate, deliverTime } = this.getDeliveryDateTimeByPhase(sCreated, merchant.phases, delivery.dateType);
    const status = (paymentMethod === PaymentMethod.CREDIT_CARD || paymentMethod === PaymentMethod.WECHAT) ?
      OrderStatus.TEMP : OrderStatus.NEW; // prepay need Driver to confirm finished

    const paymentStatus = paymentMethod === PaymentMethod.PREPAY ? PaymentStatus.PAID : PaymentStatus.UNPAID;

    const order = {
      clientId: account._id,
      clientName: account.username,
      merchantId: merchant._id,
      merchantName: lang === 'zh' ? merchant.name : merchant.nameEN,
      items,
      location,
      pickupTime: '10:00',
      deliverDate,
      deliverTime,
      type: OrderType.GROCERY,
      status,
      paymentStatus,
      paymentMethod,
      note,
      price: Math.round(charge.price * 100) / 100,
      cost: Math.round(charge.cost * 100) / 100,
      deliveryCost: Math.round(charge.deliveryCost * 100) / 100,
      deliveryDiscount: Math.round(charge.deliveryCost * 100) / 100,
      groupDiscount: Math.round(charge.groupDiscount * 100) / 100,
      overRangeCharge: Math.round(charge.overRangeCharge * 100) / 100,
      total: Math.round(charge.total * 100) / 100,
      tax: Math.round(charge.tax * 100) / 100,
      tips: Math.round(charge.tips * 100) / 100,
      defaultPickupTime: account.pickup ? account.pickup : ''
    };

    return order;
  }
}
