import { Component, OnInit, OnDestroy } from '@angular/core';
import { AccountService } from '../account.service';
import { NgRedux } from '@angular-redux/store';
import { IAppState } from '../../store';
import { Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import * as Cookies from 'js-cookie';
import { PageActions } from '../../main/main.actions';
import { LocationService } from '../../location/location.service';
import { AuthService } from '../auth.service';
import { IAccount } from '../account.model';



@Component({
  selector: 'app-account-page',
  templateUrl: './account-page.component.html',
  styleUrls: ['./account-page.component.scss']
})
export class AccountPageComponent implements OnInit, OnDestroy {
  account: IAccount;
  onDestroy$ = new Subject();
  phoneVerified: string;
  form;
  balance: number;
  address: string;
  currentPhone: any;
  constructor(
    private accountSvc: AccountService,
    private authSvc: AuthService,
    private rx: NgRedux<IAppState>,
    private router: Router,
    private locationSvc: LocationService,
  ) {
    const self = this;

    this.rx.dispatch({ type: PageActions.UPDATE_URL, payload: { name: 'account-setting' } });

    this.accountSvc.getCurrentAccount().pipe(takeUntil(this.onDestroy$)).subscribe((r: any) => {
      self.account = r.data;
      self.balance = r.data ? r.data.balance : 0;

      if (r.data && r.data.location) {
        self.address = this.locationSvc.getAddrString(r.data.location);
        Cookies.set('duocun-old-location', r.data.location);
      } else {
        Cookies.set('duocun-old-location', '');
      }

      if (r.data && r.data.phone) {
        this.currentPhone = r.data.phone;
        Cookies.set('duocun-old-phone', r.data.phone);
      } else {
        Cookies.set('duocun-old-phone', '');
      }
    });
  }


  ngOnInit() {

  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  getDefaultAddress() {
    return this.account.location ? this.locationSvc.getAddrString(this.account.location) : '';
  }

  changePhoneNumber() {
    this.router.navigate(['contact/phone-form'], { queryParams: { fromPage: 'account-setting' } });
  }

  changeAddress() {
    this.router.navigate(['contact/address-form'], { queryParams: { fromPage: 'account-setting' } });
  }

  logout() {
    this.accountSvc.quitSystem();
  }

  toBalancePage() {
    this.router.navigate(['account/balance']);
  }

  toEditPhonePage() {
    this.router.navigate(['account/edit-phone']);
  }

  toAddCreditPage() {
    this.router.navigate(['account/add-credit']);
  }
}
