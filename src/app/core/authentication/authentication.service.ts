import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { apiURLs } from '@app/configurations/back-end-routes';
import { HttpService } from '@app/core/http/http.service';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { CookieService } from 'ngx-cookie-service';
import { Flavours } from '@app/configurations/flavours.enum';
import { Credentials, CredentialsService } from './credentials.service';

export interface LoginContext {
  username: string;
  password: string;
  remember?: boolean;
}

/**
 * Provides a base for authentication workflow.
 * The login/logout methods should be replaced with proper implementation.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  constructor(private http: HttpService, private credentialsService: CredentialsService, private cookie: CookieService) {}

  /**
   * Authenticates the user.
   *
   * @param context The login parameters.
   * @return The user credentials.
   */
  login(context: LoginContext): Observable<Credentials> {
    const body = new HttpParams().set('grant_type', 'password').set('username', context.username).set('password', context.password);

    return this.http.post<Credentials>(apiURLs.getToken, body).pipe(
      tap((response: Credentials) => {
        this.credentialsService.setCredentials(response, context.remember);
      })
    );
  }

  /**
   * Logs out the user and clear credentials.
   *
   * @return True if the user was logged out successfully.
   */
  logout(): Observable<boolean> {
    return this._revokeToken().pipe(finalize(() => this.credentialsService.setCredentials()));
  }

  legacyLogin(context: LoginContext): Observable<any> {
    const body = new HttpParams().set('username', context.username).set('password', context.password);
    const currentFlavour = this.cookie.get('flavour');
    if (([Flavours.RDA_V2.CONTROLLER, Flavours.RDA_V2.EXECUTIVE] as any).includes(currentFlavour)) {
      return this.http.skipErrorHandler().post(apiURLs.legacy.login, body, {
        responseType: 'text'
      });
    }

    return this.http.post(apiURLs.legacy.login, body, {
      responseType: 'text'
    });
  }

  private _revokeToken(): Observable<any> {
    return this.http.post(apiURLs.revokeToken, {}, { responseType: 'text' });
  }
}
