import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MerchantRoutingModule } from './merchant-routing.module';
import { MerchantDetailPageComponent } from './merchant-detail-page/merchant-detail-page.component';
import { ProductModule } from '../product/product.module';

import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule } from '../../../node_modules/@angular/material';
import { CartModule } from '../cart/cart.module';
import { QuitRestaurantDialogComponent } from './quit-restaurant-dialog/quit-restaurant-dialog.component';
import { SharedModule } from '../shared/shared.module';
import { AreaModule } from '../area/area.module';
import { AreaService } from '../area/area.service';
import { MerchantGridComponent } from './merchant-grid/merchant-grid.component';
import { MerchantListComponent } from './merchant-list/merchant-list.component';
import { ShoppingModule } from '../shopping/shopping.module';


@NgModule({
  declarations: [
    MerchantDetailPageComponent,
    QuitRestaurantDialogComponent,
    MerchantGridComponent,
    MerchantListComponent
  ],
  imports: [
    CommonModule,
    MatTabsModule,
    MatDialogModule,
    MerchantRoutingModule,
    ProductModule,
    CartModule,
    AreaModule,
    ShoppingModule,
    SharedModule
  ],
  providers: [
    AreaService,
  ],
  exports: [
    MerchantGridComponent,
    MerchantListComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [QuitRestaurantDialogComponent]
})
export class MerchantModule { }
