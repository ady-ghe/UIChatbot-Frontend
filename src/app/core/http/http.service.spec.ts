import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpInterceptor } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';

import { ToastrModule, ToastrService } from 'ngx-toastr';
import { HttpService } from './http.service';
import { HttpCacheService } from './http-cache.service';
import { ErrorHandlerInterceptor } from './error-handler.interceptor';
import { CacheInterceptor } from './cache.interceptor';
import { ApiPrefixInterceptor } from './api-prefix.interceptor';
import { TokenInterceptor } from './token.interceptor';

describe('HttpService', () => {
  let httpCacheService: HttpCacheService;
  let http: HttpService;
  let httpMock: HttpTestingController;
  let interceptors: HttpInterceptor[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule, ToastrModule.forRoot()],
      providers: [
        CookieService,
        ToastrService,
        ErrorHandlerInterceptor,
        CacheInterceptor,
        ApiPrefixInterceptor,
        TokenInterceptor,
        HttpCacheService
      ]
    });

    http = TestBed.inject(HttpService);
    httpMock = TestBed.inject(HttpTestingController as Type<HttpTestingController>);
    httpCacheService = TestBed.inject(HttpCacheService);

    const realRequest = http.request;
    spyOn(HttpService.prototype, 'request').and.callFake(function (this: any, method: string, url: string, options?: any) {
      interceptors = this.interceptors;
      return realRequest.call(this, method, url, options);
    });
  });

  afterEach(() => {
    httpCacheService.cleanCache();
    httpMock.verify();
  });

  it('should use error handler, API prefix and no cache by default', () => {
    // Act
    const request = http.get('/toto');

    // Assert
    request.subscribe(() => {
      expect(http.request).toHaveBeenCalled();
      expect(interceptors.some((i) => i instanceof ApiPrefixInterceptor)).toBeTruthy();
      expect(interceptors.some((i) => i instanceof ErrorHandlerInterceptor)).toBeTruthy();
      expect(interceptors.some((i) => i instanceof TokenInterceptor)).toBeTruthy();
      expect(interceptors.some((i) => i instanceof CacheInterceptor)).toBeFalsy();
    });
    httpMock.expectOne({}).flush({});
  });

  it('should use cache', () => {
    // Act
    const request = http.cache().get('/toto');

    // Assert
    request.subscribe(() => {
      expect(interceptors.some((i) => i instanceof ApiPrefixInterceptor)).toBeTruthy();
      expect(interceptors.some((i) => i instanceof ErrorHandlerInterceptor)).toBeTruthy();
      expect(interceptors.some((i) => i instanceof TokenInterceptor)).toBeTruthy();
      expect(interceptors.some((i) => i instanceof CacheInterceptor)).toBeTruthy();
    });
    httpMock.expectOne({}).flush({});
  });

  it('should skip error handler', () => {
    // Act
    const request = http.skipErrorHandler().get('/toto');

    // Assert
    request.subscribe(() => {
      expect(interceptors.some((i) => i instanceof ApiPrefixInterceptor)).toBeTruthy();
      expect(interceptors.some((i) => i instanceof ErrorHandlerInterceptor)).toBeFalsy();
      expect(interceptors.some((i) => i instanceof TokenInterceptor)).toBeTruthy();
      expect(interceptors.some((i) => i instanceof CacheInterceptor)).toBeFalsy();
    });
    httpMock.expectOne({}).flush({});
  });

  it('should not use API prefix', () => {
    // Act
    const request = http.disableApiPrefix().get('/toto');

    // Assert
    request.subscribe(() => {
      expect(interceptors.some((i) => i instanceof ApiPrefixInterceptor)).toBeFalsy();
      expect(interceptors.some((i) => i instanceof ErrorHandlerInterceptor)).toBeTruthy();
      expect(interceptors.some((i) => i instanceof TokenInterceptor)).toBeTruthy();
      expect(interceptors.some((i) => i instanceof CacheInterceptor)).toBeFalsy();
    });
    httpMock.expectOne({}).flush({});
  });

  it('should not use token', () => {
    // Act
    const request = http.disableTokenAuth().get('/toto');

    // Assert
    request.subscribe(() => {
      expect(interceptors.some((i) => i instanceof ApiPrefixInterceptor)).toBeTruthy();
      expect(interceptors.some((i) => i instanceof ErrorHandlerInterceptor)).toBeTruthy();
      expect(interceptors.some((i) => i instanceof TokenInterceptor)).toBeFalsy();
      expect(interceptors.some((i) => i instanceof CacheInterceptor)).toBeFalsy();
    });
    httpMock.expectOne({}).flush({});
  });
});
