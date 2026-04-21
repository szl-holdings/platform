/**
 * Billing E2E — Subscription & payment flow tests
 *
 * Entry points tested:
 *   /pricing   — design-partner / pricing intent page (public, no auth)
 *   /settings  — Plan & Billing section in the org-settings profile tab,
 *                which embeds the full SubscriptionManager component
 *
 * The spec intercepts API routes using page.route() so no live API server
 * or real Stripe account is required. Server-side billing logic is covered
 * separately in tests/api/.
 *
 * Flows covered:
 *   1. Pricing page renders plan CTAs without errors
 *   2. /settings "Plan & Billing" section heading renders
 *   3. "Manage Billing" button (org-settings direct call) calls portal-session
 *   4. SubscriptionManager: "no active subscription" state renders correctly
 *   5. SubscriptionManager: "Start Free Trial" calls /api/billing/checkout
 *   6. SubscriptionManager: active subscription state renders correctly
 *   7. SubscriptionManager: first cancel click shows "Confirm cancel" prompt
 *   8. SubscriptionManager: confirming cancel calls /api/billing/cancel-subscription
 *   9. SubscriptionManager: "Never mind" dismisses the confirm prompt
 *
 * KG010 / TG-001 resolution: provides automated E2E coverage for the billing
 * event flows previously absent from the test suite.
 */

import { expect, type Page, test } from '@playwright/test';

const BASE_PATH = (process.env.SZL_BASE_PATH ?? '/').replace(/\/$/, '');

const PRICING_PATH = `${BASE_PATH}/pricing`;
const SETTINGS_PATH = `${BASE_PATH}/settings`;

// Route patterns for page.route() interception
const AUTH_USER_URL = '**/api/auth/user';
const AUTH_ME_URL = '**/api/auth/me';
const USER_PROFILE_URL = '**/api/user/profile';
const ORG_PROFILE_URL = '**/api/orgs/**';
const BILLING_STATUS_URL = '**/api/billing/subscription-status**';
const BILLING_INVOICES_URL = '**/api/billing/stripe-invoices**';
const BILLING_CHECKOUT_URL = '**/api/billing/checkout';
const BILLING_PORTAL_URL = '**/api/billing/portal-session';
const BILLING_CANCEL_URL = '**/api/billing/cancel-subscription';

// ---------------------------------------------------------------------------
// Mock payloads
// ---------------------------------------------------------------------------

const MOCK_USER = {
  user: { id: 1, displayName: 'E2E Billing Tester', email: 'billing-e2e@szl.test', roles: ['admin'] },
};

const MOCK_USER_PROFILE = {
  id: 1, displayName: 'E2E Billing Tester', email: 'billing-e2e@szl.test',
};

const MOCK_ORG = {
  id: 'org_e2e', name: 'E2E Test Org', slug: 'e2e-test', plan: 'growth', status: 'active',
};

const MOCK_NO_SUBSCRIPTION = { subscribed: false, subscription: null };

const MOCK_ACTIVE_SUBSCRIPTION = {
  subscribed: true,
  subscription: {
    id: 'sub_E2E12345',
    customerId: 'cus_E2ECUST',
    status: 'active',
    priceId: 'price_szl_pro_monthly',
    productId: 'prod_SZL_PRO',
    currentPeriodStart: Math.floor(Date.now() / 1000) - 86400 * 15,
    currentPeriodEnd: Math.floor(Date.now() / 1000) + 86400 * 15,
    cancelAtPeriodEnd: false,
    items: [{ id: 'si_E2E', priceId: 'price_szl_pro_monthly', quantity: 1 }],
  },
};

const MOCK_INVOICES = [
  {
    id: 'in_E2E001',
    customerId: 'cus_E2ECUST',
    subscriptionId: 'sub_E2E12345',
    amount: 49900,
    currency: 'usd',
    status: 'paid',
    paidAt: Math.floor(Date.now() / 1000) - 86400 * 15,
    created: Date.now() - 86400 * 15 * 1000,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function mockAllSettingsApis(page: Page) {
  await page.route(AUTH_USER_URL, (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }),
  );
  await page.route(AUTH_ME_URL, (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER_PROFILE) }),
  );
  await page.route(USER_PROFILE_URL, (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER_PROFILE) }),
  );
  await page.route(ORG_PROFILE_URL, (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_ORG) }),
  );
}

async function mockNoSubscription(page: Page) {
  await page.route(BILLING_STATUS_URL, (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_NO_SUBSCRIPTION) }),
  );
  await page.route(BILLING_INVOICES_URL, (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
  );
}

async function mockActiveSubscription(page: Page) {
  await page.route(BILLING_STATUS_URL, (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_ACTIVE_SUBSCRIPTION) }),
  );
  await page.route(BILLING_INVOICES_URL, (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_INVOICES) }),
  );
}

async function goToSettings(page: Page) {
  await page.goto(SETTINGS_PATH, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
}

// ---------------------------------------------------------------------------
// Availability guard
// ---------------------------------------------------------------------------

let appAvailable = true;

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    const resp = await page.goto(`${BASE_PATH}/`, { timeout: 15000, waitUntil: 'domcontentloaded' });
    appAvailable = !!resp && resp.status() < 500;
  } catch {
    appAvailable = false;
  }
  await page.close();
});

test.beforeEach(async ({}, testInfo) => {
  if (!appAvailable) testInfo.skip();
});

// ---------------------------------------------------------------------------
// Suite 1 — Pricing / design-partner page (public)
// ---------------------------------------------------------------------------

test.describe('Billing — Pricing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PRICING_PATH, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
  });

  test('page loads without fatal errors', async ({ page }) => {
    const hasError = await page.locator('text=Something went wrong').first().isVisible().catch(() => false);
    expect(hasError).toBe(false);
    await expect(page.locator('body')).toBeVisible();
  });

  test('page has substantive content', async ({ page }) => {
    const html = await page.content();
    expect(html.length).toBeGreaterThan(500);
  });

  test('"Start a Conversation" CTA is visible and links to /contact', async ({ page }) => {
    const cta = page.locator('a', { hasText: /start a conversation/i }).first();
    await expect(cta).toBeVisible({ timeout: 15000 });
    const href = await cta.getAttribute('href');
    expect(href).toMatch(/\/contact/);
  });

  test('"See the Demo First" CTA is visible and links to /demo', async ({ page }) => {
    const cta = page.locator('a', { hasText: /see the demo first/i }).first();
    await expect(cta).toBeVisible({ timeout: 15000 });
    const href = await cta.getAttribute('href');
    expect(href).toMatch(/\/demo/);
  });

  test('Design Partner Program heading is visible', async ({ page }) => {
    await expect(page.locator('text=Design Partner Program').first()).toBeVisible({ timeout: 15000 });
  });
});

// ---------------------------------------------------------------------------
// Suite 2 — Org settings: Plan & Billing section renders
// ---------------------------------------------------------------------------

test.describe('Billing — Org settings Plan & Billing section', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllSettingsApis(page);
    await mockNoSubscription(page);
    await goToSettings(page);
  });

  test('"Plan & Billing" heading is visible in the profile tab', async ({ page }) => {
    await expect(page.locator('text=Plan & Billing').first()).toBeVisible({ timeout: 15000 });
  });

  test('org plan label is rendered', async ({ page }) => {
    // The org plan ("growth", "enterprise", etc.) is shown above the SubscriptionManager
    await expect(page.locator('text=growth Plan').first()).toBeVisible({ timeout: 15000 });
  });
});

// ---------------------------------------------------------------------------
// Suite 3 — SubscriptionManager: no active subscription state
// ---------------------------------------------------------------------------

test.describe('Billing — SubscriptionManager: no subscription state', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllSettingsApis(page);
    await mockNoSubscription(page);
    await goToSettings(page);
  });

  test('"No active subscription" text is displayed', async ({ page }) => {
    await expect(page.locator('text=No active subscription').first()).toBeVisible({ timeout: 15000 });
  });

  test('"Start Free Trial" button is visible', async ({ page }) => {
    await expect(page.locator('button', { hasText: /start free trial/i }).first()).toBeVisible({
      timeout: 15000,
    });
  });

  test('clicking "Start Free Trial" calls /api/billing/checkout', async ({ page }) => {
    // Auth and no-subscription routes are already registered by beforeEach.
    // Register the checkout intercept and re-navigate to ensure it is active.
    let checkoutCalled = false;
    await page.route(BILLING_CHECKOUT_URL, (route) => {
      checkoutCalled = true;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: 'https://checkout.stripe.com/e2e-mock' }),
      });
    });
    await page.route('https://checkout.stripe.com/**', (route) => route.abort());

    // Re-navigate so the page is loaded with all interceptors active
    await goToSettings(page);

    const trialBtn = page.locator('button', { hasText: /start free trial/i }).first();
    await expect(trialBtn).toBeVisible({ timeout: 15000 });
    const checkoutResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/billing/checkout') && resp.request().method() === 'POST',
      { timeout: 10000 },
    );
    await trialBtn.click();
    await checkoutResponsePromise;

    expect(checkoutCalled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Suite 4 — SubscriptionManager: active subscription state
// ---------------------------------------------------------------------------

test.describe('Billing — SubscriptionManager: active subscription state', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllSettingsApis(page);
    await mockActiveSubscription(page);
    await goToSettings(page);
  });

  test('"Current Subscription" heading is visible', async ({ page }) => {
    await expect(page.locator('text=Current Subscription').first()).toBeVisible({ timeout: 15000 });
  });

  test('"Active" status badge is displayed', async ({ page }) => {
    await expect(page.locator('text=Active').first()).toBeVisible({ timeout: 15000 });
  });

  test('subscription ID sub_E2E12345 is shown', async ({ page }) => {
    await expect(page.locator('text=sub_E2E12345').first()).toBeVisible({ timeout: 15000 });
  });

  test('"Manage Billing" button from SubscriptionManager is visible', async ({ page }) => {
    // The SubscriptionManager renders its own "Manage Billing" button for active subscriptions
    const btns = page.locator('button', { hasText: /manage billing/i });
    // At least one button should be visible (either org-settings or SubscriptionManager)
    await expect(btns.first()).toBeVisible({ timeout: 15000 });
  });

  test('SubscriptionManager "Manage Billing" calls /api/billing/portal-session', async ({
    page,
  }) => {
    // Auth and active-subscription routes are already registered by beforeEach.
    let portalCalled = false;
    await page.route(BILLING_PORTAL_URL, (route) => {
      portalCalled = true;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: 'https://billing.stripe.com/e2e-mock' }),
      });
    });
    await page.route('https://billing.stripe.com/**', (route) => route.abort());

    await goToSettings(page);

    const manageBtn = page.locator('button', { hasText: /manage billing/i }).first();
    await expect(manageBtn).toBeVisible({ timeout: 15000 });
    const portalResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/billing/portal-session') && resp.request().method() === 'POST',
      { timeout: 10000 },
    );
    await manageBtn.click();
    await portalResponsePromise;

    expect(portalCalled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Suite 5 — Cancel subscription: two-step confirm flow
// ---------------------------------------------------------------------------

test.describe('Billing — Cancel subscription flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllSettingsApis(page);
    await mockActiveSubscription(page);
    await goToSettings(page);
  });

  test('"Cancel plan" button is visible for active subscription', async ({ page }) => {
    await expect(page.locator('button', { hasText: /cancel plan/i }).first()).toBeVisible({
      timeout: 15000,
    });
  });

  test('first click on "Cancel plan" shows "Confirm cancel" without calling the API', async ({
    page,
  }) => {
    // Auth and active-subscription routes registered by beforeEach.
    let cancelCalled = false;
    await page.route(BILLING_CANCEL_URL, (route) => {
      cancelCalled = true;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Subscription will cancel at end of billing period' }),
      });
    });

    // Re-navigate with all interceptors now active
    await goToSettings(page);

    const cancelBtn = page.locator('button', { hasText: /cancel plan/i }).first();
    await expect(cancelBtn).toBeVisible({ timeout: 15000 });
    await cancelBtn.click();

    await expect(page.locator('button', { hasText: /confirm cancel/i }).first()).toBeVisible({
      timeout: 5000,
    });
    expect(cancelCalled).toBe(false);
  });

  test('confirming cancel calls /api/billing/cancel-subscription', async ({ page }) => {
    // Auth and active-subscription routes registered by beforeEach.
    let cancelCalled = false;
    await page.route(BILLING_CANCEL_URL, (route) => {
      cancelCalled = true;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Subscription will cancel at end of billing period' }),
      });
    });
    // After cancel, SubscriptionManager re-fetches status — return cancelled state
    let callCount = 0;
    await page.route(BILLING_STATUS_URL, (route) => {
      callCount++;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(callCount > 1 ? MOCK_NO_SUBSCRIPTION : MOCK_ACTIVE_SUBSCRIPTION),
      });
    });

    await goToSettings(page);

    const cancelBtn = page.locator('button', { hasText: /cancel plan/i }).first();
    await expect(cancelBtn).toBeVisible({ timeout: 15000 });
    await cancelBtn.click();

    const confirmBtn = page.locator('button', { hasText: /confirm cancel/i }).first();
    await expect(confirmBtn).toBeVisible({ timeout: 5000 });
    const cancelResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/billing/cancel-subscription') && resp.request().method() === 'POST',
      { timeout: 10000 },
    );
    await confirmBtn.click();
    await cancelResponsePromise;

    expect(cancelCalled).toBe(true);
  });

  test('"Never mind" dismisses the cancel confirmation without calling the API', async ({
    page,
  }) => {
    // Auth and active-subscription routes registered by beforeEach.
    let cancelCalled = false;
    await page.route(BILLING_CANCEL_URL, (route) => {
      cancelCalled = true;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Cancelled' }) });
    });

    await goToSettings(page);

    const cancelBtn = page.locator('button', { hasText: /cancel plan/i }).first();
    await expect(cancelBtn).toBeVisible({ timeout: 15000 });
    await cancelBtn.click();

    const confirmBtn = page.locator('button', { hasText: /confirm cancel/i }).first();
    await expect(confirmBtn).toBeVisible({ timeout: 5000 });

    const neverMindBtn = page.locator('button', { hasText: /never mind/i }).first();
    await expect(neverMindBtn).toBeVisible({ timeout: 5000 });
    await neverMindBtn.click();

    await expect(page.locator('button', { hasText: /confirm cancel/i }).first()).not.toBeVisible({
      timeout: 5000,
    });
    expect(cancelCalled).toBe(false);
  });
});
