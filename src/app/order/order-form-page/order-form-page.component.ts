import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { NgRedux } from '../../../../node_modules/@angular-redux/store';
import { IAppState } from '../../store';
import { Subject } from '../../../../node_modules/rxjs';
import { takeUntil } from '../../../../node_modules/rxjs/operators';
import { ICartItem } from '../../cart/cart.model';
import { Router, ActivatedRoute } from '../../../../node_modules/@angular/router';
import { FormBuilder } from '../../../../node_modules/@angular/forms';
import { OrderService } from '../order.service';
import { IOrder, ICharge, OrderType, OrderStatus } from '../order.model';
import { PageActions } from '../../main/main.actions';
import { MatSnackBar, MatDialog } from '../../../../node_modules/@angular/material';
import { IDelivery } from '../../delivery/delivery.model';
import { IAccount } from '../../account/account.model';
import { LocationService } from '../../location/location.service';

import { environment } from '../../../environments/environment';
import { PaymentService } from '../../payment/payment.service';
import { AccountService } from '../../account/account.service';
import { PhoneVerifyDialogComponent, AccountType, VerificationError } from '../phone-verify-dialog/phone-verify-dialog.component';
import { CartActions } from '../../cart/cart.actions';
import { IMerchant } from '../../merchant/merchant.model';
import { PaymentMethod, PaymentError, PaymentStatus, AppType } from '../../payment/payment.model';
import { SharedService } from '../../shared/shared.service';
import * as moment from 'moment';
import { ProductService } from '../../product/product.service';
import { IApp } from '../../main/main.reducers';
import { AuthService } from '../../account/auth.service';

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
  appCode;

  verified;
  phoneMatchedAccount;
  phoneForm;
  bAllowVerify = false;
  verifing = false;

  get phone() { return this.phoneForm.get('phone'); }
  get verificationCode() { return this.phoneForm.get('verificationCode'); }


  @ViewChild('submitBtn', { static: true }) submitBtn: ElementRef;
  @ViewChild('cc', { static: true }) cc: ElementRef;

  constructor(
    private fb: FormBuilder,
    private rx: NgRedux<IAppState>,
    private router: Router,
    private route: ActivatedRoute,
    private productSvc: ProductService,
    private orderSvc: OrderService,
    private authSvc: AuthService,
    private sharedSvc: SharedService,
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

    this.rx.select('merchant').pipe(takeUntil(this.onDestroy$)).subscribe((m: IMerchant) => {
      this.merchant = m;
    });

    this.rx.select('appState').pipe(takeUntil(this.onDestroy$)).subscribe((x: IApp) => {
      self.appCode = x.code;
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
    } else if (err === PaymentError.BANK_AUTHENTICATION_REQUIRED) {
      alert('此卡需要额外的认证');
    } else if (err === PaymentError.BANK_INSUFFICIENT_FUND) {
      alert('余额不足, 无法完成支付');
    } else if (err === PaymentError.BANK_CARD_DECLIEND) {
      alert('支付网关拒收');
    }
  }

  onCreditCardInputFocus() {
    try {
      this.cc.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {

    }
  }

  // click button
  onSubmitPay() {
    // document.getElementById('btn-submit').click();
    this.submitBtn.nativeElement.click();
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

    this.bSubmitted = true; // important! block form submit

    if (account) {
      this.balance = account.balance;

      // self.rangeSvc.getOverRange(origin).pipe(takeUntil(this.onDestroy$)).subscribe((r: any) => {
      // this.charge = this.getSummary(cart, merchant, (r.distance * r.rate), groupDiscount);
      if (account.type === AccountType.TEMP || !account.phone || !account.verified) {
        this.bSubmitted = false;
        this.loading = false;
        // setTimeout(() => {
        self.openPhoneVerifyDialog(self.account, self.paymentMethod);
        // }, 300);
      } else {
        self.doPay().then((rt: any) => {
          this.showError(rt.err);
          this.loading = false;
          this.bSubmitted = false;

          if (rt.err === PaymentError.NONE) {
            this.rx.dispatch({ type: CartActions.CLEAR_CART, payload: [] });

            if (paymentMethod === PaymentMethod.WECHAT) {
              window.location.href = rt.url;
            } else {
              this.loading = false;
              self.router.navigate(['order/history']);
            }
          }
        });
      }
    } else { // didn't login
      this.loading = false;
      this.bSubmitted = false;
      this.openPhoneVerifyDialog(account, paymentMethod);
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

  componentDidMount() {
    // tslint:disable-next-line:no-shadowed-variable
    return new Promise((resolve, reject) => {
      if (this.merchant) {
        this.loading = true;
        const merchantId = this.merchant._id;
        const fields = ['_id', 'name', 'price', 'taxRate'];
        this.productSvc.quickFind({ merchantId, status: 1 }, fields).then(products => {
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
    const amount = Math.round(this.summary.total * 100) / 100;
    const orders = [];
    const overRangeCharge = 0;
    this.groups.map(group => {
      const charge = this.getCharge(group, overRangeCharge);
      const order = this.createOrder(account, merchant, group.items, location, group.date, group.time, charge, note, paymentMethod);
      orders.push(order);
    });

    // tslint:disable-next-line:no-shadowed-variable
    return new Promise((resolve, reject) => {
      this.loading = true;
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
                this.loading = false;
                // An error happened when collecting card details, show `result.error.message` in the payment form.
                resolve({ err: PaymentError.INVALID_BANK_CARD });
              } else {
                const paymentMethodId = result.paymentMethod.id;
                this.paymentSvc.payByCreditCard(AppType.GROCERY, paymentMethodId, account._id, account.username, newOrders, payable, note)
                  .pipe(takeUntil(this.onDestroy$)).subscribe(rsp => {
                    this.loading = false;
                    resolve(rsp);
                  });
              }
            });
          } else if (this.paymentMethod === PaymentMethod.WECHAT) {
            this.loading = false;
            this.paymentSvc.payBySnappay(this.appCode, account._id, account.username, newOrders, payable, note)
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
    this.paymentMethod = paymentMethod;
  }

  getTodayString() {
    return moment().format('YYYY-MM-DD');
  }


  openPhoneVerifyDialog(account, paymentMethod): void {
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
        this.doPay().then((rt: any) => {
          this.showError(rt.err);
          this.loading = false;
          this.bSubmitted = false;

          if (rt.err === PaymentError.NONE) {
            this.rx.dispatch({ type: CartActions.CLEAR_CART, payload: [] });
            if (r.paymentMethod === PaymentMethod.WECHAT) {
              window.location.href = rt.url;
            } else {
              this.router.navigate(['order/history']);
            }
          }
        });
      } else {
        alert('账号注册失败,下单没成功,请联系客服');
      }
    });
  }


  // verifyPhoneNumber(accountId: string, account: IAccount) {
  //   if (accountId) {
  //     if (account) {
  //       // if (account.type === AccountType.TEMP) {
  //       //   if (accountId === account._id) {
  //       //     return VerificationError.NONE;
  //       //   } else {
  //       //     return VerificationError.PHONE_NUMBER_OCCUPIED;
  //       //   }
  //       // } else {
  //       if (accountId === account._id) {
  //         return VerificationError.NONE;
  //       } else {
  //         return VerificationError.PHONE_NUMBER_OCCUPIED;
  //       }
  //       // }
  //     } else {
  //       return VerificationError.NONE;
  //     }
  //   } else {
  //     return VerificationError.NONE;
  //   }
  // }

  // onPhoneInput(e) {
  //   const self = this;
  //   this.verified = false;
  //   this.verificationCode.patchValue('');

  //   if (e.target.value && e.target.value.length >= 10) {
  //     let phone: string = this.phoneForm.value.phone;
  //     phone = phone.substring(0, 2) === '+1' ? phone.substring(2) : phone;
  //     phone = phone.match(/\d+/g).join('');

  //     this.accountSvc.find({ phone: phone }).pipe(takeUntil(this.onDestroy$)).subscribe(accounts => {
  //       const account = (accounts && accounts.length > 0) ? accounts[0] : null;
  //       const accountId = this.account ? this.account._id : '';
  //       const err = this.verifyPhoneNumber(accountId, account);

  //       if (err === VerificationError.PHONE_NUMBER_OCCUPIED) {
  //         const s = this.lang === 'en' ? 'This phone number has already bind to an wechat account, please try use wechat to login.' :
  //           '该号码已经被一个英文版的账号使用，请使用英文版登陆; 如果想更改账号请联系客服。';
  //         alert(s);
  //         this.bAllowVerify = false;
  //       } else {
  //         this.bAllowVerify = true;
  //       }
  //     });
  //   } else { // input less than 10 chars
  //     this.bAllowVerify = false;
  //     this.phoneMatchedAccount = null; // if phoneMatchedAccount.type === tmp,  display signup button
  //   }
  // }

  // showErrorAlert(err) {
  //   let s = '';
  //   if (err === VerificationError.PHONE_NUMBER_OCCUPIED) {
  //     s = this.lang === 'en' ? 'This phone number has already bind to an wechat account, please try use wechat to login.' :
  //       '该号码已经被一个英文版的账号使用，请使用英文版登陆; 如果想更改账号请联系客服。';
  //   } else if (err === VerificationError.WRONG_CODE) {
  //     s = this.lang === 'en' ? 'verification code is wrong, please try again.' : '验证码错误，请重新尝试';
  //   } else if (err === VerificationError.NO_PHONE_NUMBER_BIND) {
  //     s = this.lang === 'en' ? 'login with phone number failed, please contact our customer service' :
  //       '使用该电话号码登陆失败，请退出重新从公众号登陆';
  //   }

  //   if (s) {
  //     alert(s);
  //     // this.snackBar.open('', s, { duration: 1500 });
  //   }
  // }

  // onVerificationCodeInput(e) {
  //   const self = this;
  //   let phone: string = this.phoneForm.value.phone;
  //   phone = phone.substring(0, 2) === '+1' ? phone.substring(2) : phone;
  //   phone = phone.match(/\d+/g).join('');

  //   if (e.target.value && e.target.value.length === 4) {
  //     const code = e.target.value;
  //     const accountId = self.account ? self.account._id : '';
  //     this.verifing = true;
  //     this.accountSvc.verifyPhoneNumber(phone, code, accountId).pipe(takeUntil(this.onDestroy$)).subscribe((r: any) => {
  //       self.verifing = false;
  //       self.verified = r.verified;

  //       if (r.err === VerificationError.NONE) {
  //         const account = r.account;
  //         const paymentMethod = this.paymentMethod;
  //         self.authSvc.setAccessTokenId(r.tokenId);
  //         self.onClosePhoneVerifyDialog({ account, paymentMethod });
  //       } else if (r.err === VerificationError.REQUIRE_SIGNUP) {
  //         self.phoneMatchedAccount = r.account; // display signup button
  //       } else {
  //         self.showErrorAlert(r.err);
  //       }
  //     });
  //   } else {
  //     this.verified = false;
  //   }
  // }

  // sendVerify() {
  //   if (this.bAllowVerify) {
  //     const accountId: string = this.account ? this.account._id : '';
  //     const successHint = this.lang === 'en' ? 'SMS Verification Code sent' : '短信验证码已发送';
  //     const failedHint = this.lang === 'en' ? 'Account issue, please contact our customer service。' : '账号有问题，请联系客服';
  //     const lang = this.lang;
  //     let phone: string = this.phoneForm.value.phone;
  //     phone = phone.substring(0, 2) === '+1' ? phone.substring(2) : phone;
  //     phone = phone.match(/\d+/g).join('');
  //     // this.resendVerify(phone).then(tokenId => {
  //     //   this.bAllowVerify = true;
  //     // });
  //     this.accountSvc.sendVerifyMsg(accountId, phone, lang).toPromise().then((tokenId: string) => {
  //       this.snackBar.open('', successHint, { duration: 1000 });
  //       // this.bGettingCode = true;
  //       if (tokenId) { // to allow api call
  //         this.authSvc.setAccessTokenId(tokenId);
  //       } else {
  //         alert(failedHint);
  //       }
  //       this.bAllowVerify = true;
  //     });
  //   }
  // }


  // signup() {
  //   const self = this;
  //   const phone = this.phoneForm.value.phone;
  //   const code = this.phoneForm.value.verificationCode;
  //   const paymentMethod = this.paymentMethod;
  //   if (phone && code) {
  //     this.accountSvc.signup(phone, code).pipe(takeUntil(this.onDestroy$)).subscribe((tokenId: any) => {
  //       if (tokenId) {
  //         self.authSvc.setAccessTokenId(tokenId);
  //         self.accountSvc.getCurrentAccount().pipe(takeUntil(this.onDestroy$)).subscribe((account: IAccount) => {
  //           if (account) {
  //             self.onClosePhoneVerifyDialog({ account, paymentMethod });
  //             // self.rx.dispatch({ type: AccountActions.UPDATE, payload: account });
  //           }
  //           this.snackBar.open('', 'Signup successful', { duration: 1000 });
  //         });
  //       } else {

  //       }
  //     });
  //   } else {
  //     // fail to signup
  //   }
  // }

  // onClosePhoneVerifyDialog(r) {
  //   if (r && r.account) {
  //     this.account = r.account;
  //     this.doPay().then((rt: any) => {
  //       this.showError(rt.err);
  //       this.loading = false;
  //       this.bSubmitted = false;

  //       if (rt.err === PaymentError.NONE) {
  //         this.rx.dispatch({ type: CartActions.CLEAR_CART, payload: [] });
  //         if (r.paymentMethod === PaymentMethod.WECHAT) {
  //           window.location.href = rt.url;
  //         } else {
  //           this.router.navigate(['order/history']);
  //         }
  //       }
  //     });
  //   } else {
  //     alert('账号注册失败,下单没成功,请联系客服');
  //   }
  //   this.modalSvc.close('myModal');
  // }
}
