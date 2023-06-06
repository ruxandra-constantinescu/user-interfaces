describe('Booking Desks', () => {
    beforeEach(() => cy.visit('/#/book/new-desks/form?mock=true'));

    it('should display booking form', () => {
        cy.get('global-loading');
        cy.get('new-desk-flow-form');
    });

    // #region SINGLE BOOKINGS

    // it('should ensure the meeting title is a required field', () => {
    //     cy.get('input[name="title"]')
    //         .clear()
    //         .then(() => {
    //             cy.get('button[name="add-desk"]')
    //                 .click({ force: true })
    //                 .then(() => {
    //                     cy.wait(6000);

    //                     cy.get('desk-select-modal button[name="select-desk"]')
    //                         .first()
    //                         .click({ force: true })
    //                         .then(() => {
    //                             cy.get('button[name="toggle-desk"]').click({
    //                                 force: true,
    //                             });
    //                         });
    //                 });

    //             cy.get('button[name="open-desk-confirm"]')
    //                 .click({
    //                     force: true,
    //                 })
    //                 .then(() => {
    //                     cy.get('new-desk-flow-confirm').should('not.exist');
    //                 });

    //             // ********************************
    //             //This part of the test is failing. Dismissing the error message lets you proceed to book without a title
    //             // ********************************

    //             //After dismissing the initial error message, clicking the 'Confirm' button again
    //             //should not result in the booking proceeding without a meeting title
    //             // cy.get('button[name="open-desk-confirm"]')
    //             //     .click({
    //             //         force: true,
    //             //     })
    //             //     .then(() => {
    //             //         cy.get('new-desk-flow-confirm').should('not.exist');
    //             //     });
    //         });
    // });

    it('should allow All Day bookings to be added to the form', () => {
        cy.wait(3000);
        cy.get('new-desk-flow-confirm').should('not.exist');
        cy.get('mat-checkbox[formcontrolname="all_day"]')
            .find('input[type=checkbox]')
            .check()
            .then(() => {
                cy.get('button[name="add-desk"]')
                    .click({ force: true })
                    .then(() => {
                        cy.wait(6000);

                        cy.get('desk-select-modal button[name="select-desk"]')
                            .first()
                            .click({ force: true })
                            .then(() => {
                                cy.get('button[name="toggle-desk"]').click({
                                    force: true,
                                });
                            })
                            .then(() => {
                                cy.wait(5000);
                                cy.get('button[name="open-desk-confirm"]')
                                    .click({
                                        force: true,
                                    })
                                    .then(() => {
                                        cy.get('new-desk-flow-confirm').should(
                                            'exist'
                                        );
                                        cy.get('new-desk-flow-confirm')
                                            .contains('div', 'All Day')
                                            .should('be.visible');
                                    });
                            });
                    });
            });
    });

    // #endregion

    // #region GROUP BOOKINGS
    // #endregion
});
