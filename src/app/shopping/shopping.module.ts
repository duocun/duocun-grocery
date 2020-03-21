import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ShoppingRoutingModule } from './shopping-routing.module';
import { ShoppingListComponent } from './shopping-list/shopping-list.component';
import { ShoppingItemComponent } from './shopping-item/shopping-item.component';
import { ShoppingPageComponent } from './shopping-page/shopping-page.component';


@NgModule({
  declarations: [ShoppingListComponent, ShoppingItemComponent, ShoppingPageComponent],
  imports: [
    CommonModule,
    ShoppingRoutingModule
  ],
  exports: [
    ShoppingItemComponent,
    ShoppingListComponent
  ]
})
export class ShoppingModule { }
