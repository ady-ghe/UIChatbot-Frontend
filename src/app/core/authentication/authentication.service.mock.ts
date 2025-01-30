import { Observable, of } from 'rxjs';

import { LoginContext } from './authentication.service';
import { Credentials } from './credentials.service';

export class MockAuthenticationService {
  credentials: Credentials | null = {
    userid: 'test',
    access_token: '123',
    refresh_token: '123'
  };

  login(context: LoginContext): Observable<Credentials> {
    return of({
      userid: context.username,
      access_token: '123456',
      refresh_token: '123456'
    });
  }

  logout(): Observable<boolean> {
    this.credentials = null;
    return of(true);
  }
}
