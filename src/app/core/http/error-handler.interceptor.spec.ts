import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { environment } from '@env';

import { ErrorHandlerInterceptor } from './error-handler.interceptor';

describe('ErrorHandlerInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let toastr: ToastrService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule, BrowserAnimationsModule, ToastrModule.forRoot()],
      providers: [
        ToastrService,
        ErrorHandlerInterceptor,
        {
          provide: HTTP_INTERCEPTORS,
          useClass: ErrorHandlerInterceptor,
          multi: true
        }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController as Type<HttpTestingController>);
    toastr = TestBed.inject(ToastrService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should catch error and call error handler logging', () => {
    // Arrange
    // Note: here we spy on private method since target is customization here,
    // but you should replace it by actual behavior in your app
    const currentEnv = environment.production;
    environment.production = true;
    spyOn(ErrorHandlerInterceptor.prototype as any, 'errorHandler').and.callThrough();
    spyOn(toastr, 'error').and.callThrough();

    // Act
    http.get('/toto').subscribe(
      () => fail('should error'),
      () => {
        // Assert
        expect((ErrorHandlerInterceptor.prototype as any).errorHandler).toHaveBeenCalled();
      }
    );

    httpMock.expectOne({}).flush(
      {
        errors: []
      },
      {
        status: 404,
        statusText: 'error'
      }
    );
    expect(toastr.error).not.toHaveBeenCalled();
    environment.production = currentEnv;
  });

  it('should catch error and call error handler displaying the toast error', () => {
    // Arrange
    // Note: here we spy on private method since target is customization here,
    // but you should replace it by actual behavior in your app
    spyOn(ErrorHandlerInterceptor.prototype as any, 'errorHandler').and.callThrough();
    spyOn(toastr, 'error').and.callThrough();

    // Act
    http.get('/toto').subscribe(
      () => fail('should error'),
      () => {
        // Assert
        expect((ErrorHandlerInterceptor.prototype as any).errorHandler).toHaveBeenCalled();
      }
    );

    httpMock.expectOne({}).flush(
      {
        errors: [
          {
            message: 'error in service'
          }
        ]
      },
      {
        status: 404,
        statusText: 'error'
      }
    );
    expect(toastr.error).toHaveBeenCalledWith('error in service');
  });

  it('should catch error and show modal if not authorized', () => {
    // Arrange
    // Note: here we spy on private method since target is customization here,
    // but you should replace it by actual behavior in your app
    spyOn(ErrorHandlerInterceptor.prototype as any, 'errorHandler').and.callThrough();

    // Act
    http.get('/toto').subscribe(
      () => fail('should error'),
      () => {
        // Assert
        expect((ErrorHandlerInterceptor.prototype as any).errorHandler).toHaveBeenCalled();
      }
    );

    httpMock.expectOne({}).flush(null, {
      status: 401,
      statusText: 'error'
    });
  });
});
