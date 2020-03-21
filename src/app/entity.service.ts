import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { AuthService } from './account/auth.service';
import { resolve } from 'url';

export const HttpStatus = {
  OK: { code: 200, text: 'OK' }
};

@Injectable()
export class EntityService {
  authPrefix = environment.AUTH_PREFIX;
  public url = environment.API_URL;

  constructor(
    public cookieSvc: AuthService,
    public http: HttpClient
  ) {
  }

  getBaseUrl() {
    return environment.API_URL;
  }



  // with database join
  find(filter?: any): Observable<any> {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/json');
    const accessTokenId = this.cookieSvc.getAccessTokenId();
    if (accessTokenId) {
      headers = headers.append('Authorization', this.authPrefix + accessTokenId);
      // httpParams = httpParams.append('access_token', LoopBackConfig.getAuthPrefix() + accessTokenId);
    }
    if (filter) {
      headers = headers.append('filter', JSON.stringify(filter));
    }
    return this.http.get(this.url, { headers: headers });
  }

  findById(id: string, filter?: any): Observable<any> {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/json');
    const accessTokenId = this.cookieSvc.getAccessTokenId();
    if (accessTokenId) {
      headers = headers.append('Authorization', this.authPrefix + accessTokenId);
    }
    if (filter) {
      headers = headers.append('filter', JSON.stringify(filter));
    }
    return this.http.get(this.url + '/' + id, { headers: headers });
  }

  doGet(url: string, filter?: any, fields?: any): Observable<any> {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/json');
    const accessTokenId = this.cookieSvc.getAccessTokenId();
    if (accessTokenId) {
      headers = headers.append('Authorization', this.authPrefix + accessTokenId);
    }
    if (filter) {
      headers = headers.append('filter', JSON.stringify(filter));
    }
    if (fields) {
      headers = headers.append('fields', JSON.stringify(fields));
    }
    return this.http.get(url, { headers: headers });
  }

  doPost(url: string, entity: any, filter?: any): Observable<any> {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/json');
    const accessTokenId = this.cookieSvc.getAccessTokenId();
    if (accessTokenId) {
      headers = headers.append('Authorization', this.authPrefix + accessTokenId);
    }

    if (filter) {
      headers = headers.append('filter', JSON.stringify(filter));
    }

    return this.http.post(url, entity, { headers: headers });
  }

  doPatch(url: string, data: any): Observable<any> {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/json');
    const accessTokenId = this.cookieSvc.getAccessTokenId();
    if (accessTokenId) {
      headers = headers.append('Authorization', this.authPrefix + accessTokenId);
    }
    return this.http.patch(url, data, { headers: headers });
  }

  save(entity: any): Observable<any> {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/json');
    const accessTokenId = this.cookieSvc.getAccessTokenId();
    if (accessTokenId) {
      headers = headers.append('Authorization', this.authPrefix + accessTokenId);
    }
    return this.http.post(this.url, entity, { headers: headers });
  }

  update(filter: any, data: any): Observable<any> {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/json');
    const accessTokenId = this.cookieSvc.getAccessTokenId();
    if (accessTokenId) {
      headers = headers.append('Authorization', this.authPrefix + accessTokenId);
    }
    return this.http.patch(this.url, { filter: filter, data: data }, { headers: headers });
  }

  remove(filter?: any): Observable<any> {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/json');
    const accessTokenId = this.cookieSvc.getAccessTokenId();
    if (accessTokenId) {
      headers = headers.append('Authorization', this.authPrefix + accessTokenId);
    }
    if (filter) {
      headers = headers.append('filter', JSON.stringify(filter));
    }
    return this.http.delete(this.url, { headers: headers });
  }

  removeById(id: string): Observable<any> {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/json');
    const accessTokenId = this.cookieSvc.getAccessTokenId();
    if (accessTokenId) {
      headers = headers.append('Authorization', this.authPrefix + accessTokenId);
      // httpParams = httpParams.append('access_token', LoopBackConfig.getAuthPrefix() + accessTokenId);
    }
    return this.http.delete(this.url + '/' + id, { headers: headers });
  }


  upsertOne(query: any, doc: any): Observable<any> {
    const url = this.url + '/upsertOne';
    return this.doPost(url, { query: query, data: doc });
  }


  // v2
  getById(id, fields = null) {
    const url = this.url + '/' + id;
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
      this.http.get(url, { headers: headers }).toPromise().then((rsp: any) => {
        if (rsp && rsp.err) {
          resolve();
        } else {
          resolve(rsp);
        }
      });
    });
  }

  // without database join
  quickFind(filter?: any, fields?: any) {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/json');
    const accessTokenId = this.cookieSvc.getAccessTokenId();
    if (accessTokenId) {
      headers = headers.append('Authorization', this.authPrefix + accessTokenId);
      // httpParams = httpParams.append('access_token', LoopBackConfig.getAuthPrefix() + accessTokenId);
    }
    if (filter) {
      headers = headers.append('filter', JSON.stringify(filter));
    }
    if (fields) {
      headers = headers.append('fields', JSON.stringify(fields));
    }
    // if (distinct) {
    //   headers = headers.append('distinct', JSON.stringify(distinct));
    // }
    // tslint:disable-next-line:no-shadowed-variable
    return new Promise((resolve, reject) => {
      this.http.get(this.url + '/qFind', { headers: headers }).toPromise().then((rsp: any) => {
        if (rsp && rsp.err) {
          resolve();
        } else {
          resolve(rsp);
        }
      });
    });
  }


  // v2
  _get(url: string, data?: any, fields?: any){
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/json');
    const accessTokenId = this.cookieSvc.getAccessTokenId();
    if (accessTokenId) {
      headers = headers.append('Authorization', this.authPrefix + accessTokenId);
    }
    if (data) {
      headers = headers.append('data', JSON.stringify(data));
    }
    if (fields) {
      headers = headers.append('fields', JSON.stringify(fields));
    }
    return new Promise((_resolve, reject) => {
      this.http.get(url, { headers: headers }).toPromise().then((rsp: any) => {
        if (rsp && rsp.err) {
          _resolve();
        } else {
          _resolve(rsp);
        }
      });
    });
  }

  _post(url: string, entity: any, filter?: any) {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/json');
    const accessTokenId = this.cookieSvc.getAccessTokenId();
    if (accessTokenId) {
      headers = headers.append('Authorization', this.authPrefix + accessTokenId);
    }

    if (filter) {
      headers = headers.append('filter', JSON.stringify(filter));
    }
    return new Promise((_resolve, reject) => {
      this.http.post(url, entity, { headers: headers }).toPromise().then((rsp: any) => {
        if (rsp && rsp.err) {
          _resolve();
        } else {
          _resolve(rsp);
        }
      });
    });
  }
}
