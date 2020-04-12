import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef, AfterViewInit, ElementRef } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Location } from '@angular/common';
import { LocationService } from '../../location/location.service';
import { AccountService } from '../../account/account.service';
import { ILocationHistory, IPlace, ILocation, GeoPoint } from '../../location/location.model';
import { NgRedux } from '@angular-redux/store';
import { IAppState } from '../../store';
import { PageActions, AppStateActions } from '../../main/main.actions';
// import { SocketService } from '../../shared/socket.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AppState, IApp } from '../main.reducers';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ICommand } from '../../shared/command.reducers';
import { IAccount } from '../../account/account.model';
import { AccountActions } from '../../account/account.actions';
import { MatSnackBar } from '@angular/material';
import { CommandActions } from '../../shared/command.actions';
import { IAddressAction } from '../../location/address.reducer';
import { AddressActions } from '../../location/address.actions';
import { DeliveryActions } from '../../delivery/delivery.actions';
import { IDeliveryAction } from '../../delivery/delivery.reducer';
import * as moment from 'moment';
import { AreaService } from '../../area/area.service';
import { MerchantType, IMerchant, MerchantStatus } from '../../merchant/merchant.model';
import { MerchantService } from '../../merchant/merchant.service';
import { IDelivery } from '../../delivery/delivery.model';
import { AppType } from '../../payment/payment.model';
import { CartActions } from '../../cart/cart.actions';
import { MerchantScheduleService } from '../../merchant/merchant-schedule.service';
import { MerchantActions } from '../../merchant/merchant.actions';

const WECHAT_APP_ID = environment.WECHAT.APP_ID;
const WECHAT_REDIRCT_URL = environment.WECHAT.REDIRECT_URL;
const QRCODE_PICTURE = '8740e1f1-986c-4b70-81c2-63ec3462713d.jpg';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  center: GeoPoint = { lat: 43.761539, lng: -79.411079 };
  restaurants;
  places: IPlace[];
  deliveryAddress = '';
  placeholder = 'Delivery Address';
  mapFullScreen = true;
  subscrAccount;
  account: IAccount;
  bHideMap = false;
  bTimeOptions = false;
  // overdue;
  afternoon;
  inRange = true;
  onDestroy$ = new Subject<any>();
  loading = false;
  merchants;
  location: ILocation;

  bInputLocation = false;
  // placeForm;
  historyAddressList = [];
  suggestAddressList = [];

  mapRanges;
  mapZoom;
  mapCenter;
  areas; // for display downtown in map

  sOrderDeadline;
  bAddressList = false;
  bPayment = false;
  lang = environment.language;
  bOrderEnded = false;

  date = { code: 'L', type: 'today' }; // default value
  menu = 'home';
  state;  // manage default location
  QRCODE_URL = environment.MEDIA_URL + QRCODE_PICTURE;

  cart;
  locationSubscription;

  clientId;
  page;
  tokenId;
  appCode;

  constructor(
    private accountSvc: AccountService,
    private locationSvc: LocationService,
    private areaSvc: AreaService,
    private merchantSvc: MerchantService,
    private merchantSchduleSvc: MerchantScheduleService,
    private location$: Location,
    private router: Router,
    private route: ActivatedRoute,
    private rx: NgRedux<IAppState>,
    private snackBar: MatSnackBar,
  ) {
    const self = this;

    this.rx.dispatch({ type: PageActions.UPDATE_URL, payload: { name: 'home' } });

    this.rx.select('appState').pipe(takeUntil(this.onDestroy$)).subscribe((d: IApp) => {
      this.state = d.state;
    });

    this.rx.select('cart').pipe(takeUntil(this.onDestroy$)).subscribe(cart => {
      this.cart = cart;
    });
    // receive delivery from merchant detail page click brower back button event
    this.rx.select('delivery').pipe(takeUntil(this.onDestroy$)).subscribe((d: IDelivery) => {
      if (d && d.dateType) {
        this.date = d.dateType === 'today' ? { code: 'L', type: 'today' } : { code: 'R', type: 'tomorrow' };
      } else { // set default date
        if (this.date.code === 'L') {
          const today = moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
          this.rx.dispatch({ type: DeliveryActions.UPDATE_DATE, payload: { date: today, dateType: 'today' } });
        } else {
          const tomorrow = moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).add(1, 'days');
          this.rx.dispatch({ type: DeliveryActions.UPDATE_DATE, payload: { date: tomorrow, dateType: 'tomorrow' } });
        }
      }

      // reload address in address search
      if (this.state === AppState.READY) {
        this.location = d ? d.origin : null;
        if (d && d.origin) {
          self.deliveryAddress = self.locationSvc.getAddrString(d.origin);
        } else {
          self.deliveryAddress = '';
        }
      }
    });

    this.rx.select<ICommand>('cmd').pipe(takeUntil(this.onDestroy$)).subscribe((x: ICommand) => {
      if (x.name === 'clear-location-list') {
        this.places = [];
      }
    });

    this.locationSubscription = this.location$.subscribe((x) => {
      if (window.location.pathname.indexOf('merchant/list') !== -1) {
        if (this.cart && this.cart.length > 0) {
          this.rx.dispatch({ type: CartActions.CLEAR_CART, payload: [] });
          this.rx.dispatch({ type: MerchantActions.CLEAR_MERCHANT, payload: null });
          // this.accountSvc.quitSystem();
          this.router.navigate(['/']);
        }
      } else if (window.location.pathname.endsWith('order/history')) {

      }
    });
  }

  login(code) {
    // tslint:disable-next-line:no-shadowed-variable
    return new Promise((resolve, reject) => {
      this.accountSvc.getCurrentAccount().pipe(takeUntil(this.onDestroy$)).subscribe((account: IAccount) => {
        if (account) {
          resolve(account);
        } else {
          if (code) { // try wechat login
            this.accountSvc.wxLogin(code).then((r: any) => {
              if (r) {
                this.accountSvc.setAccessTokenId(r.tokenId);
                this.snackBar.open('', '微信登录成功。', { duration: 1000 });
                resolve(r.account);
              } else {
                this.snackBar.open('', '微信登录失败。', { duration: 1000 });
                resolve();
              }
            });
          } else {
            resolve();
          }
        }
      });
    });
  }

  ngOnInit() {
    const self = this;
    this.places = []; // clear address list
    self.route.queryParamMap.pipe(takeUntil(this.onDestroy$)).subscribe(queryParams => {
      // if url has format '...?cId=x&p=y', it is some procedure that re-enter the home page
      const clientId = queryParams.get('cId'); // use for after card pay, could be null
      const page = queryParams.get('p');

      this.clientId = clientId;
      this.page = page;

      if (page === 'b') { // for wechatpay add credit procedure
        if (clientId) {
          self.accountSvc.find({ _id: clientId }).pipe(takeUntil(this.onDestroy$)).subscribe((accounts: IAccount[]) => {
            self.rx.dispatch({ type: AccountActions.UPDATE, payload: accounts[0] });
            self.router.navigate(['account/balance']);
          });
        } else {
          self.accountSvc.getCurrentAccount().pipe(takeUntil(this.onDestroy$)).subscribe((account: IAccount) => {
            self.rx.dispatch({ type: AccountActions.UPDATE, payload: account });
            self.router.navigate(['account/balance']);
          });
        }
      } else if (page === 'h') { // for wechatpay procedure
        if (clientId) {
          self.bPayment = true;
          self.accountSvc.find({ _id: clientId }).pipe(takeUntil(this.onDestroy$)).subscribe((accounts: IAccount[]) => {
            self.rx.dispatch({ type: AccountActions.UPDATE, payload: accounts[0] });
            self.router.navigate(['order/history']);
          });
        } else {
          self.accountSvc.getCurrentAccount().pipe(takeUntil(this.onDestroy$)).subscribe((account: IAccount) => {
            self.rx.dispatch({ type: AccountActions.UPDATE, payload: account });
            self.router.navigate(['order/history']);
          });
        }
      } else {
        const tokenId = queryParams.get('token'); // from proxy
        const appCode = queryParams.get('state');

        this.tokenId = tokenId;
        this.appCode = appCode ? appCode.toString() : '';
        this.rx.dispatch({ type: AppStateActions.UPDATE_APP_CODE, payload: appCode });

        if (tokenId) {
          this.accountSvc.setAccessTokenId(tokenId);
          this.accountSvc.getCurrentAccount().pipe(takeUntil(this.onDestroy$)).subscribe((account: IAccount) => {
            self.account = account;
            // use for manage default location
            this.rx.dispatch({ type: AppStateActions.UPDATE_APP_STATE, payload: AppState.READY });
            self.mount(account);
          });
        } else {
          const code = queryParams.get('code');
          this.loading = true;
          this.login(code).then((account: IAccount) => {
            self.account = account;
            // use for manage default location
            this.rx.dispatch({ type: AppStateActions.UPDATE_APP_STATE, payload: AppState.READY });
            self.mount(account);
          });
        }
      }
    });
  }

  ngOnDestroy() {
    this.locationSubscription.unsubscribe();
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }


  showMap(origin) {
    const self = this;
    // tslint:disable-next-line:no-shadowed-variable
    return new Promise((resolve, reject) => {
      this.areaSvc.quickFind({ appType: AppType.GROCERY }).then((areas: any[]) => {
        const farNorth = { lat: 44.2653618, lng: -79.4191007 };
        self.areas = areas;
        self.mapZoom = 9;
        self.mapCenter = {
          lat: (origin.lat + farNorth.lat) / 2,
          lng: (origin.lng + farNorth.lng) / 2
        };
        resolve();
      });
    });
  }

  updateFooterStatus(account: IAccount) {
    this.rx.dispatch({ type: CommandActions.SEND, payload: { name: 'loggedIn', args: null } }); // for updating footer
    this.rx.dispatch({ type: AccountActions.UPDATE, payload: account });
  }

  mount(account: IAccount) {
    const self = this;
    const accountId = account ? account._id : null;

    this.updateFooterStatus(account);

    const origin = this.location ? this.location : (account ? account.location : null);
    if (origin) {
      self.areaSvc.getMyArea(origin).then((area: any) => {
        // self.location = origin;
        // self.deliveryAddress = self.locationSvc.getAddrString(origin); // set address text to input
        self.inRange = area ? true : false;
        self.rx.dispatch<IDeliveryAction>({ type: DeliveryActions.UPDATE_ORIGIN, payload: { origin } });
        if (area) {
          self.loadMerchants(area._id).then(rs => {
            self.loading = false;
          });
        } else {
          self.showMap(origin).then(() => {
            self.merchants = [];
            self.loading = false;
          });
        }
      });
    } else {
      self.loadMerchants().then(rs => {
        self.loading = false;
      });
    }

    if (accountId) {
      this.locationSvc.find({ accountId }).pipe(takeUntil(this.onDestroy$)).subscribe((lhs: ILocationHistory[]) => {
        const a = this.locationSvc.toPlaces(lhs);
        self.historyAddressList = a;
      });
    } else {
      self.historyAddressList = [];
      self.deliveryAddress = '';
    }
  }

  showLocationList() {
    return this.places && this.places.length > 0;
  }

  onAddressInputFocus(e?: any) {
    const account = this.account;
    this.places = [];

    if (account) {
      // const accountId = account._id;
      // const visited = account.visited;
      // if (!visited) {
      //   this.account.visited = true;
      //   this.accountSvc.update({ _id: accountId }, { visited: true }).pipe(takeUntil(this.onDestroy$)).subscribe(r => {
      //     this.rx.dispatch({ type: AccountActions.UPDATE, payload: this.account });
      //   });
      // }

      if (e && e.input) {
        this.places = this.suggestAddressList;
      } else {
        this.places = this.historyAddressList.map(x => Object.assign({}, x));
      }
      this.bAddressList = true;
    }
  }

  onAddressInputChange(e) {
    const v = e.input;
    if (v && v.length >= 3) {
      this.rx.dispatch<IAddressAction>({
        type: AddressActions.UPDATE,
        payload: v
      });
      this.getSuggestLocationList(e.input, true);
      this.bAddressList = true;
    }
  }

  onBack() {
    this.places = [];
    this.inRange = true;
  }

  onAddressInputClear(e) {
    this.deliveryAddress = '';
    this.location = null;
    this.places = [];
    this.rx.dispatch({ type: DeliveryActions.UPDATE_ORIGIN, payload: { origin: null } });
    this.onAddressInputFocus({ input: '' });
  }

  getSuggestLocationList(input: string, bShowList: boolean) {
    const self = this;
    this.places = [];
    this.locationSvc.reqPlaces(input).pipe(takeUntil(this.onDestroy$)).subscribe((ps: IPlace[]) => {
      if (ps && ps.length > 0) {
        const places = [];
        ps.map(p => {
          p.type = 'suggest';
          places.push(Object.assign({}, p));
        });

        self.suggestAddressList = places;
        if (bShowList) {
          self.places = places; // without lat lng
        }
      }
    });
  }

  // callback of the location list selection
  onSelectPlace(e) {
    const self = this;
    const r: ILocation = e.location;
    this.places = [];
    this.location = r;
    this.bAddressList = false;
    // this.loading = true;
    if (r) {
      this.deliveryAddress = e.address; // set address text to input
      this.rx.dispatch<IDeliveryAction>({ type: DeliveryActions.UPDATE_ORIGIN, payload: { origin: r } });

      if (self.account) {
        const accountId = self.account._id;
        const accountName = self.account.username;
        const query = { accountId: accountId, placeId: r.placeId };
        const lh = { accountId: accountId, accountName: accountName, placeId: r.placeId, location: r };

        self.locationSvc.upsertOne(query, lh).pipe(takeUntil(this.onDestroy$)).subscribe(() => {

        });
      }

      self.rx.dispatch({ type: DeliveryActions.UPDATE_ORIGIN, payload: { origin: r } });
      self.deliveryAddress = self.locationSvc.getAddrString(r); // set address text to input
      self.location = r; // update merchant list

      const origin = self.location;

      // self.rangeSvc.inDeliveryRange(origin).pipe(takeUntil(this.onDestroy$)).subscribe(inRange => {
      self.areaSvc.getMyArea(origin).then((area: any) => {
        self.inRange = area ? true : false;
        if (self.inRange) {
          self.loadMerchants(area._id).then(rs => {
            self.loading = false;
          });
        } else {
          self.showMap(origin).then(() => {
            self.merchants = [];
            self.loading = false;
          });
        }
      });
      // });
    } else {
      self.loadMerchants().then(rs => {
        self.loading = false;
      });
    }
  }

  onDateChange(e) {
    const self = this;
  }

  resetAddress() {
    this.location = null;
    this.inRange = true;
    this.deliveryAddress = '';
  }

  // -----------------------------------------------------
  // dateType --- string 'today', 'tomorrow'
  loadMerchants(areaId?: any) {
    const self = this;
    return new Promise((res, rej) => {
      const query = { status: MerchantStatus.ACTIVE, type: MerchantType.GROCERY };
      this.merchantSvc.quickFind(query).then((rs: IMerchant[]) => {
        if (areaId) {
          this.merchantSchduleSvc.getAvailableMerchants(areaId).then((merchantIds: any[]) => {
            if (merchantIds && merchantIds.length > 0) {
              const availables = rs.filter(m => merchantIds.indexOf(m._id) !== -1);
              self.merchants = availables;
              res(availables);
            } else {
              self.merchants = [];
              res([]);
            }
          });
        } else {
          self.merchants = rs;
          res(rs);
        }
      });
    });
  }

  // process url and redirect to corresponding process
  routeUrl() {
    // v1
    // try default login
    //   self.accountSvc.getCurrentAccount().pipe(takeUntil(this.onDestroy$)).subscribe((account: IAccount) => {
    //     if (account) { // if already use cookie to login
    //       self.account = account;
    //       self.init(account).then((origin: any) => {
    //         resolve(origin);
    //       });
    //     } else {
    //       const code = queryParams.get('code');
    //       if (code) { // try wechat login
    //         this.accountSvc.wechatLogin(code).pipe(takeUntil(this.onDestroy$)).subscribe((tokenId: string) => {
    //           if (tokenId) {
    //             self.authSvc.setAccessTokenId(tokenId);
    //             // retry default login
    //             self.accountSvc.getCurrentAccount().pipe(takeUntil(this.onDestroy$)).subscribe((accountWX: Account) => {
    //               if (accountWX) {
    //                 self.account = accountWX;
    //                 self.snackBar.open('', '微信登录成功。', { duration: 1000 });
    //                 self.init(accountWX).then((origin: any) => {
    //                   resolve(origin);
    //                 });
    //               } else {
    //                 self.snackBar.open('', '微信登录失败。', { duration: 1000 });
    //                 resolve();
    //               }
    //             });
    //           } else { // failed from shared link login
    //             this.loading = false;

    //             setTimeout(() => {
    //               // redirect to wechat authorize button page
    //               window.location.href = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=' + WECHAT_APP_ID
    //                 + '&redirect_uri=' + WECHAT_REDIRCT_URL
    //                 + '&response_type=code&scope=snsapi_userinfo&state=123#wechat_redirect';

    //               resolve(); // fix me !!!
    //             }, 500);
    //           }
    //         });
    //       } else { // no code in router, means did not use wechat login, and failed to use default login (en version eg.)
    //         resolve();
    //       }
    //     }
    //   }, err => {
    //     resolve();
    //   });
    // }
  }

}
