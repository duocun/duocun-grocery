import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgRedux } from '../../../../node_modules/@angular-redux/store';
import { IAppState } from '../../store';
import { Subject } from '../../../../node_modules/rxjs';
import { takeUntil } from '../../../../node_modules/rxjs/operators';
import { ICart, ICartItem } from '../../cart/cart.model';
import { IMall } from '../../mall/mall.model';
import { Router, ActivatedRoute } from '../../../../node_modules/@angular/router';
import { FormBuilder } from '../../../../node_modules/@angular/forms';
import { OrderService } from '../order.service';
import { IOrder, ICharge, OrderItem, OrderType, OrderStatus } from '../order.model';
import { PageActions } from '../../main/main.actions';
import { MatSnackBar, MatDialog } from '../../../../node_modules/@angular/material';
import { IDelivery } from '../../delivery/delivery.model';
import { OrderActions } from '../order.actions';
import { IAccount } from '../../account/account.model';
import { LocationService } from '../../location/location.service';

import { environment } from '../../../environments/environment';
import { PaymentService } from '../../payment/payment.service';
import { RangeService } from '../../range/range.service';
import { AccountService } from '../../account/account.service';
import { PhoneVerifyDialogComponent, AccountType } from '../phone-verify-dialog/phone-verify-dialog.component';
import { CartActions } from '../../cart/cart.actions';
import { IMerchant } from '../../merchant/merchant.model';
import { IPaymentResponse, ResponseStatus } from '../../transaction/transaction.model';
import { PaymentMethod, PaymentError, PaymentStatus, AppType } from '../../payment/payment.model';
import { SharedService } from '../../shared/shared.service';
import * as moment from 'moment';
import { ProductService } from '../../product/product.service';
import { resolve } from '../../../../node_modules/@types/q';

@Component({
  selector: 'app-order-form-page',
  templateUrl: './order-form-page.component.html',
  styleUrls: ['./order-form-page.component.scss']
})
export class OrderFormPageComponent implements OnInit, OnDestroy {
  private onDestroy$ = new Subject<any>();
  malls: IMall[] = [];
  form;
  account: IAccount;
  items: ICartItem[];
  order: IOrder; // used for identifing new order or not, now used for updating paymentMethod info
  address: string;    // for display
  balance: number;
  card;
  stripe;
  charge: ICharge;
  afterGroupDiscount: number;
  bSubmitted = false;
  fromPage: string; // params from previous page
  action: string;   // params from previous page

  // state start
  loading = true;
  merchant: IMerchant;
  delivery: IDelivery;
  cart;
  paymentMethod = PaymentMethod.WECHAT;
  // state end

  // const
  PaymentMethod = PaymentMethod;
  lang = environment.language;

  summary;
  groups;
  products;
  chargeItems;
  location;
  note;

  constructor(
    private fb: FormBuilder,
    private rx: NgRedux<IAppState>,
    private router: Router,
    private route: ActivatedRoute,
    private productSvc: ProductService,
    private orderSvc: OrderService,
    private sharedSvc: SharedService,
    private locationSvc: LocationService,
    private accountSvc: AccountService,
    private paymentSvc: PaymentService,
    private snackBar: MatSnackBar,
    public dialogSvc: MatDialog
  ) {
    const self = this;

    this.form = this.fb.group({
      note: ['']
    });
    this.fromPage = this.route.snapshot.queryParamMap.get('fromPage');
    this.action = this.route.snapshot.queryParamMap.get('action');

    // update footer
    this.rx.dispatch({ type: PageActions.UPDATE_URL, payload: { name: 'order-form' } });

    // load delivery date and location
    this.rx.select('delivery').pipe(takeUntil(this.onDestroy$)).subscribe((x: IDelivery) => {
      self.delivery = x;
      self.location = x.origin;
      self.address = this.locationSvc.getAddrString(x.origin);
    });

    this.rx.select('cart').pipe(takeUntil(this.onDestroy$)).subscribe((cart: any) => {
      this.cart = cart;
      this.chargeItems = this.getChargeItems(cart); // [{date, time, quantity, _id, name, price, cost, taxRate}] }]
      this.groups = this.getOrderGroups(cart);
      this.summary = this.getSummary(this.groups, 0);
    });

    this.rx.select<IMerchant>('merchant').pipe(takeUntil(this.onDestroy$)).subscribe((m: IMerchant) => {
      this.merchant = m;
    });
  }

  ngOnInit() {
    const self = this;

    this.componentDidMount().then(() => {

    });
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }


  // v2
  showError(err: string) {
    const missingInfoHint = this.lang === 'en' ? 'Missing phone number or address' : '缺少电话或地址';
    const dupInfoHint = this.lang === 'en' ? 'Can not submit duplicated order' : '无法重复提交订单';
    const emptyCartHint = this.lang === 'en' ? 'The Shopping cart is empty' : '购物车是空的';
    const payAlert = this.lang === 'en' ? 'Unsuccessful payment, please contact our customer service.' : '付款未成功，请联系客服';

    if (err === PaymentError.PHONE_EMPTY) {
      // this.openPhoneVerifyDialog(); // fix me
    } else if (err === PaymentError.LOCATION_EMPTY) {
      alert(missingInfoHint);
    } else if (err === PaymentError.CART_EMPTY) {
      alert(emptyCartHint);
    } else if (err === PaymentError.DUPLICATED_SUBMIT) {
      this.snackBar.open('', dupInfoHint, { duration: 1000 });
    } else if (err === PaymentError.BANK_CARD_FAIL || err === PaymentError.WECHATPAY_FAIL) {
      alert(payAlert);
    } else {
      // pass
    }
  }
  openPhoneVerifyDialog(): void {
    const dialogRef = this.dialogSvc.open(PhoneVerifyDialogComponent, {
      width: '300px',
      data: {
        title: 'Signup', content: '', buttonTextNo: '取消', buttonTextYes: '删除', account: this.account
      },
      panelClass: 'phone-verify-dialog'
    });

    dialogRef.afterClosed().pipe(takeUntil(this.onDestroy$)).subscribe(account => {
      this.account = account;
      if (account) {
        this.doPay().then(() => {

        });
      }
    });
  }

  // click button
  onSubmitPay() {
    document.getElementById('btn-submit').click();
    this.bSubmitted = true;
  }

  onPay() {
    const self = this;
    const merchant = this.merchant;
    const delivery = this.delivery;
    const cart = this.cart;
    const paymentMethod = this.paymentMethod;
    const origin = delivery.origin;
    const groupDiscount = 0; // bEligible ? 2 : 0;
    const account = this.account; // get in mount()

    if (account) {
      this.balance = account.balance;

      // self.rangeSvc.getOverRange(origin).pipe(takeUntil(this.onDestroy$)).subscribe((r: any) => {
      // this.charge = this.getSummary(cart, merchant, (r.distance * r.rate), groupDiscount);
      if (account.type === AccountType.TEMP || !account.phone) {
        // For no logged in user who get the verification code, but didn't finish verify
        this.bSubmitted = false;
        this.openPhoneVerifyDialog();
      } else {
        self.doPay().then((rt: any) => {
          // this.showError(rt.err);
          this.loading = false;
          this.bSubmitted = false;

          if (rt.err === PaymentError.NONE) {
            this.rx.dispatch({ type: CartActions.CLEAR_CART, payload: [] });

            if (paymentMethod === PaymentMethod.WECHAT) {
              window.location.href = rt.url;
            } else {
              self.router.navigate(['order/history']);
            }
          }
        });
      }
    } else { // didn't login
      this.loading = false;
      this.bSubmitted = false;
      this.openPhoneVerifyDialog();
    }
  }

  onCreditCardFormInit(e) {
    this.stripe = e.stripe;
    this.card = e.card;
  }

  // delivery --- only need 'origin' and 'dateType' fields
  createOrder(account, merchant, items, location, deliverDate, deliverTime, charge, note, paymentMethod) {

    // const sCreated = moment().toISOString();
    // const { deliverDate, deliverTime } = this.getDeliveryDateTimeByPhase(sCreated, merchant.phases, delivery.dateType);
    const status = (paymentMethod === PaymentMethod.CREDIT_CARD || paymentMethod === PaymentMethod.WECHAT) ?
      OrderStatus.TEMP : OrderStatus.NEW; // prepay need Driver to confirm finished
    const paymentStatus = paymentMethod === PaymentMethod.PREPAY ? PaymentStatus.PAID : PaymentStatus.UNPAID;

    const order = {
      clientId: account._id,
      clientName: account.username,
      merchantId: merchant._id,
      merchantName: this.lang === 'zh' ? merchant.name : merchant.nameEN,
      items,
      location,
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

  componentDidMount() {
    // tslint:disable-next-line:no-shadowed-variable
    return new Promise((resolve, reject) => {
      if (this.merchant) {
        this.loading = true;
        const merchantId = this.merchant._id;
        const fields = ['_id', 'name', 'price', 'taxRate'];
        this.productSvc.quickFind({ merchantId }, fields).then(products => {
          this.accountSvc.getCurrentAccount().pipe(takeUntil(this.onDestroy$)).subscribe(account => {
            const amount = this.summary.total;
            const paymentMethod = (account.balance >= amount) ? PaymentMethod.PREPAY : this.paymentMethod;
            this.products = products;
            this.account = account;
            this.paymentMethod = paymentMethod;
            const balance = Math.round(this.account.balance * 100) / 100;
            const payable = Math.round((balance >= this.summary.total ? 0 : this.summary.total - balance) * 100) / 100;
            this.charge = { ...this.summary, ...{ payable }, ...{ balance } };
            this.loading = false;
            resolve();
          });
        });
      } else {
        resolve();
      }
    });
  }

  // cart --- [{product, deliveries: [{date, time, quantity}] }]
  // return --- {date, time, _id, name, quantity, price, cost}
  getChargeItems(cart) { // group by date time
    const chargeItems = [];
    cart.map(it => { //  {product, deliveries:[{date, time, quantity}]}
      it.deliveries.map(d => {
        chargeItems.push({ ...d, ...it.product });
      });
    });
    return chargeItems;
  }

  // cart --- [{product, deliveries: [{date, time, quantity}] }]
  // return --- [{date, time, items: [{productId, quantity, price, cost}] }]
  getOrderGroups(cart) { // group by date time
    const orders = [];
    cart.map(it => { //  {product, deliveries:[{date, time, quantity }]}
      it.deliveries.map(d => {
        const order = orders.find(t => t.date === d.date && t.time === d.time);
        if (order) {
          order.items.push({
            productId: it.product._id, quantity: d.quantity, price: it.product.price, cost: it.product.cost,
            taxRate: it.product.taxRate
          });
        } else {
          orders.push({
            date: d.date,
            time: d.time,
            items: [{
              productId: it.product._id, quantity: d.quantity, price: it.product.price, cost: it.product.cost,
              taxRate: it.product.taxRate
            }]
          });
        }
      });
    });
    return orders;
  }

  // groups --- [{date, time, items: [{productId, quantity, price, cost, taxRate}] }]
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
      groups.map(order => {
        let price = 0;
        let cost = 0;
        let tax = 0;
        order.items.map(x => {
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

  // account, self.merchant, self.charge, cart, delivery, paymentMethod
  doPay() {
    const v = this.form.value;
    this.note = v.note;
    const account = this.account;
    const merchant = this.merchant;
    const location = this.location;
    const paymentMethod = this.paymentMethod;
    const note = this.note;
    const amount = this.summary.total;
    const orders = [];
    const overRangeCharge = 0;
    this.groups.map(group => {
      const charge = this.getCharge(group, overRangeCharge);
      const order = this.createOrder(account, merchant, group.items, location, group.date, group.time, charge, note, paymentMethod);
      orders.push(order);
    });

    // tslint:disable-next-line:no-shadowed-variable
    return new Promise((resolve, reject) => {
      this.orderSvc.placeOrders(orders).pipe(takeUntil(this.onDestroy$)).subscribe(newOrders => {
        const balance = account && account.balance ? account.balance : 0;
        const payable = Math.round((amount - balance) * 100) / 100;
        if (payable > 0) {
          if (this.paymentMethod === PaymentMethod.CREDIT_CARD) {
            this.stripe.createPaymentMethod({
              type: 'card',
              card: this.card,
              billing_details: { name: account.username }
            }).then(result => {
              if (result.error) {
                // An error happened when collecting card details, show `result.error.message` in the payment form.
                resolve({ err: PaymentError.INVALID_BANK_CARD });
              } else {
                this.paymentSvc.payByCreditCard(AppType.GROCERY, account._id, account.username, newOrders, payable, note)
                  .pipe(takeUntil(this.onDestroy$)).subscribe(rsp => {
                    resolve(rsp);
                  });
              }
            });
          } else if (this.paymentMethod === PaymentMethod.WECHAT) {
            this.paymentSvc.payBySnappay(AppType.GROCERY, account._id, account.username, newOrders, payable, note)
              .pipe(takeUntil(this.onDestroy$)).subscribe(rsp => {
                resolve(rsp);
              });
          } else { // PaymentMethod.CASH || PaymentMethod.PREPAY
            resolve({ err: PaymentError.NONE });
          }
        } else { // PaymentMethod.PREPAY
          resolve({ err: PaymentError.NONE });
        }
      });
    });
  }

  onClosePhoneVerifyDialog() {
    // this.setState({ bModal: false });
    // this.submitOrder();
  }

  onSelectPaymentMethod(paymentMethod) {
    this.paymentMethod = paymentMethod;
  }
}
