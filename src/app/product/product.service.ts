import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EntityService } from '../entity.service';
import { AuthService } from '../account/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService extends EntityService {
  url;
  constructor(
    public authSvc: AuthService,
    public http: HttpClient,
  ) {
    super(authSvc, http);
    this.url = super.getBaseUrl() + 'Products';
  }

  getById(id, fields = null) {
    const url = this.url + '/G/' + id;
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/json');
    const accessTokenId = this.cookieSvc.getAccessTokenId();
    if (accessTokenId) {
      headers = headers.append('Authorization', this.authPrefix + accessTokenId);
    }
    if (fields) {
      headers = headers.append('fields', JSON.stringify(fields));
    }
    // tslint:disable-next-line:no-shadowed-variable
    return new Promise((resolve, reject) => {
      this.http.get(url, { headers: headers }).toPromise().then((r: any) => {
        if (r.code==='success') {
          resolve(r.data);
        } else {
          resolve({});
        }
      });
    });
  }


  categorize(filter: any, lang: string): Observable<any> {
    const url = this.url + '/categorize';
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/json');
    const accessTokenId = this.cookieSvc.getAccessTokenId();
    if (accessTokenId) {
      headers = headers.append('Authorization', this.authPrefix + accessTokenId);
    }
    if (filter) {
      headers = headers.append('filter', JSON.stringify(filter));
    }
    headers = headers.append('lang', lang);
    return this.http.get(url, {headers: headers});
  }

  quickFind(query) {
    const url = this.url + '/G?merchantId=' + query.merchantId + '&status=' + query.status;
    return this.doGet(url, query).toPromise();
  }

}
