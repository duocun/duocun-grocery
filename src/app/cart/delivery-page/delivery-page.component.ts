import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ProductService } from '../../product/product.service';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { NgRedux } from '@angular-redux/store';
import { IAppState } from '../../store';
import * as moment from 'moment';
import { CartActions } from '../cart.actions';
import { CartService } from '../cart.service';
import { MerchantScheduleService } from '../../merchant/merchant-schedule.service';
import { AreaService } from '../../area/area.service';
import { DeliveryService } from '../../delivery/delivery.service';
import { MerchantService } from '../../merchant/merchant.service';

const baseTimeList = ['11:00'];
export const AppType = {
  FOOD_DELIVERY: 'F',
  GROCERY: 'G',
  FRESH: 'F',
  TELECOM: 'T'
};
@Component({
  selector: 'app-delivery-page',
  templateUrl: './delivery-page.component.html',
  styleUrls: ['./delivery-page.component.scss']
})
export class DeliveryPageComponent implements OnInit {
  deliveries = [];
  onDestroy$ = new Subject();
  cart;
  product;
  button;
  amount;
  location;
  inRange = true;
  areas;
  schedule;
  loading = false;
  constructor(
    private productSvc: ProductService,
    private merchantSvc: MerchantService,
    private merchantScheduleSvc: MerchantScheduleService,
    private cartSvc: CartService,
    private areaSvc: AreaService,
    private deliverySvc: DeliveryService,
    private router: Router,
    private route: ActivatedRoute,
    private rx: NgRedux<IAppState>
  ) {
    this.rx.select('cart').pipe(takeUntil(this.onDestroy$)).subscribe((cart: any) => {
      this.cart = cart;
      // following for quantity input change
      if (this.schedule && this.product) {
        const productId = this.product._id;
        this.deliveries = this.mergeQuantity(this.schedule, cart, productId);
        this.amount = this.cartSvc.getTotal(cart);
      }
    });
    this.rx.select('delivery').pipe(takeUntil(this.onDestroy$)).subscribe((d: any) => {
      this.location = d.origin;
    });
  }

  ngOnInit() {
    this.loading = true;
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      const productId = params['id'];
      this.monunt(productId, this.cart).then(() => {
        this.loading = false;
      });
    });
  }

  // baseList --- ['2020-03-24']
  // baseTimeList eg. ['11:20']
  // return [{ date, time, quantity }];
  getDeliverySchedule(merchant, baseList, deliverTimeList) {
    if (merchant.delivers) {
      const myDateTime = moment.utc().format('YYYY-MM-DD HH:mm:ss');
      return this.deliverySvc.getSpecialSchedule(myDateTime, merchant.delivers);
    } else {
      return this.deliverySvc.getDeliverySchedule(baseList, deliverTimeList);
    }
  }

  // slots [{date, time}...]
  // cart --- { product, deliveries:[{date, time, quantity}]}
  // return [{date, time, quantity}...]
  mergeQuantity(slots, cart, productId) {
    const ds = [];
    const cartItem = cart.find(it => it.product && it.product._id === productId);

    if (cartItem && cartItem.deliveries && cartItem.deliveries.length > 0) { // try merge
      slots.map(slot => {
        const updated = cartItem.deliveries.find(d => slot.date + slot.time === d.date + d.time);
        if (updated) {
          ds.push({ ...slot, quantity: updated.quantity });
        } else {
          ds.push(slot);
        }
      });
      return ds.sort((a: any, b: any) => {
        if (moment(a.date).isAfter(moment(b.date))) {
          return 1;
        } else {
          return -1;
        }
      });
    } else {
      return slots.sort((a: any, b: any) => {
        if (moment(a.date).isAfter(moment(b.date))) {
          return 1;
        } else {
          return -1;
        }
      });
    }
  }

  // n -- dow
  getBaseDateList(orderEndList, deliverDowList) {
    const myDateTime = moment().format('YYYY-MM-DDTHH:mm:ss') + '.000Z';

    const bs = this.deliverySvc.getBaseDateList(myDateTime, orderEndList, deliverDowList);
    return bs.map(b => b.toISOString());
    // return this.deliverySvc.getBaseDate(n, BASE_TIME, ADVANCE_OFFSET, myDateTime);
  }

  monunt(productId, cart) {
    return new Promise((_resolve, reject) => {
      this.productSvc.getById(productId, ['_id', 'name', 'price', 'cost', 'taxRate', 'merchantId']).then((product: any) => {
        const merchantId = product.merchantId;
        this.merchantSvc.quickFind({ _id: merchantId }).then((ms) => {
          const merchant = ms[0];
          const orderEndList = merchant.rules.map(r => r.orderEnd);
          const location = this.location;
          this.product = product;
          this.merchantScheduleSvc.getAvailableSchedules(merchantId, location).then((schedules: any[]) => {
            if (schedules && schedules.length > 0) {
              const dows = schedules[0].rules.map(r => +r.deliver.dow);
              // const bs = dows.length > 0 ? dows.map(dow => this.getBaseDate(dow)) : [];
              const bs = this.getBaseDateList(orderEndList, dows);
              this.inRange = true;
              this.schedule = this.getDeliverySchedule(merchant, bs, baseTimeList);
              this.deliveries = this.mergeQuantity(this.schedule, cart, productId);
              this.amount = this.cartSvc.getTotal(cart);
              _resolve();
            } else {
              this.areaSvc.quickFind({ appType: AppType.GROCERY }).then(areas => {
                this.inRange = false;
                this.areas = areas;
                _resolve();
              });
            }
          });
        });
      });
    });
  }

  onDeliveryItemChange(e) {
    const product = this.product;
    const delivery = e;

    this.rx.dispatch({ type: CartActions.UPDATE_QUANTITY, payload: { product, delivery } });
  }

  onNext() {
    this.router.navigate(['merchant/list/' + this.product.merchantId]);
  }
}
