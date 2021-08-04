import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { createRoutingFactory, SpectatorRouting } from '@ngneat/spectator/jest';
import { OrganisationService } from '@placeos/organisation';
import { MockComponent } from 'ng-mocks';
import { BehaviorSubject, of } from 'rxjs';

import { DesksStateService } from '../../app/desks/desks-state.service';
import { DesksTopbarComponent } from '../../app/desks/desks-topbar.component';
import { DateOptionsComponent } from '../../app/ui/date-options.component';
import { SearchbarComponent } from '../../app/ui/searchbar.component';

describe('DesksTopbarComponent', () => {
    let spectator: SpectatorRouting<DesksTopbarComponent>;
    const createComponent = createRoutingFactory({
        component: DesksTopbarComponent,
        declarations: [
            MockComponent(SearchbarComponent),
            MockComponent(DateOptionsComponent),
        ],
        providers: [
            {
                provide: DesksStateService,
                useValue: {
                    filters: new BehaviorSubject({}),
                    setFilters: jest.fn(),
                },
            },
            {
                provide: OrganisationService,
                useValue: {
                    active_levels: of([]),
                    initialised: of(true),
                    levelWithID: jest.fn(),
                    buildings: [],
                },
            },
        ],
        imports: [
            MatFormFieldModule,
            MatSelectModule,
            MatProgressBarModule,
            FormsModule,
        ],
    });

    beforeEach(() => (spectator = createComponent()));

    it('should create component', () => {
        expect(spectator.component).toBeTruthy();
    });

    it('should match snapshot', () => {
        expect(spectator.element).toMatchSnapshot();
    });

    it.todo('should handle zone_ids query param');

    it.todo('should handle approve query param');

    it.todo('should handle reject query param');
});
