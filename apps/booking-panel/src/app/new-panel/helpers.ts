import { CalendarEvent } from '@placeos/events';
import {
    addMinutes,
    differenceInMinutes,
    format,
    formatDuration,
} from 'date-fns';

export function nextPeriod(next: CalendarEvent) {
    const next_diff = differenceInMinutes(next?.date, Date.now());
    return next && next_diff < 24 * 60
        ? `${format(next.date, 'h:mm a')} - ${format(
              addMinutes(next.date, next.duration),
              'h:mm a'
          )}`
        : '';
}

export function currentPeriod(current: CalendarEvent, next: CalendarEvent) {
    const next_diff = differenceInMinutes(next?.date, Date.now());
    if (!current)
        return next && next_diff < 24 * 60
            ? [false, Math.floor(next_diff / 60), next_diff % 60]
            : [];
    const checked_in = true;
    const current_diff = differenceInMinutes(
        current.event_end * 1000,
        Date.now()
    );
    return checked_in
        ? [true, Math.floor(current_diff / 60), current_diff % 60]
        : [];
}
