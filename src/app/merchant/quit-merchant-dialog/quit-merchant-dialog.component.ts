import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import { NgRedux } from '@angular-redux/store';
import { IAppState } from '../../store';
import { CartActions } from '../../cart/cart.actions';
import { Router} from '@angular/router';
import { Subject } from 'rxjs';
import { MerchantActions } from '../merchant.actions';

export interface IDialogData {
  merchantId: string;
  onSchedule: string;
  targetUrl: string;
}

@Component({
  selector: 'app-quit-merchant-dialog',
  templateUrl: './quit-merchant-dialog.component.html',
  styleUrls: ['./quit-merchant-dialog.component.scss']
})
export class QuitMerchantDialogComponent implements OnInit, OnDestroy {
  onDestroy$ = new Subject();
  constructor(
    private rx: NgRedux<IAppState>,
    private router: Router,
    public dialogRef: MatDialogRef<QuitMerchantDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IDialogData
  ) { }

  ngOnInit() {

  }
  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  onLeave() {
    this.dialogRef.close({action: 'leave'});
    this.rx.dispatch({ type: CartActions.CLEAR_CART, payload: [] });
    this.rx.dispatch({ type: MerchantActions.CLEAR_MERCHANT, payload: null});
    this.router.navigate(['merchant/list/' + this.data.merchantId]); // !!! used for close dialog

    setTimeout(() => {
      this.router.navigate(['main/home']);
    }, 200);
  }

  onStay() {
    this.dialogRef.close({action: 'stay'});
    this.router.navigate(['merchant/list/' + this.data.merchantId]);
  }
}

