import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { CredentialsService } from '../authentication/credentials.service';

@Injectable({
  providedIn: 'root'
})
export class TokenInterceptor implements HttpInterceptor {
  credentials: CredentialsService;
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject(null);

  constructor(private inject: Injector) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.credentials = this.inject.get(CredentialsService);
    const newRequest = this.addToken(request, this.credentials.accessToken);

    return next.handle(newRequest);
  }

  private addToken(request: HttpRequest<any>, token: string) {
    return request.clone({
      setHeaders: {
        /** Set authorization header for all requests
         * Our authentication service needs BASIC authentication (hard-coded below) on header to return the JWT token
         * All other requests will use BEARER authentication
         */
        Authorization: request.url.includes('authservice/oauth/token')
          ? // ? `Basic ${btoa('xxx:xxx')}`
            `Basic dGVyYXZtOnRlcmF2bQ==`
          : `Bearer ${this.credentials.accessToken}`
      }
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.credentials.refreshTokens().pipe(
        switchMap((token: any) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(token.jwt);
          return next.handle(this.addToken(request, token.jwt));
        }),
        catchError((err: any) => {
          this.isRefreshing = false;
          this.credentials.setCredentials();
          return throwError(err);
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter((token) => token != null),
        take(1),
        switchMap((jwt) => next.handle(this.addToken(request, jwt))),
        catchError((err: any) => {
          this.credentials.setCredentials();
          return throwError(err);
        })
      );
    }
  }
}
