import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { NgRedux } from '@angular-redux/store';
import { IAppState } from '../../store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ICartItem } from '../../cart/cart.model';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { OrderService } from '../order.service';
import { IOrder, ICharge, OrderType, OrderStatus } from '../order.model';
import { PageActions } from '../../main/main.actions';
import { MatSnackBar, MatDialog } from '@angular/material';
import { IDelivery } from '../../delivery/delivery.model';
import { IAccount } from '../../account/account.model';
import { LocationService } from '../../location/location.service';

import { environment } from '../../../environments/environment';
import { PaymentService } from '../../payment/payment.service';
import { AccountService } from '../../account/account.service';
import { AccountType, VerificationError, PhoneVerifyDialogComponent } from '../phone-verify-dialog/phone-verify-dialog.component';
import { CartActions } from '../../cart/cart.actions';
import { IMerchant } from '../../merchant/merchant.model';
import { PaymentMethod, PaymentError, PaymentStatus, AppType } from '../../payment/payment.model';
// import { SharedService } from '../../shared/shared.service';
import * as moment from 'moment';
import { ProductService } from '../../product/product.service';
import { IApp } from '../../main/main.reducers';
// import { AuthService } from '../../account/auth.service';
import { OrderActions, PaymentActions } from '../order.actions';
import { CartService } from '../../cart/cart.service';

declare var Stripe;

export const OrderFormAction = {
  RESUME_PAY: 'RP',
  CONTINUE: 'C',
  NEW: 'N',
  FAIL_PAY: 'FP'
};

@Component({
  selector: 'app-order-form-page',
  templateUrl: './order-form-page.component.html',
  styleUrls: ['./order-form-page.component.scss']
})
export class OrderFormPageComponent implements OnInit, OnDestroy {
  private onDestroy$ = new Subject<any>();
  form;
  account: IAccount;
  items: ICartItem[];
  order: IOrder; // used for identifing new order or not, now used for updating paymentMethod info
  address: string;    // for display
  balance: number;
  charge: ICharge;
  afterGroupDiscount: number;
  bSubmitted = false;
  action: string;   // params from previous page

  // state start
  loading = true;
  merchant: IMerchant;
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
  appCode;

  verified;
  phoneMatchedAccount;
  phoneForm;
  bAllowVerify = false;
  verifing = false;
  orders;
  paymentMethodId;
  creditcard;
  get phone() { return this.phoneForm.get('phone'); }
  get verificationCode() { return this.phoneForm.get('verificationCode'); }

  @ViewChild('cc', { static: true }) cc: ElementRef;
  @ViewChild('submitBtn', { static: true }) submitBtn: ElementRef;

  constructor(
    private fb: FormBuilder,
    private rx: NgRedux<IAppState>,
    private router: Router,
    private route: ActivatedRoute,
    private productSvc: ProductService,
    private orderSvc: OrderService,
    private cartSvc: CartService,
    // private sharedSvc: SharedService,
    private locationSvc: LocationService,
    private accountSvc: AccountService,
    private paymentSvc: PaymentService,
    private snackBar: MatSnackBar,
    public dialogSvc: MatDialog,
  ) {
    const self = this;

    this.form = this.fb.group({
      note: ['']
    });

    this.phoneForm = this.fb.group({
      phone: [''],
      verificationCode: ['']
    });

    // update footer
    this.rx.dispatch({ type: PageActions.UPDATE_URL, payload: { name: 'order-form' } });

    // load delivery date and location
    this.rx.select('delivery').pipe(takeUntil(this.onDestroy$)).subscribe((x: IDelivery) => {
      self.location = x.origin;
      self.address = this.locationSvc.getAddrString(x.origin);
    });

    this.rx.select('cart').pipe(takeUntil(this.onDestroy$)).subscribe((cart: any) => {
      this.cart = cart;
      this.chargeItems = this.orderSvc.getChargeItems(cart); // [{date, time, quantity, _id, name, price, cost, taxRate}] }]
      this.groups = this.orderSvc.getOrderGroups(cart);
      this.summary = this.orderSvc.getSummary(this.groups, 0);
    });

    this.rx.select('merchant').pipe(takeUntil(this.onDestroy$)).subscribe((m: IMerchant) => {
      this.merchant = m;
    });

    this.rx.select('orders').pipe(takeUntil(this.onDestroy$)).subscribe((orders: any[]) => {
      this.orders = orders;
    });

    this.rx.select('payment').pipe(takeUntil(this.onDestroy$)).subscribe((p: any) => {
      if (p && p.paymentMethodId) {
        this.paymentMethodId = p.paymentMethodId;
      }
      if (p && p.paymentMethod) {
        this.paymentMethod = p.paymentMethod;
      }
    });

    this.rx.select('appState').pipe(takeUntil(this.onDestroy$)).subscribe((x: IApp) => {
      self.appCode = x.code;
    });
  }

  ngOnInit() {
    const self = this;

    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      const action = params['action'];
      if (action === OrderFormAction.NEW) { // || action === OrderFormAction.CONTINUE

        if (!this.cart || this.cart.length === 0) {
          this.router.navigate(['/home']);
        }

        this.componentDidMount().then((r: any) => {
          if (r) {
            const account = r.account;
            const merchant = r.merchant;
            const paymentMethod = this.paymentMethod;
            const orders = [];
            const overRangeCharge = 0;
            const location = this.location; // from redux
            const lang = this.lang;

            if (!account) {
              alert('网络会话已过期, 请退出后重新尝试。');
              return;
            } else {
              this.groups.map(group => {
                const charge = this.orderSvc.getCharge(group, overRangeCharge);
                const items = group.items;
                const date = group.date;
                const time = group.time;
                const note = '';
                const order = this.orderSvc.createOrder(account, merchant, items, location, date, time, charge, note, paymentMethod, lang);
                orders.push(order);
              });
              this.loading = false;
              this.rx.dispatch({ type: OrderActions.REPLACE_ORDERS, payload: orders });
            }
          } else {
            // process browser back button press
            this.loading = false;
          }
        });
      } else if (action === OrderFormAction.RESUME_PAY) { // from phone verify page
        this.componentDidMount().then((r: any) => {
          const account = r.account;
          const payable = r.payable;
          // orders from redux
          self.placeOrdersAndPay(self.appCode, self.orders, self.paymentMethodId, account, payable).then((rt: any) => {
            this.showError(rt.err);
            this.loading = false;
            if (rt.err === PaymentError.NONE) {
              this.rx.dispatch({ type: CartActions.CLEAR_CART, payload: [] });
              if (self.paymentMethod === PaymentMethod.WECHAT) {
                window.location.href = rt.url;
                this.loading = false;
                // set default payment method
                this.rx.dispatch({ type: PaymentActions.UPDATE_PAYMENT_METHOD, payload: { paymentMethod: PaymentMethod.WECHAT } });
              } else {
                this.loading = false;
                // set default payment method
                this.rx.dispatch({ type: PaymentActions.UPDATE_PAYMENT_METHOD, payload: { paymentMethod: PaymentMethod.WECHAT } });
                self.router.navigate(['order/history']);
              }
            }
          });
        });
      }
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
    } else if (err === PaymentError.BANK_AUTHENTICATION_REQUIRED) {
      alert('此卡需要额外的认证');
    } else if (err === PaymentError.BANK_INSUFFICIENT_FUND) {
      alert('余额不足, 无法完成支付');
    } else if (err === PaymentError.BANK_CARD_DECLIEND) {
      alert('支付网关拒收');
    }
  }

  // click button
  onSubmitPay() {
    // document.getElementById('btn-submit').click();
    this.submitBtn.nativeElement.click();
    // this.onPay();
  }

  onNoteChange(e) {
    const note = this.form.value.note;
    this.rx.dispatch({ type: OrderActions.UPDATE_ORDERS, payload: { note } });
  }

  async verifyCreditCard(account) {
    const { stripe, card } = this.creditcard;
    const result = await stripe.createPaymentMethod({
      type: 'card',
      card,
      billing_details: { name: account.username }
    });

    if (result.error) {
      // show error resolve({ err: PaymentError.INVALID_BANK_CARD });
      alert('Invalid Bank Card or input wrong information.');
      return false;
    } else {
      this.paymentMethodId = result.paymentMethod.id;
      this.rx.dispatch({ type: PaymentActions.UPDATE_PAYMENT_METHOD, payload: { paymentMethodId: result.paymentMethod.id } });
      return true;
    }
  }

  async validatePayment(account, payable) {
    if (payable > 0 && this.paymentMethod === PaymentMethod.CREDIT_CARD) {
      return await this.verifyCreditCard(account);
    } else {
      return true;
    }
  }

  onPay() {
    const self = this;
    const account = this.account;
    const payable = this.charge.payable;
    this.validatePayment(account, payable).then(bPass => {
      if (bPass) {
        if (account) {
          if (account.type === AccountType.TEMP || !account.phone || !account.verified) {
            this.loading = false;
            // this.openPhoneVerifyDialog(account, this.paymentMethod);
            this.router.navigate(['contact/phone-form/' + OrderFormAction.RESUME_PAY]);
          } else {
            this.bSubmitted = true; // important! block form submit
            self.placeOrdersAndPay(self.appCode, self.orders, self.paymentMethodId, account, payable).then((rt: any) => {
              this.bSubmitted = false;
              if (rt.err === PaymentError.NONE) {
                this.rx.dispatch({ type: CartActions.CLEAR_CART, payload: [] });
                if (self.paymentMethod === PaymentMethod.WECHAT) {
                  this.loading = false;
                  window.location.href = rt.url;
                  // set default payment method
                  this.rx.dispatch({ type: PaymentActions.UPDATE_PAYMENT_METHOD, payload: { paymentMethod: PaymentMethod.WECHAT } });
                } else {
                  this.loading = false;
                  // set default payment method
                  this.rx.dispatch({ type: PaymentActions.UPDATE_PAYMENT_METHOD, payload: { paymentMethod: PaymentMethod.WECHAT } });
                  self.router.navigate(['order/history']);
                }
              } else {
                this.showError(rt.err);
                // stay in same page and set default payment method
                this.rx.dispatch({ type: PaymentActions.UPDATE_PAYMENT_METHOD, payload: { paymentMethod: PaymentMethod.WECHAT } });
              }
            });
          }
        } else { // didn't login or session down
          this.loading = false;
          alert('微信登陆已过期, 请退出公众号重新进入');
          this.rx.dispatch({ type: PaymentActions.UPDATE_PAYMENT_METHOD, payload: { paymentMethod: PaymentMethod.WECHAT } });
          this.router.navigate(['/']);
        }
      } else {
        // show verify bank card error
        this.loading = false;
      }
    });
  }


  // delivery --- only need 'origin' and 'dateType' fields

  componentDidMount() {
    // tslint:disable-next-line:no-shadowed-variable
    return new Promise((resolve, reject) => {
      const merchant = this.merchant;
      if (this.merchant) {
        this.loading = true;
        const merchantId = this.merchant._id;
        const fields = ['_id', 'name', 'price', 'taxRate'];
        this.productSvc.quickFind({ merchantId, status: 1 }, fields).then(products => {
          this.accountSvc.getCurrentAccount().pipe(takeUntil(this.onDestroy$)).subscribe(account => {
            const amount = this.cartSvc.getTotal(this.cart);
            const balance = Math.round((account && account.balance ? account.balance : 0) * 100) / 100;
            const payable = Math.round((balance >= amount ? 0 : amount - balance) * 100) / 100;
            const paymentMethod = (balance >= amount) ? PaymentMethod.PREPAY : this.paymentMethod;
            this.rx.dispatch({ type: PaymentActions.UPDATE_PAYMENT_METHOD, payload: { paymentMethod } });

            this.paymentMethod = paymentMethod;
            this.charge = { ...this.summary, ...{ payable }, ...{ balance } };
            this.products = products;
            this.account = account;
            this.loading = false;

            resolve({ account, merchant, payable });
          });
        });
      } else {
        resolve();
      }
    });
  }

  // account, self.merchant, self.charge, cart, paymentMethod
  // paymentMethodId --- stripe payment method id
  placeOrdersAndPay(appCode, orders, paymentMethodId, account, payable) {
    const accountName = account.username;
    const paymentNote = '';

    // tslint:disable-next-line:no-shadowed-variable
    return new Promise((resolve, reject) => {
      this.loading = true;
      this.orderSvc.placeOrders(orders).pipe(takeUntil(this.onDestroy$)).subscribe(newOrders => {
        if (payable > 0) {
          if (this.paymentMethod === PaymentMethod.CREDIT_CARD) {
            this.paymentSvc.payByCreditCard(AppType.GROCERY, paymentMethodId, account._id, accountName, newOrders, payable, paymentNote)
              .pipe(takeUntil(this.onDestroy$)).subscribe(rsp => {
                this.loading = false;
                resolve(rsp);
              });
          } else if (this.paymentMethod === PaymentMethod.WECHAT) {
            this.loading = false;
            this.paymentSvc.payBySnappay(appCode, account._id, newOrders, payable)
              .pipe(takeUntil(this.onDestroy$)).subscribe(rsp => {
                resolve(rsp);
              });
          } else { // PaymentMethod.CASH || PaymentMethod.PREPAY
            this.loading = false;
            resolve({ err: PaymentError.NONE });
          }
        } else { // PaymentMethod.PREPAY
          this.loading = false;
          resolve({ err: PaymentError.NONE });
        }
      });
    });
  }


  onSelectPaymentMethod(paymentMethod) {
    const self = this;
    this.paymentMethod = paymentMethod;

    this.rx.dispatch({ type: PaymentActions.UPDATE_PAYMENT_METHOD, payload: { paymentMethod } });
    this.rx.dispatch({ type: OrderActions.UPDATE_ORDERS, payload: { paymentMethod } });

    if (paymentMethod === PaymentMethod.CREDIT_CARD) {
      this.router.navigate(['payment/card']);
      //   setTimeout(() => {
      //     self.creditcard = self.initStripe();
      //   }, 300);
    }
  }

  getTodayString() {
    return moment().format('YYYY-MM-DD');
  }


  // action --- 's': submit, 'c': change payment method
  openPhoneVerifyDialog(account, paymentMethod) {
    // this.router.navigate(['contact/phone-form/' + action]);
    const self = this;
    // this.modalSvc.getModal('myModal').open();
    const dialogRef = this.dialogSvc.open(PhoneVerifyDialogComponent, {
      width: '300px',
      data: {
        title: 'Signup', content: '', buttonTextNo: '取消', buttonTextYes: '删除',
        account, paymentMethod
      },
      panelClass: 'phone-verify-dialog'
    });

    dialogRef.afterClosed().pipe(takeUntil(this.onDestroy$)).subscribe(r => {
      if (r && r.account) {
        this.account = r.account;
        const payable = this.charge.payable;
        this.placeOrdersAndPay(self.appCode, self.orders, self.paymentMethodId, account, payable).then((rt: any) => {
          // this.placeOrdersAndPay().then((rt: any) => {
          this.showError(rt.err);
          this.loading = false;
          this.bSubmitted = false;

          if (rt.err === PaymentError.NONE) {
            this.rx.dispatch({ type: CartActions.CLEAR_CART, payload: [] });
            if (r.paymentMethod === PaymentMethod.WECHAT) {
              window.location.href = rt.url;
            } else {
              // set default payment method
              this.rx.dispatch({ type: PaymentActions.UPDATE_PAYMENT_METHOD, payload: { paymentMethod: PaymentMethod.WECHAT } });
              this.router.navigate(['order/history']);
            }
          }
        });
      } else {
        alert('账号注册失败,下单没成功,请联系客服');
      }
    });
  }


  initStripe() {
    const stripe = Stripe(environment.STRIPE.API_KEY);
    const elements = stripe.elements();
    const type = 'card';

    // Custom styling can be passed to options when creating an Element.
    const style = {
      base: {
        color: '#32325d',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#aab7c4'
        }
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a'
      }
    };

    const card = elements.create(type, { hidePostalCode: true, style: style });
    card.mount('#card-element');

    // Handle real-time validation errors from the card Element.
    card.addEventListener('change', function (event) {
      const displayError = document.getElementById('payment-result');
      if (event.error) {
        displayError.textContent = event.error.message;
      } else {
        displayError.textContent = '';
      }
    });

    card.on('focus', () => {
      // this.focus.emit();
      try {
        this.cc.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (e) {
      }
    });
    return { stripe, card };
  }
}
