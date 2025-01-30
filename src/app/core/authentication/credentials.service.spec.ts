import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CookieService } from 'ngx-cookie-service';

import { CredentialsService } from './credentials.service';

const credentialsKey = 'credentials';

describe('CredentialsService', () => {
  const credentials = {
    userid: 'me',
    access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJtZSJ9.bymZWovEKh69nNl9HY5u-VE5eKqHXOOEP5DrBuaDXd0',
    refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJtZSJ9.bymZWovEKh69nNl9HY5u-VE5eKqHXOOEP5DrBuaDXd0'
  };

  let credentialsService: CredentialsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CookieService, CredentialsService]
    });

    credentialsService = TestBed.inject(CredentialsService);
  });

  afterEach(() => {
    // Cleanup
    localStorage.removeItem(credentialsKey);
    sessionStorage.removeItem(credentialsKey);
  });

  describe('setCredentials', () => {
    it('should authenticate user if credentials are set', () => {
      // Act
      credentialsService.setCredentials(credentials);

      // Assert
      expect(credentialsService.isAuthenticated()).toBe(true);
      expect(credentialsService.credentials.userid).toBe('me');
    });

    it('should clean authentication', () => {
      // Act
      credentialsService.setCredentials();

      // Assert
      expect(credentialsService.isAuthenticated()).toBe(false);
    });

    it('should persist credentials for the session', () => {
      // Act
      credentialsService.setCredentials(credentials);

      // Assert
      expect(sessionStorage.getItem(credentialsKey)).not.toBeNull();
      expect(localStorage.getItem(credentialsKey)).toBeNull();
    });

    it('should persist credentials across sessions', () => {
      // Act
      credentialsService.setCredentials(credentials, true);

      // Assert
      expect(localStorage.getItem(credentialsKey)).not.toBeNull();
      expect(sessionStorage.getItem(credentialsKey)).toBeNull();
    });

    it('should clear user authentication', () => {
      // Act
      credentialsService.setCredentials();

      // Assert
      expect(credentialsService.isAuthenticated()).toBe(false);
      expect(credentialsService.credentials).toBeNull();
      expect(sessionStorage.getItem(credentialsKey)).toBeNull();
      expect(localStorage.getItem(credentialsKey)).toBeNull();
    });

    it('should return refresh token', () => {
      // Act
      credentialsService.setCredentials(credentials);

      // Assert
      expect(credentialsService.refreshToken).toEqual(credentials.refresh_token);

      credentialsService.setCredentials();
      expect(credentialsService.refreshToken).toBeFalsy();
    });

    it('should get the access token', () => {
      // Act
      credentialsService.setCredentials(credentials);
      expect(credentialsService.accessToken).toEqual(credentials.access_token);
    });

    it('should get the access token after refreshing it (expired)', () => {
      // Act
      // eslint-disable-next-line max-len
      credentials.access_token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJtZSIsImV4cCI6MX0.syda8nMaa2Na_czulHIi0EpRc10dpUHdBO07LvkZ9Wo';

      credentialsService.setCredentials(credentials);
      expect(credentialsService.accessToken).toEqual(credentials.access_token);
    });
  });
});
