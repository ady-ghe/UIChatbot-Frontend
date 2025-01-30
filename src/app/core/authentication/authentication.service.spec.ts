import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { apiURLs } from '@app/configurations/back-end-routes';
import { environment } from '@env';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { AuthenticationService, LoginContext } from './authentication.service';
import { CredentialsService } from './credentials.service';
import { MockCredentialsService } from './credentials.service.mock';

const getCredentials = () => ({
  username: 'toto',
  password: atob(btoa('123'))
});

describe('AuthenticationService', () => {
  let authenticationService: AuthenticationService;
  let credentialsService: MockCredentialsService;
  const credentials: LoginContext = getCredentials();
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule, ToastrModule.forRoot()],
      providers: [
        ToastrService,
        {
          provide: CredentialsService,
          useClass: MockCredentialsService
        },
        AuthenticationService
      ]
    });

    authenticationService = TestBed.inject(AuthenticationService);
    credentialsService = TestBed.inject(CredentialsService);
    credentialsService.credentials = null;
    httpMock = TestBed.inject(HttpTestingController);
    spyOn(credentialsService, 'setCredentials').and.callThrough();
  });

  describe('login', () => {
    it('should return credentials', fakeAsync(() => {
      // Act
      const request = authenticationService.login(credentials);
      tick();

      // Assert
      request.subscribe((result) => {
        expect(result).toBeDefined();
        expect(result.access_token).toBeDefined();
        expect(result.refresh_token).toBeDefined();
      });
      expect().nothing();
    }));

    it('should authenticate user', fakeAsync(() => {
      expect(credentialsService.isAuthenticated()).toBe(false);

      // Act
      const request = authenticationService.login(credentials);
      tick();

      // Assert
      request.subscribe(() => {
        expect(credentialsService.isAuthenticated()).toBe(true);
        expect(credentialsService.credentials).not.toBeNull();
        expect(credentialsService.credentials.access_token).toBeDefined();
        expect(credentialsService.credentials.access_token).not.toBeNull();
        expect(credentialsService.credentials.refresh_token).toBeDefined();
        expect(credentialsService.credentials.refresh_token).not.toBeNull();
      });
    }));

    it('should persist credentials for the session', fakeAsync(() => {
      // Act
      const request = authenticationService.login(credentials);
      tick();

      // Assert
      request.subscribe(() => {
        expect(credentialsService.setCredentials).toHaveBeenCalled();
        expect((credentialsService.setCredentials as jasmine.Spy).calls.mostRecent().args[1]).toBe(undefined);
      });
      expect().nothing();
    }));

    it('should persist credentials across sessions', fakeAsync(() => {
      // Act
      const request = authenticationService.login({
        ...credentials,
        remember: true
      });
      tick();

      // Assert
      request.subscribe(() => {
        expect(credentialsService.setCredentials).toHaveBeenCalledWith(jasmine.objectContaining(credentials), true);
        expect((credentialsService.setCredentials as jasmine.Spy).calls.mostRecent().args[1]).toBe(true);
      });
      expect().nothing();
    }));

    it('should get revokeToken', () => {
      const fakeData = {
        data1: 'data1'
      };

      authenticationService.logout().subscribe((data: any) => {
        expect(data).toEqual(JSON.stringify(fakeData));
      });
      const req = httpMock.expectOne({
        method: 'POST',
        url: environment.serverUrl + apiURLs.revokeToken
      });
      req.flush(fakeData);
    });

    it('should post credentials', () => {
      const fakeCredentials = {
        username: 'data1',
        password: 'data2'
      };

      authenticationService.legacyLogin(credentials).subscribe((data: any) => {
        expect(data).toEqual(JSON.stringify(fakeCredentials));
      });
      const req = httpMock.expectOne({
        method: 'POST',
        url: environment.serverUrl + apiURLs.legacy.login
      });
      req.flush(fakeCredentials);
    });
  });

  describe('logout', () => {
    it('should clear user authentication', fakeAsync(() => {
      // Arrange
      const loginRequest = authenticationService.login(credentials);
      tick();

      // Assert
      loginRequest.subscribe(() => {
        expect(credentialsService.isAuthenticated()).toBe(true);

        const request = authenticationService.logout();
        tick();

        request.subscribe(() => {
          expect(credentialsService.isAuthenticated()).toBe(false);
          expect(credentialsService.credentials).toBeNull();
        });
      });
      expect().nothing();
    }));
  });
});
