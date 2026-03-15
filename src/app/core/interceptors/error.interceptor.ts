import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notification = inject(NotificationService);

  return next(req).pipe(
    catchError((error) => {
      const message = error.error?.message || error.message || 'An unexpected error occurred';

      if (error.status === 0) {
        notification.error('Network error. Please check your connection.');
      } else if (error.status === 401) {
        notification.error('Session expired. Please log in again.');
      } else if (error.status === 403) {
        notification.error('You do not have permission to perform this action.');
      } else if (error.status >= 500) {
        notification.error('Server error. Please try again later.');
      } else {
        notification.error(message);
      }

      return throwError(() => error);
    })
  );
};
