import { HttpClientTestingModule } from '@angular/common/http/testing';
import { inject, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DeploymentService } from '@app/shared/services';
import { CookieService } from 'ngx-cookie-service';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { AuthenticationGuard } from './authentication.guard';
import { CredentialsService } from './credentials.service';

class MockRouter {
  navigate() {}
}

describe('AuthenticationGuard', () => {
  let authGuard: AuthenticationGuard;
  let router: any;
  let state: any;
  let credentials: CredentialsService;
  let deployment: DeploymentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule, ToastrModule.forRoot()],
      providers: [CookieService, AuthenticationGuard, CredentialsService, ToastrService]
    });
    router = new MockRouter();
    credentials = TestBed.inject(CredentialsService);
    deployment = TestBed.inject(DeploymentService);
    authGuard = new AuthenticationGuard(router, credentials, deployment);
    state = {
      url: 'workspace'
    };
  });

  it('should create the guard', inject([AuthenticationGuard], (guard: AuthenticationGuard) => {
    expect(guard).toBeTruthy();
  }));

  it('should return true if credentials permit', () => {
    spyOn(credentials, 'isAuthenticated').and.returnValue(true);
    spyOn(deployment.updateFlavour, 'getValue').and.returnValue('testFlavour');
    expect(authGuard.canActivate(router, state)).toEqual(true);
    expect(credentials.isAuthenticated).toHaveBeenCalled();
    expect(deployment.updateFlavour.getValue).toHaveBeenCalled();
  });

  it('should navigate on login if not credentials', () => {
    spyOn(credentials, 'isAuthenticated').and.returnValue(false);
    spyOn(deployment.updateFlavour, 'getValue').and.returnValue('testFlavour');
    spyOn(router, 'navigate');

    expect(authGuard.canActivate(router, state)).toEqual(false);
    expect(credentials.isAuthenticated).toHaveBeenCalled();
    expect(deployment.updateFlavour.getValue).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { redirect: state.url }, replaceUrl: true });
  });

  it('should navigate on login if no flavour', () => {
    spyOn(credentials, 'isAuthenticated').and.returnValue(true);
    spyOn(deployment.updateFlavour, 'getValue').and.returnValue(null);
    spyOn(router, 'navigate');

    expect(authGuard.canActivate(router, state)).toEqual(false);
    expect(credentials.isAuthenticated).toHaveBeenCalled();
    expect(deployment.updateFlavour.getValue).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { redirect: state.url }, replaceUrl: true });
  });
});
