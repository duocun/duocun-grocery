import { Injectable } from '@angular/core';
import * as Cookies from 'js-cookie';

const COOKIE_EXPIRY_DAYS = 365;

@Injectable()
export class AuthService {

  constructor(
  ) {

  }

  setAccessTokenId(token: string) {
    if (token) {
      Cookies.set('duocun-token-id', token, { expires: COOKIE_EXPIRY_DAYS });
    }
  }

  getAccessTokenId(): string {
    const tokenId = Cookies.get('duocun-token-id');
    return tokenId ? tokenId : null;
  }


  removeCookies() {
    Cookies.remove('duocun-token-id');
  }
}
