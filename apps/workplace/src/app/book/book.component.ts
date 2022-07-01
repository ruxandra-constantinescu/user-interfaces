import { Component } from '@angular/core';

@Component({
    selector: 'placeos-book',
    template: `
        <topbar></topbar>
        <div class="flex-1 flex sm:flex-row flex-col-reverse h-1/2">
            <main
                class="flex flex-col flex-1 h-1/2 sm:h-auto overflow-hidden"
            >
                <router-outlet></router-outlet>
            </main>
        </div>
        <footer-menu class="z-10"></footer-menu>
    `,
    styles: [
        `
            :host {
                display: flex;
                flex-direction: column;
                height: 100%;
                width: 100%;
            }
        `,
    ],
})
export class BookComponent {}
