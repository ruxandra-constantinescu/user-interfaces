import { createRoutingFactory, Spectator } from '@ngneat/spectator/jest';
import { SettingsService } from '@placeos/common';
import { IconComponent } from '@placeos/components';
import { MockComponent, MockModule } from 'ng-mocks';
import { CateringItemDetailsComponent } from '../../lib/catering-order-modal/catering-item-details.component';
import { CateringItemListComponent } from '../../lib/catering-order-modal/catering-item-list.component';
import { CateringItemFiltersComponent } from '../../lib/catering-order-modal/catering-item-filters.component';
import { NewCateringOrderModalComponent } from '../../lib/catering-order-modal/new-catering-order-modal.component';
import { MatDialogModule } from '@angular/material/dialog';

describe('NewCateringOrderModalComponent', () => {
    let spectator: Spectator<NewCateringOrderModalComponent>;
    const createComponent = createRoutingFactory({
        component: NewCateringOrderModalComponent,
        providers: [
            {
                provide: SettingsService,
                useValue: { get: jest.fn(), saveUserSetting: jest.fn() },
            },
        ],
        declarations: [
            MockComponent(IconComponent),
            MockComponent(CateringItemDetailsComponent),
            MockComponent(CateringItemFiltersComponent),
            MockComponent(CateringItemListComponent),
        ],
        imports: [MatDialogModule]
    });

    beforeEach(() => (spectator = createComponent()));

    it('should create component', () =>
        expect(spectator.component).toBeTruthy());

    it('should show catering item list', () => {
        expect('catering-item-list').toExist();
    });
    
    it('should show catering item filters', () => {
        expect('catering-item-filters').toExist();
    });

    it('should show catering item details', () => {
        expect('catering-item-details').toExist();
    });

    it('should allow setting selected catering items', () => {
        spectator.component.setSelected({ id: '1' } as any, true);
        expect(spectator.component.selected).toHaveLength(1);
        spectator.component.setSelected({ id: '1' } as any, false);
        expect(spectator.component.selected).toHaveLength(0);
    });

    it('should allow toggling favourites', () => {
        const settings = spectator.inject(SettingsService);
        settings.get.mockImplementation(() => []);
        spectator.component.toggleFavourite({ id: '1' } as any);
        expect(settings.saveUserSetting).toBeCalledWith(
            'favourite_menu_items',
            ['1']
        );
        settings.get.mockImplementation(() => ['1']);
        spectator.component.toggleFavourite({ id: '1' } as any);
        expect(settings.saveUserSetting).toBeCalledWith(
            'favourite_menu_items',
            []
        );
    });
});