import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { IAccount } from '../../account/account.model';
import { AccountService } from '../../account/account.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { NgRedux } from '@angular-redux/store';
import { IAppState } from '../../store';
import { OrderService } from '../../order/order.service';
import { AccountType } from '../../order/phone-verify-dialog/phone-verify-dialog.component';
import { PaymentMethod, PaymentError, AppType } from '../payment.model';
import { IApp } from '../../main/main.reducers';
import { IMerchant } from '../../merchant/merchant.model';
import { environment } from '../../../environments/environment';
import { CartActions } from '../../cart/cart.actions';
import { Router } from '@angular/router';
import { PaymentService } from '../payment.service';
import { OrderFormAction } from '../../order/order-form-page/order-form-page.component';
import { PaymentActions } from '../../order/order.actions';
import { IDelivery } from '../../delivery/delivery.model';

declare var Stripe;

@Component({
  selector: 'app-credit-card-page',
  templateUrl: './credit-card-page.component.html',
  styleUrls: ['./credit-card-page.component.scss']
})
export class CreditCardPageComponent implements OnInit, OnDestroy {
  stripe;
  card;
  account;
  cart;
  payable;
  appCode;
  merchant;
  paymentMethodId;
  orders;
  PaymentMethod = PaymentMethod;
  creditcard;
  charge;
  chargeItems;
  onDestroy$ = new Subject();
  bSubmitted = false;
  location;
  loading;
  @ViewChild('cc', { static: true }) cc: ElementRef;

  constructor(
    private orderSvc: OrderService,
    private accountSvc: AccountService,
    private paymentSvc: PaymentService,
    private router: Router,
    private rx: NgRedux<IAppState>,
  ) {
    this.rx.select('cart').pipe(takeUntil(this.onDestroy$)).subscribe((cart: any) => {
      this.cart = cart;
      this.chargeItems = this.orderSvc.getChargeItems(cart); // [{date, time, quantity, _id, name, price, cost, taxRate}] }]
    });

    this.rx.select('appState').pipe(takeUntil(this.onDestroy$)).subscribe((x: IApp) => {
      this.appCode = x ? x.code : '';
    });

    this.rx.select('merchant').pipe(takeUntil(this.onDestroy$)).subscribe((m: IMerchant) => {
      this.merchant = m;
    });

    // load delivery date and location
    this.rx.select('delivery').pipe(takeUntil(this.onDestroy$)).subscribe((x: IDelivery) => {
      this.location = x ? x.origin : null;
    });
  }

  ngOnInit() {
    this.accountSvc.getCurrentAccount().pipe(takeUntil(this.onDestroy$)).subscribe((r: any) => {
      this.account = r.data;

      if (!this.cart || this.cart.length === 0) {
        this.router.navigate(['/']); // routing issue
      }

      const lang = environment.language;
      const merchant = this.merchant;
      const groups = this.orderSvc.getOrderGroups(this.cart);
      const summary = this.orderSvc.getSummary(groups, 0);
      const amount = Math.round(summary.total * 100) / 100;
      const balance = Math.round((r.data && r.data.balance ? r.data.balance : 0) * 100) / 100;
      this.payable = Math.round((balance >= amount ? 0 : amount - balance) * 100) / 100;

      this.charge = { ...summary, payable: this.payable, ...{ balance } };
      const location = this.location;
      const orders = [];
      const overRangeCharge = 0;
      groups.map(group => {
        const charge = this.orderSvc.getCharge(group, overRangeCharge);
        const order = this.orderSvc.createOrder(r.data, merchant, group.items, location, group.date,
          group.time, charge, '', PaymentMethod.CREDIT_CARD, lang);
        orders.push(order);
      });
      this.orders = orders;

      this.creditcard = this.initStripe();
    });
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  onCreditCardInputFocus() {
    try {
      this.cc.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
    }
  }

  abs(n) {
    return Math.abs(n);
  }
  // onCreditCardFormInit(e) {
  //   this.stripe = e.stripe;
  //   this.card = e.card;
  // }

  onPay() {
    const self = this;
    // const appCode = this.appCode;
    const account = this.account;
    const payable = this.payable;
    const orders = this.orders;
    const { stripe, card } = this.creditcard;

    stripe.createPaymentMethod({
      type: 'card',
      card,
      billing_details: { name: account.username }
    }).then((result: any) => {
      if (result.error) {
        this.loading = false;
        this.bSubmitted = false;
        alert('Invalid Bank Card or input wrong information.'); // allow stay in page and try again.
      } else {
        const paymentMethodId = result.paymentMethod.id;
        this.rx.dispatch({ type: PaymentActions.UPDATE_PAYMENT_METHOD, payload: { paymentMethodId: result.paymentMethod.id } });
        if (account.type === AccountType.TEMP || !account.phone || !account.verified) {
          this.loading = false;
          this.bSubmitted = false;
          this.router.navigate(['contact/phone-form/' + OrderFormAction.RESUME_PAY]);
        } else {
          this.placeOrdersAndPay(orders, paymentMethodId, account, payable).then((rsp: any) => {
            this.loading = false;
            this.bSubmitted = false;
            // set default payment method !!! important for both success and fail
            this.rx.dispatch({ type: PaymentActions.UPDATE_PAYMENT_METHOD, payload: { paymentMethod: PaymentMethod.WECHAT } });
            if (rsp.err === PaymentError.NONE) {
              this.rx.dispatch({ type: CartActions.CLEAR_CART, payload: [] });
              this.router.navigate(['order/history']);
            } else {
              alert('Pay failed, please try another card or contact customer service.');
              this.router.navigate(['order/form/' + OrderFormAction.NEW]); // allow user to redo payment process
            }
          });
        }
      }
    });
  }

  placeOrdersAndPay(orders, paymentMethodId, account, payable) {
    const paymentActionCode ='';
    const accountName = account.username;
    const accountId = account._id;
    const amount = payable;
    const note = '';
    const paymentId = '';
    const merchantNames =[];


    // tslint:disable-next-line:no-shadowed-variable
    return new Promise((resolve, reject) => {
      this.orderSvc.placeOrders(orders).pipe(takeUntil(this.onDestroy$)).subscribe(newOrders => {
        console.log(newOrders),
        this.paymentSvc.payByCreditCard(paymentActionCode, paymentMethodId,accountId, accountName, amount, newOrders[0].note,newOrders[0].paymentId,[newOrders[0].merchantName])
          .pipe(takeUntil(this.onDestroy$)).subscribe(r => {
            resolve(r.data);
          });
      });
    });
  }

  // deprecated
  async verifyPaymentInput(account, payable) {
    if (payable > 0) {
      const result = await this.stripe.createPaymentMethod({
        type: 'card',
        card: this.card,
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
    } else {
      return true;
    }
  }

  initStripe() {
    const self = this;
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
      // try {
      //   this.cc.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // } catch (e) {
      // }
    });


    const form = document.getElementById('payment-form');
    form.addEventListener('submit', async event => {
      event.preventDefault();

      if (!self.bSubmitted) {
        self.bSubmitted = true;
        self.loading = true;
        self.onPay();
      }
      // resultContainer.textContent = '';
      // const result = await stripe.createPaymentMethod({
      //   type: 'card',
      //   card: cardElement,
      // });
      // handlePaymentMethodResult(result);
    });
    return { stripe, card };
  }
}
