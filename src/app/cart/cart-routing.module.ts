import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DeliveryPageComponent } from './delivery-page/delivery-page.component';

const routes: Routes = [
  {path: 'delivery/:id', component: DeliveryPageComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CartRoutingModule { }
