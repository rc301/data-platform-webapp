import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { apiInterceptor } from './core/interceptors/api.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { STAGE_RUNTIMES, rfcStageRuntime } from './features/journey-stages';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([apiInterceptor, errorInterceptor])),
    provideAnimationsAsync(),

    // Registro estático de plugins de etapas. Para o journey builder
    // customizável futuro, novos plugins entram aqui ou via
    // StageRegistry.register() em runtime.
    { provide: STAGE_RUNTIMES, useValue: rfcStageRuntime, multi: true },
  ],
};
