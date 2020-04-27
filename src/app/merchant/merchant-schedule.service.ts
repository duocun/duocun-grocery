import { Injectable } from '@angular/core';
import { AuthService } from '../account/auth.service';
import { EntityService } from '../entity.service';
import { ILocation } from '../location/location.model';
import { Observable } from 'rxjs';

import { HttpClient, HttpHeaders } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class MerchantScheduleService extends EntityService {
  constructor(
    public authSvc: AuthService,
    public http: HttpClient
  ) {
    super(authSvc, http);
    this.url = super.getBaseUrl() + 'MerchantSchedules';
  }


  // // dateType ---  'today', 'tomorrow'
  // load(origin: ILocation, dateType: string, filter: any): Observable<any> {
  //   const url = this.url + '/load';
  //   return this.doPost(url, { origin: origin, dateType: dateType }, filter);
  // }

    getAvailableSchedules(merchantId: string, location: any) {
    const url = this.url + '/availables';
    return this._get(url, { merchantId, location });
  }

  getAvailableMerchants(areaId: any) {
    const url = this.url + '/availableMerchants';
    return this._get(url, { areaId });
  }
}
