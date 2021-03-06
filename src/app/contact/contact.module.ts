import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ContactRoutingModule } from './contact-routing.module';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { LocationModule } from '../location/location.module';
import { LocationService } from '../location/location.service';
import { AccountService } from '../account/account.service';
import { PhoneFormPageComponent } from './phone-form-page/phone-form-page.component';
import { MatSnackBarModule, MatFormFieldModule, MatInputModule } from '@angular/material';
import { MatStepperModule } from '@angular/material/stepper';

import { DistanceService } from '../location/distance.service';
import { AddressFormPageComponent } from './address-form-page/address-form-page.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    ContactRoutingModule,
    SharedModule,
    LocationModule
  ],
  declarations: [
    PhoneFormPageComponent,
    AddressFormPageComponent,
  ],
  providers: [
    LocationService,
    AccountService,
    DistanceService,
    DistanceService
  ]
})
export class ContactModule { }
