import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { PaginatePipe, NgxPaginationModule } from 'ngx-pagination';

import { PaymentRoutingModule } from './payment-routing.module';
import { PaymentFormComponent } from './payment-form/payment-form.component';
import { OrderService } from '../order/order.service';
import { TransactionService } from '../transaction/transaction.service';
import { BalanceService } from './balance.service';
import { AccountService } from '../account/account.service';
import { SharedService } from '../shared/shared.service';
import { CreditCardFormComponent } from './credit-card-form/credit-card-form.component';
import { CreditCardPageComponent } from './credit-card-page/credit-card-page.component';
import { SharedModule } from '../shared/shared.module';
import { PaymentHistoryComponent } from './payment-history/payment-history.component';

@NgModule({
  imports: [
    CommonModule,
    MatSnackBarModule,
    NgxPaginationModule,
    PaymentRoutingModule,
    SharedModule
  ],
  declarations: [
    PaymentFormComponent,
    CreditCardFormComponent,
    CreditCardPageComponent,
    PaymentHistoryComponent
  ],
  providers: [
    OrderService,
    BalanceService,
    TransactionService,
    AccountService,
    SharedService
  ],
  exports: [
    CreditCardFormComponent
  ]
})
export class PaymentModule { }
