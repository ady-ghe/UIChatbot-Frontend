import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { AuthenticationService } from '@app/core';

import { TokenInterceptor } from './token.interceptor';

describe('TokenInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule],
      providers: [
        CookieService,
        AuthenticationService,
        {
          provide: HTTP_INTERCEPTORS,
          useClass: TokenInterceptor,
          multi: true
        }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController as Type<HttpTestingController>);
    const cookie = TestBed.inject(CookieService);
    cookie.deleteAll();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should append the right  authorization header', () => {
    http.get('/authservice/oauth/token').subscribe();

    const reqBasic = httpMock.expectOne({ url: '/authservice/oauth/token' });
    expect(reqBasic.request.headers.has('Authorization')).toEqual(true);
    expect(reqBasic.request.headers.get('Authorization')).toBe('Basic dGVyYXZtOnRlcmF2bQ==');

    http.get('/toto').subscribe();

    const reqBearer = httpMock.expectOne({ url: '/toto' });
    expect(reqBearer.request.headers.has('Authorization')).toEqual(true);
    expect(reqBearer.request.headers.get('Authorization')).toBe('Bearer ');
  });
});
