import { Component } from '@angular/core';
import { combineLatest, interval } from 'rxjs';
import { map, shareReplay, take } from 'rxjs/operators';
import { PanelStateService } from '../panel-state.service';
import { currentPeriod, nextPeriod } from './helpers';

@Component({
    selector: 'panel-view-status',
    template: `
        <div class="flex items-center justify-center h-full w-full">
            <div
                class="flex-1 h-full text-white flex flex-col items-center justify-center relative"
                [class.bg-error]="(state | async) === 'busy'"
                [class.bg-success]="(state | async) === 'free'"
                [class.bg-pending]="(state | async) === 'pending'"
            >
                <div
                    [innerHTML]="
                        ((state | async) === 'busy'
                            ? in_use_svg
                            : (state | async) === 'pending'
                            ? pending_svg
                            : free_svg
                        ) | safe
                    "
                ></div>
                <h3 class="text-4xl uppercase font-medium mt-4">
                    {{ 'PANEL.NOW' | translate }}
                </h3>
                <p class="text-2xl font-light mt-4">
                    <ng-container
                        *ngIf="
                            (event_state | async)?.current?.length;
                            else no_current_state
                        "
                    >
                        <ng-container
                            *ngIf="
                                (event_state | async)?.current[0];
                                else free_for_state
                            "
                        >
                            <ng-container
                                *ngIf="(event_state | async)?.current[1] > 0"
                            >
                                {{
                                    'PANEL.FREE_IN_HOURS_AND_MINUTES'
                                        | translate
                                            : {
                                                  hour: (event_state | async)
                                                      ?.current[1],
                                                  minute: (event_state | async)
                                                      ?.current[2]
                                              }
                                }}
                            </ng-container>
                            <ng-container
                                *ngIf="(event_state | async)?.current[1] <= 0"
                            >
                                {{
                                    'PANEL.FREE_IN_MINUTES'
                                        | translate
                                            : {
                                                  minute: (event_state | async)
                                                      ?.current[2]
                                              }
                                }}
                            </ng-container>
                            <ng-container
                                *ngIf="
                                    (event_state | async)?.current[1] <= 0 &&
                                    (event_state | async)?.current[2] <= 1
                                "
                            >
                                {{
                                    'PANEL.FREE_IN_LESS_THAN_MINUTE' | translate
                                }}
                            </ng-container>
                        </ng-container>
                        <ng-template #free_for_state>
                            <ng-container
                                *ngIf="(event_state | async)?.current[1]"
                            >
                                {{
                                    'PANEL.FREE_FOR_HOURS_AND_MINUTES'
                                        | translate
                                            : {
                                                  hour: (event_state | async)
                                                      ?.current[1],
                                                  minute: (event_state | async)
                                                      ?.current[2]
                                              }
                                }}
                            </ng-container>
                            <ng-container
                                *ngIf="
                                    !(event_state | async)?.current[1] &&
                                    (event_state | async)?.current[2] >= 1
                                "
                            >
                                {{
                                    'PANEL.FREE_FOR_MINUTES'
                                        | translate
                                            : {
                                                  minute: (event_state | async)
                                                      ?.current[2]
                                              }
                                }}
                            </ng-container>
                            <ng-container
                                *ngIf="
                                    !(event_state | async)?.current[1] &&
                                    (event_state | async)?.current[2] < 1
                                "
                            >
                                {{
                                    'PANEL.FREE_FOR_LESS_THAN_MINUTE'
                                        | translate
                                }}
                            </ng-container>
                        </ng-template>
                    </ng-container>
                    <ng-template #no_current_state>
                        {{ 'PANEL.NO_CURRENT' | translate }}
                    </ng-template>
                </p>
                <div
                    class="absolute top-0 inset-x-0 flex items-center justify-center text-2xl bg-black/40 p-4 space-x-4"
                    *ngIf="(state | async) === 'pending'"
                >
                    <p class="uppercase">
                        {{ 'PANEL.CHECKIN_INPUT' | translate }}
                    </p>
                    <app-icon>arrow_forward</app-icon>
                </div>
                <div
                    class="absolute top-0 inset-x-0 flex items-center justify-center text-2xl bg-black/40 p-4 space-x-4"
                    *ngIf="(state | async) === 'free' && can_book"
                >
                    <p class="uppercase">
                        {{ 'PANEL.BOOKING_INPUT' | translate }}
                    </p>
                    <app-icon>arrow_forward</app-icon>
                </div>
            </div>
            <div
                class="flex-1 h-full bg-white text-black flex flex-col items-center justify-center space-y-4"
            >
                <div
                    [innerHTML]="
                        (!(event_state | async)?.next ? free_svg : in_use_svg)
                            | safe
                    "
                ></div>
                <h3 class="text-4xl uppercase font-medium">
                    {{ 'PANEL.NEXT' | translate }}
                </h3>
                <p class="text-2xl font-light">
                    {{
                        (event_state | async)?.next ||
                            ('PANEL.NO_UPCOMING' | translate)
                    }}
                </p>
            </div>
        </div>
    `,
    styles: [
        `
            :host > div > div {
                background-color: #424242;
            }
        `,
    ],
})
export class PanelViewStatusComponent {
    public readonly state = this._state.status;
    public readonly current = this._state.current;
    public readonly next = this._state.next;
    public readonly bookings = this._state.bookings;

    public get can_book() {
        return this._state.setting('disable_book_now') !== true;
    }

    public readonly event_state = combineLatest([
        this.current,
        this.next,
        this.bookings,
        interval(5000),
    ]).pipe(
        map(([c, n, l]) => ({
            current: currentPeriod(l, c, n),
            next: nextPeriod(n),
        })),
        shareReplay(1)
    );

    public readonly free_svg = `
    <svg width="129" height="117" viewBox="0 0 129 117" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0)">
    <path d="M32.9422 90.8456H10.1503L6.37414 54.8238C6.34123 54.4031 6.22286 53.9934 6.02626 53.62C5.82966 53.2465 5.55897 52.9171 5.23075 52.6519C4.90253 52.3867 4.52368 52.1913 4.11737 52.0776C3.71106 51.9639 3.28583 51.9343 2.8677 51.9907C2.44708 52.0236 2.03759 52.142 1.66428 52.3387C1.29098 52.5353 0.961708 52.8061 0.696607 53.1345C0.431506 53.4628 0.236151 53.8418 0.12249 54.2483C0.00882954 54.6547 -0.0207468 55.0801 0.0355704 55.4984L4.21633 94.3534C4.312 95.1416 4.69529 95.8668 5.29265 96.3896C5.89001 96.9125 6.65936 97.1963 7.45305 97.1865H17.4329V109.059L10.0155 111.892C9.68401 112.004 9.37812 112.181 9.1155 112.412C8.85287 112.644 8.63873 112.925 8.48549 113.239C8.33225 113.554 8.24295 113.896 8.22276 114.246C8.20257 114.595 8.2519 114.945 8.36788 115.275C8.48387 115.605 8.6642 115.909 8.89844 116.169C9.13268 116.429 9.41617 116.64 9.73249 116.79C10.0488 116.94 10.3916 117.025 10.7412 117.041C11.0907 117.057 11.4399 117.004 11.7687 116.884L19.8605 113.916L27.9523 116.884H28.8963C29.4326 116.879 29.9541 116.707 30.3889 116.393C30.8236 116.079 31.1503 115.638 31.3238 115.13C31.5533 114.468 31.512 113.742 31.2089 113.11C30.9058 112.478 30.3654 111.992 29.7055 111.757L22.4229 109.194V97.3214H32.9422C33.7971 97.3099 34.6137 96.9651 35.2182 96.3603C35.8227 95.7556 36.1674 94.9387 36.1789 94.0835C36.1845 93.6568 36.1047 93.2332 35.944 92.8378C35.7833 92.4424 35.5451 92.0833 35.2434 91.7815C34.9417 91.4797 34.5827 91.2414 34.1875 91.0806C33.7922 90.9199 33.3688 90.84 32.9422 90.8456Z" fill="currentColor"/>
    <path d="M125.189 51.9907C124.348 51.9019 123.507 52.1503 122.85 52.6816C122.192 53.2128 121.772 53.9833 121.682 54.8239L117.906 90.7107H94.9794C94.121 90.7107 93.2977 91.0519 92.6907 91.6591C92.0837 92.2663 91.7427 93.0899 91.7427 93.9487C91.7427 94.8074 92.0837 95.631 92.6907 96.2382C93.2977 96.8454 94.121 97.1866 94.9794 97.1866H105.499V109.059L98.2161 111.622C97.5749 111.882 97.0536 112.371 96.7542 112.995C96.4549 113.619 96.3991 114.332 96.5978 114.995C96.7713 115.503 97.098 115.944 97.5327 116.258C97.9675 116.572 98.489 116.744 99.0253 116.749C99.302 116.77 99.5797 116.724 99.8345 116.614L107.926 113.646L116.018 116.614C116.347 116.734 116.696 116.787 117.046 116.771C117.395 116.755 117.738 116.67 118.054 116.52C118.371 116.37 118.654 116.16 118.888 115.9C119.123 115.64 119.303 115.336 119.419 115.005C119.535 114.675 119.584 114.325 119.564 113.976C119.544 113.626 119.455 113.284 119.301 112.97C119.148 112.655 118.934 112.374 118.671 112.143C118.409 111.911 118.103 111.734 117.771 111.622L110.489 109.059V97.1866H120.603C121.397 97.1963 122.166 96.9126 122.764 96.3897C123.361 95.8668 123.744 95.1416 123.84 94.3534L128.021 55.4984C128.11 54.6577 127.861 53.8161 127.33 53.1584C126.799 52.5007 126.029 52.0807 125.189 51.9907Z" fill="currentColor"/>
    <path d="M95.5186 74.1164V69.7992C95.5241 69.7091 95.5104 69.619 95.4785 69.5346C95.4465 69.4503 95.3971 69.3737 95.3333 69.3099C95.2696 69.2462 95.193 69.1967 95.1087 69.1647C95.0244 69.1328 94.9342 69.1191 94.8443 69.1246H33.0769C32.9869 69.1191 32.8968 69.1328 32.8124 69.1647C32.7281 69.1967 32.6516 69.2462 32.5878 69.3099C32.5241 69.3737 32.4746 69.4503 32.4426 69.5346C32.4107 69.619 32.397 69.7091 32.4026 69.7992V74.1164C32.397 74.2064 32.4107 74.2966 32.4426 74.3809C32.4746 74.4653 32.5241 74.5419 32.5878 74.6056C32.6516 74.6694 32.7281 74.7189 32.8124 74.7509C32.8968 74.7828 32.9869 74.7965 33.0769 74.791H55.1945V115.67C55.1889 115.76 55.2026 115.85 55.2345 115.934C55.2665 116.018 55.3159 116.095 55.3797 116.159C55.4435 116.223 55.52 116.272 55.6043 116.304C55.6886 116.336 55.7788 116.35 55.8688 116.344H72.0524C72.1423 116.35 72.2325 116.336 72.3168 116.304C72.4011 116.272 72.4777 116.223 72.5414 116.159C72.6052 116.095 72.6547 116.018 72.6866 115.934C72.7185 115.85 72.7322 115.76 72.7267 115.67V74.9259H94.8443C95.0399 74.9054 95.2198 74.8093 95.3458 74.6581C95.4717 74.507 95.5337 74.3126 95.5186 74.1164Z" fill="currentColor"/>
    </g>
    <defs>
    <clipPath id="clip0">
    <rect width="128.03" height="116.141" fill="currentColor" transform="translate(0.000488281 0.858643)"/>
    </clipPath>
    </defs>
    </svg>
    `;

    public readonly in_use_svg = `
    <svg width="129" height="117" viewBox="0 0 129 117" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0)">
    <path d="M29.7316 77.5781C29.1922 71.6419 28.6527 64.7613 28.2481 60.8489C28.6527 61.2536 29.1922 61.6583 29.5968 62.0631C32.9684 65.0312 38.9023 65.5708 42.9482 65.5708C44.8363 65.5708 46.3198 65.4359 46.9941 65.4359C48.0088 65.3405 48.9445 64.8473 49.597 64.0641C50.2494 63.2809 50.5656 62.2713 50.4766 61.2557C50.3875 60.2401 49.9004 59.301 49.1216 58.6434C48.3428 57.9858 47.3356 57.6631 46.3198 57.7459C42.6785 58.1506 36.6097 57.7459 34.8564 56.2618C30.5021 52.1921 24.7668 49.926 18.8077 49.9209C12.4691 49.9209 11.2554 52.7541 11.2554 56.1269C11.2554 60.7139 12.7389 80.5462 13.6829 84.8634C14.627 88.641 24.0674 87.9664 28.6527 87.8315C32.711 87.6529 36.7769 87.8789 40.7904 88.506C40.9217 96.0702 40.6516 103.636 39.9812 111.171C39.8928 112.491 40.3224 113.793 41.1786 114.801C42.0349 115.809 43.2504 116.443 44.5666 116.568H44.9712C46.2268 116.57 47.4371 116.099 48.3616 115.249C49.2862 114.399 49.8572 113.233 49.9611 111.981C51.1749 95.9263 51.1749 86.2125 49.8263 83.2444C47.8033 79.0621 42.5437 77.8479 29.7316 77.5781Z" fill="currentColor" fill-opacity="0.61"/>
    <path d="M18.6731 47.8973C24.1104 47.8973 28.5182 43.4879 28.5182 38.0486C28.5182 32.6093 24.1104 28.2 18.6731 28.2C13.2359 28.2 8.82812 32.6093 8.82812 38.0486C8.82812 43.4879 13.2359 47.8973 18.6731 47.8973Z" fill="currentColor" fill-opacity="0.61"/>
    <path d="M33.9124 90.5297H11.1205L7.34436 54.5079C7.31145 54.0871 7.19307 53.6775 6.99647 53.3041C6.79987 52.9306 6.52919 52.6012 6.20097 52.336C5.87275 52.0708 5.49389 51.8754 5.08758 51.7617C4.68127 51.648 4.25605 51.6184 3.83791 51.6747C3.41729 51.7077 3.0078 51.8261 2.6345 52.0228C2.2612 52.2194 1.93192 52.4902 1.66682 52.8186C1.40172 53.1469 1.20637 53.5259 1.0927 53.9323C0.979044 54.3388 0.949468 54.7642 1.00579 55.1825L5.18655 94.0374C5.28222 94.8257 5.66551 95.5508 6.26287 96.0737C6.86023 96.5966 7.62957 96.8804 8.42327 96.8706H18.4031V108.743L10.9857 111.576C10.6542 111.688 10.3483 111.865 10.0857 112.096C9.82309 112.328 9.60895 112.609 9.45571 112.924C9.30246 113.238 9.21316 113.58 9.19297 113.93C9.17278 114.279 9.22211 114.629 9.3381 114.959C9.45408 115.289 9.63442 115.593 9.86866 115.853C10.1029 116.113 10.3864 116.324 10.7027 116.474C11.019 116.624 11.3619 116.709 11.7114 116.725C12.0609 116.741 12.4102 116.688 12.7389 116.568L20.8307 113.6L28.9225 116.568H29.8665C30.4028 116.563 30.9243 116.391 31.3591 116.077C31.7938 115.763 32.1205 115.322 32.2941 114.814C32.5235 114.152 32.4822 113.426 32.1791 112.794C31.876 112.163 31.3356 111.676 30.6757 111.441L23.3931 108.878V97.0055H33.9124C34.7673 96.994 35.5839 96.6492 36.1884 96.0444C36.7929 95.4397 37.1376 94.6228 37.1491 93.7676C37.1548 93.3408 37.0749 92.9173 36.9142 92.5219C36.7535 92.1265 36.5153 91.7673 36.2136 91.4655C35.912 91.1637 35.5529 90.9254 35.1577 90.7647C34.7624 90.604 34.339 90.5241 33.9124 90.5297Z" fill="currentColor" fill-opacity="0.61"/>
    <path d="M89.206 88.5061C93.2205 87.8881 97.2855 87.6622 101.344 87.8315C105.929 87.9664 115.37 88.641 116.314 84.8634C117.392 80.5462 118.741 60.714 118.741 56.1269C118.741 52.7541 117.662 49.9209 111.189 49.9209C105.213 49.8372 99.4458 52.1159 95.14 56.2618C93.3868 57.7459 87.4528 58.0157 83.6766 57.7459C83.1702 57.6982 82.6592 57.7513 82.1733 57.9019C81.6874 58.0526 81.236 58.2978 80.8452 58.6237C80.4544 58.9495 80.1319 59.3494 79.8961 59.8004C79.6604 60.2514 79.5162 60.7445 79.4717 61.2515C79.4273 61.7585 79.4835 62.2692 79.6371 62.7544C79.7907 63.2396 80.0388 63.6895 80.3669 64.0784C80.695 64.4673 81.0968 64.7875 81.5491 65.0205C82.0014 65.2534 82.4953 65.3946 83.0023 65.4359C83.6766 65.4359 85.1601 65.5709 87.0482 65.5709C91.0941 65.5709 97.0281 65.0312 100.4 62.0631C100.879 61.6925 101.33 61.2867 101.748 60.8489C101.344 64.7614 100.804 71.507 100.265 77.5781C87.4528 77.8479 82.1932 79.0622 80.3051 83.2445C78.9564 86.2126 78.8216 95.9263 80.1702 111.981C80.2956 113.224 80.8731 114.378 81.793 115.224C82.7128 116.07 83.911 116.548 85.1601 116.568H85.5647C86.8809 116.443 88.0964 115.809 88.9527 114.801C89.809 113.793 90.2385 112.491 90.1501 111.171C89.3797 103.642 89.0644 96.0733 89.206 88.5061Z" fill="currentColor" fill-opacity="0.61"/>
    <path d="M111.216 47.9107C116.653 47.9107 121.061 43.5013 121.061 38.062C121.061 32.6228 116.653 28.2134 111.216 28.2134C105.779 28.2134 101.371 32.6228 101.371 38.062C101.371 43.5013 105.779 47.9107 111.216 47.9107Z" fill="currentColor" fill-opacity="0.61"/>
    <path d="M126.159 51.6748C125.319 51.586 124.477 51.8344 123.82 52.3656C123.162 52.8968 122.743 53.6673 122.653 54.5079L118.876 90.3948H95.9496C95.0912 90.3948 94.2679 90.736 93.6609 91.3432C93.0539 91.9504 92.7129 92.774 92.7129 93.6327C92.7129 94.4915 93.0539 95.3151 93.6609 95.9223C94.2679 96.5295 95.0912 96.8706 95.9496 96.8706H106.469V108.743L99.1863 111.306C98.5451 111.566 98.0238 112.056 97.7245 112.679C97.4251 113.303 97.3693 114.016 97.568 114.679C97.7415 115.187 98.0682 115.628 98.503 115.942C98.9377 116.256 99.4592 116.428 99.9955 116.433C100.272 116.454 100.55 116.408 100.805 116.298L108.896 113.33L116.988 116.298C117.317 116.418 117.666 116.471 118.016 116.455C118.365 116.439 118.708 116.354 119.024 116.204C119.341 116.055 119.624 115.844 119.859 115.584C120.093 115.324 120.273 115.02 120.389 114.689C120.505 114.359 120.554 114.009 120.534 113.66C120.514 113.31 120.425 112.968 120.271 112.654C120.118 112.339 119.904 112.058 119.641 111.827C119.379 111.595 119.073 111.419 118.742 111.306L111.459 108.743V96.8706H121.574C122.367 96.8804 123.137 96.5966 123.734 96.0738C124.331 95.5509 124.715 94.8257 124.81 94.0375L128.991 55.1825C129.08 54.3418 128.832 53.5002 128.301 52.8425C127.77 52.1848 126.999 51.7648 126.159 51.6748Z" fill="currentColor" fill-opacity="0.61"/>
    <path d="M96.4888 73.8005V69.4833C96.4943 69.3932 96.4806 69.3031 96.4487 69.2187C96.4168 69.1344 96.3673 69.0578 96.3035 68.994C96.2398 68.9302 96.1632 68.8807 96.0789 68.8488C95.9946 68.8168 95.9045 68.8032 95.8145 68.8087H34.0471C33.9571 68.8032 33.867 68.8168 33.7827 68.8488C33.6983 68.8807 33.6218 68.9302 33.558 68.994C33.4943 69.0578 33.4448 69.1344 33.4129 69.2187C33.3809 69.3031 33.3673 69.3932 33.3728 69.4833V73.8005C33.3673 73.8905 33.3809 73.9807 33.4129 74.065C33.4448 74.1494 33.4943 74.2259 33.558 74.2897C33.6218 74.3535 33.6983 74.403 33.7827 74.4349C33.867 74.4669 33.9571 74.4806 34.0471 74.475H56.1647V115.354C56.1592 115.444 56.1728 115.534 56.2048 115.618C56.2367 115.703 56.2862 115.779 56.3499 115.843C56.4137 115.907 56.4902 115.956 56.5745 115.988C56.6589 116.02 56.749 116.034 56.839 116.028H73.0226C73.1126 116.034 73.2027 116.02 73.287 115.988C73.3713 115.956 73.4479 115.907 73.5116 115.843C73.5754 115.779 73.6249 115.703 73.6568 115.618C73.6887 115.534 73.7024 115.444 73.6969 115.354V74.61H95.8145C96.0101 74.5895 96.19 74.4934 96.316 74.3422C96.4419 74.191 96.5039 73.9967 96.4888 73.8005Z" fill="currentColor" fill-opacity="0.61"/>
    </g>
    <defs>
    <clipPath id="clip0">
    <rect width="128.03" height="116.141" fill="currentColor" transform="translate(0.970703 0.542725)"/>
    </clipPath>
    </defs>
    </svg>
    `;

    public readonly pending_svg = `
    <svg width="129" height="117" viewBox="0 0 129 117" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0)">
    <path d="M32.9412 90.8456H10.1493L6.37317 54.8238C6.34026 54.4031 6.22188 53.9934 6.02528 53.62C5.82868 53.2465 5.558 52.9171 5.22978 52.6519C4.90156 52.3867 4.5227 52.1913 4.11639 52.0776C3.71008 51.9639 3.28486 51.9343 2.86672 51.9907C2.4461 52.0236 2.03661 52.142 1.66331 52.3387C1.29 52.5353 0.960731 52.8061 0.695631 53.1345C0.43053 53.4628 0.235174 53.8418 0.121514 54.2483C0.00785298 54.6547 -0.0217234 55.0801 0.0345939 55.4984L4.21535 94.3534C4.31102 95.1416 4.69432 95.8668 5.29168 96.3896C5.88904 96.9125 6.65838 97.1963 7.45207 97.1865H17.432V109.059L10.0145 111.892C9.68304 112.004 9.37714 112.181 9.11452 112.412C8.8519 112.644 8.63776 112.925 8.48452 113.239C8.33127 113.554 8.24197 113.896 8.22178 114.246C8.20159 114.595 8.25092 114.945 8.3669 115.275C8.48289 115.605 8.66323 115.909 8.89747 116.169C9.13171 116.429 9.4152 116.64 9.73151 116.79C10.0478 116.94 10.3907 117.025 10.7402 117.041C11.0897 117.057 11.439 117.004 11.7677 116.884L19.8595 113.916L27.9513 116.884H28.8953C29.4316 116.879 29.9531 116.707 30.3879 116.393C30.8227 116.079 31.1493 115.638 31.3229 115.13C31.5523 114.468 31.511 113.742 31.2079 113.11C30.9048 112.478 30.3644 111.992 29.7045 111.757L22.4219 109.194V97.3214H32.9412C33.7961 97.3099 34.6127 96.9651 35.2172 96.3603C35.8217 95.7556 36.1664 94.9387 36.1779 94.0835C36.1836 93.6568 36.1037 93.2332 35.943 92.8378C35.7823 92.4424 35.5441 92.0833 35.2425 91.7815C34.9408 91.4797 34.5817 91.2414 34.1865 91.0806C33.7913 90.9199 33.3678 90.84 32.9412 90.8456Z" fill="currentColor"/>
    <path d="M125.188 51.9907C124.348 51.9019 123.507 52.1503 122.849 52.6816C122.192 53.2128 121.772 53.9833 121.682 54.8239L117.906 90.7107H94.9789C94.1205 90.7107 93.2972 91.0519 92.6902 91.6591C92.0832 92.2663 91.7422 93.0899 91.7422 93.9487C91.7422 94.8074 92.0832 95.631 92.6902 96.2382C93.2972 96.8454 94.1205 97.1866 94.9789 97.1866H105.498V109.059L98.2156 111.622C97.5744 111.882 97.0531 112.371 96.7538 112.995C96.4544 113.619 96.3986 114.332 96.5973 114.995C96.7708 115.503 97.0975 115.944 97.5323 116.258C97.967 116.572 98.4885 116.744 99.0248 116.749C99.3015 116.77 99.5792 116.724 99.834 116.614L107.926 113.646L116.018 116.614C116.346 116.734 116.696 116.787 117.045 116.771C117.395 116.755 117.737 116.67 118.054 116.52C118.37 116.37 118.654 116.16 118.888 115.9C119.122 115.64 119.302 115.336 119.418 115.005C119.534 114.675 119.584 114.325 119.564 113.976C119.543 113.626 119.454 113.284 119.301 112.97C119.148 112.655 118.933 112.374 118.671 112.143C118.408 111.911 118.102 111.734 117.771 111.622L110.488 109.059V97.1866H120.603C121.397 97.1963 122.166 96.9126 122.763 96.3897C123.361 95.8668 123.744 95.1416 123.84 94.3534L128.02 55.4984C128.109 54.6577 127.861 53.8161 127.33 53.1584C126.799 52.5007 126.029 52.0807 125.188 51.9907Z" fill="currentColor"/>
    <path d="M95.5186 74.1164V69.7992C95.5241 69.7091 95.5104 69.619 95.4785 69.5346C95.4465 69.4503 95.3971 69.3737 95.3333 69.3099C95.2696 69.2462 95.193 69.1967 95.1087 69.1647C95.0244 69.1328 94.9342 69.1191 94.8443 69.1246H33.0769C32.9869 69.1191 32.8968 69.1328 32.8124 69.1647C32.7281 69.1967 32.6516 69.2462 32.5878 69.3099C32.5241 69.3737 32.4746 69.4503 32.4426 69.5346C32.4107 69.619 32.397 69.7091 32.4026 69.7992V74.1164C32.397 74.2064 32.4107 74.2966 32.4426 74.3809C32.4746 74.4653 32.5241 74.5419 32.5878 74.6056C32.6516 74.6694 32.7281 74.7189 32.8124 74.7509C32.8968 74.7828 32.9869 74.7965 33.0769 74.791H55.1945V115.67C55.1889 115.76 55.2026 115.85 55.2345 115.934C55.2665 116.018 55.3159 116.095 55.3797 116.159C55.4435 116.223 55.52 116.272 55.6043 116.304C55.6886 116.336 55.7788 116.35 55.8688 116.344H72.0524C72.1423 116.35 72.2325 116.336 72.3168 116.304C72.4011 116.272 72.4777 116.223 72.5414 116.159C72.6052 116.095 72.6547 116.018 72.6866 115.934C72.7185 115.85 72.7322 115.76 72.7267 115.67V74.9259H94.8443C95.0399 74.9054 95.2198 74.8093 95.3458 74.6581C95.4717 74.507 95.5337 74.3126 95.5186 74.1164Z" fill="currentColor"/>
    <path d="M41.042 58.875H85.9587L63.5003 20.0834L41.042 58.875ZM65.542 52.75H61.4587V48.6667H65.542V52.75ZM65.542 44.5834H61.4587V36.4167H65.542V44.5834Z" fill="currentColor"/>
    </g>
    <defs>
    <clipPath id="clip0">
    <rect width="128.03" height="116.141" fill="currentColor" transform="translate(0 0.858643)"/>
    </clipPath>
    </defs>
    </svg>
    `;

    constructor(private _state: PanelStateService) {}
}
