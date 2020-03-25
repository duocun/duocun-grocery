import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MainRoutingModule } from './main-routing.module';
import { LocationModule } from '../location/location.module';
import { AccountService } from '../account/account.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { HomeComponent } from './home/home.component';
import { SharedModule } from '../shared/shared.module';
import { MerchantModule } from '../merchant/merchant.module';
import { HeaderComponent } from './header/header.component';
import { AreaService } from '../area/area.service';
import { MerchantService } from '../merchant/merchant.service';

@NgModule({
  imports: [
    CommonModule,
    MainRoutingModule,
    MatSnackBarModule,
    LocationModule,
    SharedModule,
    MerchantModule
  ],
  declarations: [
    HomeComponent,
    HeaderComponent
  ],
  exports: [
  ],
  providers: [
    AccountService,
    AreaService,
    MerchantService
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MainModule { }
