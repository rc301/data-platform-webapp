import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'relativeTime', standalone: true })
export class RelativeTimePipe implements PipeTransform {
  transform(value: string | Date): string {
    if (!value) return '';
    const date = new Date(value);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'agora mesmo';
    if (diffMin < 60) return `há ${diffMin}m`;
    if (diffHour < 24) return `há ${diffHour}h`;
    if (diffDay < 7) return `há ${diffDay}d`;
    return date.toLocaleDateString('pt-BR');
  }
}
