import { Component, OnInit, OnDestroy } from '@angular/core';
import { AccountService } from '../../account/account.service';
import { OrderService } from '../../order/order.service';
import { SharedService } from '../../shared/shared.service';
import { IOrder, OrderType } from '../../order/order.model';
// import { SocketService } from '../../shared/socket.service';
import { NgRedux } from '@angular-redux/store';
import { IAppState } from '../../store';
import { PageActions } from '../../main/main.actions';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material';
import { ICommand } from '../../shared/command.reducers';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import * as moment from 'moment';
import { environment } from '../../../environments/environment';
import { LocationService } from '../../location/location.service';
import { ILocation } from '../../location/location.model';
import { PaymentService } from '../payment.service';

@Component({
  selector: 'app-payment-history',
  templateUrl: './payment-history.component.html',
  styleUrls: ['./payment-history.component.scss']
})
export class PaymentHistoryComponent implements OnInit, OnDestroy {
  onDestroy$ = new Subject();
  account;
  payments = [];
  loading = true;
  highlightedOrderId = 0;
  currentPageNumber = 1;
  itemsPerPage = 10;
  nOrders = 0;
  lang = environment.language;
  OrderTypes = OrderType;

  constructor(
    private accountSvc: AccountService,
    private paymentSvc: PaymentService,
    private sharedSvc: SharedService,
    private locationSvc: LocationService,
    private rx: NgRedux<IAppState>,
    private router: Router,
    public dialog: MatDialog
  ) {
    this.rx.dispatch({
      type: PageActions.UPDATE_URL,
      payload: { name: 'order-history' }
    });
  }

  ngOnInit() {
    const self = this;
    this.loading = true;
    this.accountSvc.getCurrentAccount().pipe(takeUntil(this.onDestroy$)).subscribe(account => {
      self.account = account;
      if (account && account._id) {
        self.OnPageChange(this.currentPageNumber);
      } else {
        self.payments = []; // should never be here.
        this.loading = false;
      }
    });

    this.rx.select<ICommand>('cmd').pipe(takeUntil(this.onDestroy$)).subscribe((x: ICommand) => {
      if (x.name === 'reload-orders') {
        self.OnPageChange(this.currentPageNumber);
      }
    });
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  reload(clientId) {

  }

  // deprecated
  canChange(order: IOrder) {
    const allowDateTime = moment(order.delivered).set({ hour: 9, minute: 30, second: 0, millisecond: 0 });
    return allowDateTime.isAfter(moment());
  }

  // deprecated
  changeOrder(order: IOrder) {

  }

  deleteOrder(order: IOrder) {
    const accountId = this.account._id;
    // this.openDialog(accountId, order._id, order.total, order.paymentMethod, order.transactionId, order.chargeId);
  }

  // openDialog(accountId: string, orderId: string, total: number, paymentMethod: string,
  // transactionId: string, chargeId: string): void {
  // const dialogRef = this.dialog.open(RemoveOrderDialogComponent, {
  //   width: '300px',
  //   data: {
  //     title: this.lang === 'en' ? 'Hint' : '提示',
  //     content: this.lang === 'en' ? 'Are you sure to remove this order ?' : '确认要删除该订单吗？',
  //     buttonTextNo: this.lang === 'en' ? 'Cancel' : '取消',
  //     buttonTextYes: this.lang === 'en' ? 'Remove' : '删除',
  //     accountId: accountId,
  //     orderId: orderId,
  //     total: total,
  //     paymentMethod: paymentMethod,
  //     transactionId: transactionId,
  //     chargeId: chargeId
  //   },
  // });

  // dialogRef.afterClosed().pipe(takeUntil(this.onDestroy$)).subscribe(result => {

  // });
  // }

  onSelect(order) {
    // this.select.emit({ order: c });
    this.highlightedOrderId = order._id;
  }

  toDateTimeString(s) {
    return s ? this.sharedSvc.toDateTimeString(s) : '';
  }

  // sUTC --- must be 'YYYY-MM-DDTHH:mm:ss.000Z';
  toDateString(sUTC) {
    const local = moment(sUTC);
    return local.format('YYYY-MM-DD');
  }



  OnPageChange(pageNumber) {
    const clientId = this.account._id;
    const itemsPerPage = this.itemsPerPage;

    this.loading = true;
    this.currentPageNumber = pageNumber;

    // getHistory(filter: any, currentPageNumber: number, itemsPerPage: number)
    this.paymentSvc.getHistory(clientId, pageNumber, itemsPerPage)
      .pipe(takeUntil(this.onDestroy$))
      .subscribe((ret: any) => {
        this.payments = ret.data;
        // this.payments = [{
        //   paymentId: '111111111111111',
        //   created: '2020-04-29',
        //   client: {phone: '123456789'},
        //   address: '234 Fello St, Toronto',
        //   delivers: [
        //     {
        //       date: '2020-05-01',
        //       merchants: [
        //         {name: '蔬果超市', products: [{productName: 'a', quantity: 2, price: 9.69},
        //                                      {productName: 'aa', quantity: 1, price: 6.99}] },
        //         {name: '苏宁电器', products: [{productName: 'b', quantity: 3, price: 7.99}] },
        //       ]
        //     },
        //     {
        //       date: '2020-05-05',
        //       merchants: [
        //         {name: '大娘水饺', products: [{productName: 'a', quantity: 2, price: 7.99},
        //                                      {productName: 'aa', quantity: 5, price: 12.99}] },
        //         {name: '鸭血粉丝汤', products: [{productName: 'b', quantity: 3, price: 7.99},
        //                                       {productName: 'b', quantity: 13, price: 10.59}] },
        //       ]
        //     },
        //   ],
        //   total: 122,
        //   price: 120,
        //   tax: 15,
        //   tips: 0,
        //   deliveryCost: 0,
        //   deliveryDiscount: 0,
        //   groupDiscount: 0,
        //   overRangeCharge: 0
        // }];
        this.nOrders = ret.count;
        this.loading = false;
      });
  }

  getAddress(location: ILocation) {
    return this.locationSvc.getAddrString(location);
  }

}
