import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgRedux } from '@angular-redux/store';
import { IAppState } from '../../../store';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AccountService } from '../../../account/account.service';
import { IAccount } from '../../../account/account.model';
import { FormBuilder } from '@angular/forms';
import { AuthService } from '../../../account/auth.service';
import { PageActions } from '../../../main/main.actions';
// import { OrderFormAction } from '../../order/order-form-page/order-form-page.component';
// import { PaymentError, PaymentMethod, AppType } from '../../payment/payment.model';
// import { PaymentService } from '../../payment/payment.service';
// import { OrderService } from '../../order/order.service';
import { IApp } from '../../../main/main.reducers';
import { OrderActions } from '../../../order/order.actions';
import { OrderFormAction } from '../../../order/order-form-page/order-form-page.component';

declare var Stripe;

// const AccountType = {
//   TEMP: 'tmp', // // For no logged in user who get the verification code, but didn't finish verify
//   Driver: 'D'
// };

const VerificationError = {
  NONE: 'N',
  WRONG_CODE: 'WC',
  PHONE_NUMBER_OCCUPIED: 'PO',
  REQUIRE_SIGNUP: 'RS',
  NO_PHONE_NUMBER_BIND: 'NP'
};
@Component({
  selector: 'app-edit-phone',
  templateUrl: './edit-phone.component.html',
  styleUrls: ['./edit-phone.component.scss']
})
export class EditPhoneComponent implements OnInit,OnDestroy {

  account;
  form;
  verified: boolean;
  bGettingCode = false;
  counter = 60;
  // countDown;
  lang = environment.language;
  phoneMatchedAccount;
  bAllowVerify = true;
  paymentMethod;
  action;
  loading = false;
  appCode;
  bSubmitted = false;
  currentPhone: any;



  get phone() { return this.form.get('phone'); }
  // get verificationCode() { return this.form.get('verificationCode'); }

  onDestroy$ = new Subject();
  constructor(
    private authSvc: AuthService,
    private accountSvc: AccountService,
    // private paymentSvc: PaymentService,
    // private orderSvc: OrderService,
    private fb: FormBuilder,
    private rx: NgRedux<IAppState>,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      phone: [''],
      // verificationCode: ['']
    });

    // this.rx.select('orders').pipe(takeUntil(this.onDestroy$)).subscribe((order: any) => {
    //   this.paymentMethod = order.paymentMethod;
    // });
    this.rx.select('appState').pipe(takeUntil(this.onDestroy$)).subscribe((x: IApp) => {
      this.appCode = x.code;
    });
    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      this.action = params['action'];
    });
  }

  ngOnInit() {
    // this.account = this.data.account;
    const self = this;

    this.rx.dispatch({
      type: PageActions.UPDATE_URL,
      payload: { name: 'phone-form', fromPage: 'account-setting' }
    });

    this.accountSvc.getCurrentAccount().pipe(takeUntil(this.onDestroy$)).subscribe(account => {
      self.account = account;
      if (account) {
        self.phone.patchValue(account.phone);
        this.currentPhone = account.phone;
        // self.verificationCode.patchValue('');
      }
    });
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }


  signupAndPay() {
    const accountId: string = this.account ? this.account._id : '';
    if (accountId && !this.bSubmitted) {
      this.bSubmitted = true;
      let phone: string = this.form.value.phone;
      phone = phone.substring(0, 2) === '+1' ? phone.substring(2) : phone;
      phone = phone.match(/\d+/g).join('');
      const data = {phone, verified: true};
      this.accountSvc.update({ _id: accountId }, data).pipe(takeUntil(this.onDestroy$)).subscribe(() => {
        this.router.navigate(['/account/settings']);
      });
    } else {
      alert('网络会话已丢失，请退出公众号重新尝试。');
    }
  }

}
