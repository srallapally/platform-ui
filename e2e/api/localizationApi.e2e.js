/**
 * Copyright (c) 2021-2025 ForgeRock. All rights reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */

/**
 * Add a config translation file
 */
export function addOverrides(locale, body, accessToken = Cypress.env('ACCESS_TOKEN').access_token) {
  return cy.request({
    method: 'PUT',
    url: `https://${Cypress.env('FQDN')}/openidm/config/uilocale/${locale}`,
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body,
  });
}

/**
 * Delete a config translation file
 */
export function deleteOverrides(locale, failOnStatusCodeToggle = true, accessToken = Cypress.env('ACCESS_TOKEN').access_token) {
  return cy.request({
    failOnStatusCode: failOnStatusCodeToggle,
    method: 'DELETE',
    url: `https://${Cypress.env('FQDN')}/openidm/config/uilocale/${locale}`,
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });
}
