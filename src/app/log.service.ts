import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';
import { AuthService } from './account/auth.service';

export enum LogEventWhiteScreenType {
  Success = "WhiteScreen Success",
  Failure = "WhiteScreen Failure",
  Exception = "WhiteScreen Exception",
} 

@Injectable()
export class LogService {
  url;
  // only send success login once
  whiteScreenLogState = {
    [LogEventWhiteScreenType.Success] : 0,
    [LogEventWhiteScreenType.Failure] : 0,
    [LogEventWhiteScreenType.Exception] : 0
  };
  constructor(
    private http: HttpClient,
    private authSvc: AuthService
  ) {
    this.url = environment.API_URL + 'EventLogs';
  }


  doPost(url: string, entity: any, filter?: any): Observable<any> {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/json');
    const accessTokenId = this.authSvc.getAccessTokenId();
    if (accessTokenId) {
      headers = headers.append('Authorization', '' + accessTokenId);
    }

    if (filter) {
      headers = headers.append('filter', JSON.stringify(filter));
    }

    return this.http.post(url, entity, { headers });
  }

  save(data) {
    return this.doPost(this.url, data).toPromise();
  }
  saveWhiteScreenLog( message: string, whiteScreenEventType: LogEventWhiteScreenType ){
    const data = {
      message: message,
      type: whiteScreenEventType.toString()
    };
    this.whiteScreenLogState[ whiteScreenEventType ]++;

    if ( whiteScreenEventType === LogEventWhiteScreenType.Exception
      ) {
        // Don't await to hang user's login action, just try to send
        // currently send all types, gradually only show exception 
        this.save(data);
      } else {
        if ( this.whiteScreenLogState[ whiteScreenEventType ] <= 1 ) { 
          // only send once, otherwise, when switch tabs, it will send
          // this.save(data);
          // do nothing
          // console.log(data); 
        }
      }
  }

}
