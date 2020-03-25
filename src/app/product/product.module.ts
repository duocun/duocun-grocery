import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProductRoutingModule } from './product-routing.module';
import { CartModule } from '../cart/cart.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    FormsModule,
    ReactiveFormsModule,
    ProductRoutingModule,
    SharedModule,
    CartModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
  ],
  exports: [
  ],
  providers: [
  ],
})
export class ProductModule { }
