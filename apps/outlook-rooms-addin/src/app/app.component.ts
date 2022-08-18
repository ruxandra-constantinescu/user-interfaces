import { Component, OnInit } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { first } from 'rxjs/operators';
import {
    authority,
    invalidateToken,
    isMock,
    setToken,
    token,
} from '@placeos/ts-client';
import {
    BaseClass,
    current_user,
    currentUser,
    setAppName,
    setNotifyOutlet,
    SettingsService,
    setupCache,
    setupPlace,
    log,
    notifyInfo,
} from '@placeos/common';
import { OrganisationService } from '@placeos/organisation';
import { setInternalUserDomain } from 'libs/users/src/lib/user.utilities';
import { setDefaultCreator } from 'libs/events/src/lib/event.class';

import * as MOCKS from '@placeos/mocks';

declare let Office: any;
declare let OfficeRuntime: any;

@Component({
    selector: 'app-root',
    template: `
        <router-outlet></router-outlet>
        <global-loading></global-loading>
        <debug-console></debug-console>
    `,
    styles: [``],
})
export class AppComponent extends BaseClass implements OnInit {
    title = 'outlook-rooms-addin';

    constructor(
        private _settings: SettingsService,
        private _org: OrganisationService, // For init
        private _cache: SwUpdate,
        private _snackbar: MatSnackBar
    ) {
        super();
    }

    public async ngOnInit() {
        window.history.replaceState = (data: null, unused: null) => {};

        log('APP', 'MOCKS:', MOCKS);

        setNotifyOutlet(this._snackbar);
        await this._settings.initialised.pipe(first((_) => _)).toPromise();
        await this._initialiseAuth();
        const OFFICE = OfficeRuntime || Office;
        const get_token = OFFICE?.auth?.getAccessToken({
            allowSignInPrompt: true,
        });
        if (token()) return this._finishInitialise();
        if (get_token) {
            const office_token = await get_token.catch((e) => console.error(e));
            if (office_token) {
                console.log(`Loaded office token.`);
                await this._initialiseAuth(false);
                return this._finishInitialise();
            }
        }
        await this._authenticateWithOffice();
    }

    private async _initialiseAuth(local = true) {
        setAppName(this._settings.get('app.short_name'));
        const settings = this._settings.get('composer') || {};
        settings.local_login = local;
        settings.mock =
            !!this._settings.get('mock') ||
            location.origin.includes('demo.place.tech');
        await setupPlace(settings).catch((_) => console.error(_));
    }

    private async _finishInitialise() {
        setupCache(this._cache);
        if (!this._settings.get('composer.local_login')) {
            this.timeout('wait_for_user', () => this.onInitError(), 30 * 1000);
        }
        await current_user.pipe(first((_) => !!_)).toPromise();
        this.clearTimeout('wait_for_user');
        setDefaultCreator(currentUser());
        setInternalUserDomain(
            this._settings.get('app.general.internal_user_domain') ||
                `@${currentUser()?.email?.split('@')[1]}`
        );
    }

    private async _authenticateWithOffice() {
        await Office.onReady();
        console.info(`Authenticating with office...`);
        this.timeout('office_auth', () => {
            const path = `${location.origin}${location.pathname}#ms-auth=true`;
            console.info(`Opening dialog to authenticate with office...`);
            console.info(`Opening dialog with URL: ${path}`);
            Office.context.ui.displayDialogAsync(path,
                (result) => {
                    if (result.status === Office.AsyncResultStatus.Succeeded) {
                        console.info(`Authenticated with office from dialog...`);
                        const dialog = result.value;
                        dialog.messageChild('auth_please');
                        dialog.addEventHandler(
                            Office.EventType.DialogMessageReceived,
                            (token) => {
                                if (token) setToken(token);
                                this._finishInitialise();
                                dialog.close();
                            }
                        );
                    }
                }
            );
        })
        console.info(`Search: ${window.location.hash} | ${window.location.search}`);
        if (window.location.href.includes('ms-auth=true')) {
            console.info(`Authenticating with office from a dialog...`);
            this.clearTimeout('office_auth');
            await this._initialiseAuth(false);
            if (!token()) return;
            Office.context.ui.messageParent(token() || '');
        }
    }

    private onInitError() {
        if (isMock() || currentUser()?.is_logged_in) return;
        invalidateToken();
        location.reload();
    }
}
