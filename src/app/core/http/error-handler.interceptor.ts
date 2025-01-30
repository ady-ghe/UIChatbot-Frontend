import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { SessionExpiredComponent } from '@app/shared/components/session-expired/session-expired.component';

import { environment } from '@env';
import { CookieService } from 'ngx-cookie-service';
import { Flavours } from '@app/configurations/flavours.enum';
import { UtilityService } from '@app/shared/services/utility.service';
import { apiURLs } from '@app/configurations/back-end-routes';
import { Logger } from '../logger.service';

const log = new Logger('ErrorHandlerInterceptor');

/**
 * Adds a default error handler to all requests.
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerInterceptor implements HttpInterceptor {
  constructor(
    private modalService: NgbModal,
    private router: Router,
    private cookie: CookieService,
    private toastr: ToastrService,
    private utilityService: UtilityService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(catchError((error) => this.errorHandler(error)));
  }

  // Customize the default error handler here if needed
  private errorHandler(response: HttpEvent<any>): Observable<HttpEvent<any>> {
    const currentFlavour = this.cookie.get('flavour');
    const isActiveDirectoryLogin = sessionStorage.getItem('activeDirectoryLogin') === 'true';
    const isRdaV2 = ([Flavours.RDA_V2.EXECUTIVE, Flavours.RDA_V2.CONTROLLER] as any).includes(currentFlavour);
    if (response instanceof HttpErrorResponse && response.status === 401 && this.router.url !== '/utilities/authentication') {
      // basically if error comes from login attempt => session is not expired yet
      const errorFromLoginAttempt = !!response.url.endsWith(apiURLs.getToken);
      if (!this.utilityService.manualLogout && !(isActiveDirectoryLogin && isRdaV2) && !errorFromLoginAttempt) {
        this.modalService.dismissAll();
        this.modalService
          .open(SessionExpiredComponent, {
            size: 'sm'
          })
          .result.then(() => {
            this.router.navigateByUrl('/login');
          });
      }
    } else {
      if (!environment.production) {
        log.error('Request error', response);
      }
      const errorBody = (response as any).error;
      if (errorBody && errorBody.errors && errorBody.errors.length && errorBody.errors[0].message) {
        this.toastr.error(errorBody.errors[0].message);
      }
    }
    this.utilityService.manualLogout = false;
    throw response;
  }
}
