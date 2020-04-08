import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PaymentFormComponent } from './payment-form/payment-form.component';
import { CreditCardPageComponent } from './credit-card-page/credit-card-page.component';

const routes: Routes = [
  { path: 'form', component: PaymentFormComponent },
  { path: 'card', component: CreditCardPageComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PaymentRoutingModule { }
