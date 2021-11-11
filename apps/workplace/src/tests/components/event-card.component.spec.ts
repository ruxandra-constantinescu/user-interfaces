import { createRoutingFactory, SpectatorRouting } from '@ngneat/spectator/jest';
import { IconComponent } from '@placeos/components';
import { CalendarEvent } from '@placeos/events';
import { OrganisationService } from '@placeos/organisation';
import { set } from 'date-fns';
import { MockComponent } from 'ng-mocks';
import { EventCardComponent } from '../../app/components/event-card.component';

describe('EventCardComponent', () => {
    let spectator: SpectatorRouting<EventCardComponent>;
    const createComponent = createRoutingFactory({
        component: EventCardComponent,
        declarations: [MockComponent(IconComponent)],
        providers: [
            {
                provide: OrganisationService,
                useValue: { levelWithID: jest.fn() },
            },
        ],
    });

    beforeEach(() => (spectator = createComponent()));

    it('should create component', () => {
        expect(spectator.component).toBeTruthy();
    });

    it('should match snapshot', () => {
        expect(spectator.element).toMatchSnapshot();
        spectator.setInput({
            event: new CalendarEvent({
                date: set(Date.now(), { hours: 8, minutes: 0 }).valueOf(),
            }),
        });
        spectator.detectChanges();
        expect(spectator.element).toMatchSnapshot();
        spectator.setInput({ show_day: true });
        spectator.detectChanges();
        expect(spectator.element).toMatchSnapshot();
    });
});