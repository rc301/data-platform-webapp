import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { delay, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.mockApi) {
    const apiReq = req.clone({
      url: `${environment.apiBaseUrl}${req.url}`,
    });
    return next(apiReq);
  }
  return next(req);
};
