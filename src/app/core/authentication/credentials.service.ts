import { HttpClient } from '@angular/common/http'; // to avoid circular dependency
import { Injectable } from '@angular/core';
import { apiURLs } from '@app/configurations/back-end-routes';
import { JwtHelperService } from '@auth0/angular-jwt';
import { CookieService } from 'ngx-cookie-service';
import { map } from 'rxjs/operators';

export interface Credentials {
  // Customize received credentials here
  userid: string;
  access_token: string;
  refresh_token: string;
}

const credentialsKey = 'credentials';

/**
 * Provides storage for authentication credentials.
 * The Credentials interface should be replaced with proper implementation.
 */
@Injectable({
  providedIn: 'root'
})
export class CredentialsService {
  jwtHelper: JwtHelperService;
  private _credentials: Credentials | null = null;

  constructor(private http: HttpClient, private cookie: CookieService) {
    this.jwtHelper = new JwtHelperService();
    const savedCredentials = sessionStorage.getItem(credentialsKey) || localStorage.getItem(credentialsKey);
    if (savedCredentials) {
      this._credentials = JSON.parse(savedCredentials);
    }
  }

  /**
   * Checks is the user is authenticated.
   *
   * @return True if the user is authenticated.
   */
  isAuthenticated(): boolean {
    return !!this.credentials;
  }

  /**
   * Gets the user credentials.
   *
   * @return The user credentials or null if the user is not authenticated.
   */
  get credentials(): Credentials | null {
    return this._credentials;
  }

  /**
   * Gets access token
   *
   * @return The access token
   */
  get accessToken(): Credentials['access_token'] | null {
    return (this._credentials && this._credentials.access_token) || this.cookie.get('access_token');
  }

  /**
   * Gets refresh token
   *
   * @return The refresh token
   */
  get refreshToken(): Credentials['refresh_token'] | null {
    return (this._credentials && this._credentials.refresh_token) || this.cookie.get('refresh_token');
  }

  /**
   * Retrieves new tokens
   *
   * @return The new access token
   */
  refreshTokens() {
    const body = new FormData();
    body.append('grant_type', 'refresh_token');
    body.append('refresh_token', this.refreshToken);

    return this.http.post<Credentials>(apiURLs.getToken, body).pipe(
      map((data) => {
        // login successful if there's a jwt token in the response
        if (data && data.access_token && data.refresh_token) {
          // update credentials
          const newCredentials = { ...this._credentials };
          newCredentials.access_token = data.access_token;
          newCredentials.refresh_token = data.refresh_token;
          this.setCredentials(newCredentials);
        }
        return data.access_token;
      })
    );
  }

  /**
   * Sets the user credentials.
   * The credentials may be persisted across sessions by setting the `remember` parameter to true.
   * Otherwise, the credentials are only persisted for the current session.
   *
   * @param credentials The user credentials.
   * @param remember True to remember credentials across sessions.
   */
  setCredentials(credentials?: Credentials, remember?: boolean) {
    Object.keys(this._credentials || {}).forEach((key) => {
      if (key !== 'currentSelectedTest') {
        this.cookie.delete(key, '/', null, null, 'Strict');
      }
    });
    this._credentials = credentials
      ? {
          userid: this.jwtHelper.decodeToken(credentials.access_token).user_name,
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token
        }
      : null;

    if (this._credentials) {
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem(credentialsKey, JSON.stringify(this._credentials));
      Object.keys(this._credentials).forEach((key) => {
        this.cookie.set(key, this._credentials[key], 3, '/', null, null, 'Strict');
      });
    } else {
      sessionStorage.removeItem(credentialsKey);
      localStorage.removeItem(credentialsKey);
    }
  }
}
