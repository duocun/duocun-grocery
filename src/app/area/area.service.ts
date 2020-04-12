import { Injectable } from '@angular/core';
import { EntityService } from '../entity.service';
import { AuthService } from '../account/auth.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ILatLng } from '../location/location.model';

@Injectable({
  providedIn: 'root'
})
export class AreaService extends EntityService {
  url;
  constructor(
    public authSvc: AuthService,
    public http: HttpClient
  ) {
    super(authSvc, http);
    this.url = super.getBaseUrl() + 'Areas';
  }

  getNearestArea( origin: ILatLng ): Observable<any> {
    const url = this.url + '/nearest';
    return this.doPost(url, { origin: origin });
  }

  getMyArea(location: any) {
    const url = this.url + '/my';
    return this._get(url, { location });
  }
}
