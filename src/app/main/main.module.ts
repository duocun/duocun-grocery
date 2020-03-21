import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MainRoutingModule } from './main-routing.module';
import { LocationModule } from '../location/location.module';
import { AccountService } from '../account/account.service';
import { AuthService } from '../account/auth.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

import { HomeComponent } from './home/home.component';
import { ReactiveFormsModule } from '../../../node_modules/@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { RangeService } from '../range/range.service';
import { MerchantModule } from '../merchant/merchant.module';
import { HeaderComponent } from './header/header.component';
import { AreaModule } from '../area/area.module';
import { AreaService } from '../area/area.service';
import { MerchantService } from '../merchant/merchant.service';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MainRoutingModule,
    MatSnackBarModule,
    MatButtonToggleModule,
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
    AuthService,
    RangeService,
    AreaService,
    MerchantService
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MainModule { }
