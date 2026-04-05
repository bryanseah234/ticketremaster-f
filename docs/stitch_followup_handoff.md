# Stitch Follow-up Handoff

Branch: `codex/stitch-integration`

## Source of truth

- Google Stitch exports in `C:\ticketremaster\ticketremaster-f\stitch_exports` are the primary visual source.
- User instructions override Stitch when they explicitly disagree.
- If Stitch and the user conflict and the product implication is not obvious, stop and ask which version to follow.

## Current agreed rules

### Navbar

- Staff navbar must not show `Scanner`; scanner access belongs in the profile left column.
- Admin navbar must not show `Dashboard`; dashboard belongs in the profile-family left column.
- Demo, staff, and admin accounts should use a reduced top nav.
- Admin mobile nav should also stay reduced rather than exposing extra top-level destinations.
- Demo, staff, and admin accounts must not show the notification bell.

### Login / offline

- Offline mode should still show the same Stitch login screen.
- Email/password fields should remain visible but disabled when backend is unavailable.
- The primary sign-in button should remain visible but disabled.
- Demo entry should continue through the same `Launch` button in the demo panel.
- Do not swap the login page into a separate offline-specific layout.

### Profile-family shell

- All profile-family pages must use the same left-column width across routes and roles.
- All profile-family pages must include `Log Out` as the last item in the left column.
- Admin left column should not include customer items like `Credits` or `Tickets`.
- Staff keeps `Scanner` in the left column, not the top nav.
- Profile pages should be simplified:
  - remove `Security & Password`
  - remove `Two-Factor Auth`
  - remove `Device Management`
  - remove `Wallet` shortcut card
  - keep the main account details card and update action

### Marketplace / empty states

- Remove the small `Verified Listings` heading.
- Empty-state cards should align to the top with the right column.
- Empty datasets from the live backend must render an intentional empty state, not a broken-looking blank area.

### Event detail

- The circular `ABOUT` badge is visually wrong.
- It should likely become a smaller pill/badge matching the `BOOKING` label style.

## Backend browser-facing route contract

These routes are compulsory frontend-facing integrations and need real UI surfaces, actions, or states:

- `/auth/register`
- `/auth/login`
- `/auth/verify-registration`
- `/auth/me`
- `/auth/logout`
- `/events`
- `/events/{eventId}`
- `/events/{eventId}/seats`
- `/events/{eventId}/seats/{inventoryId}`
- `/venues`
- `/admin/events`
- `/admin/events/{eventId}/dashboard`
- `/credits/balance`
- `/credits/topup/initiate`
- `/credits/topup/confirm`
- `/credits/transactions`
- `/purchase/hold/{inventoryId}` `POST`
- `/purchase/hold/{inventoryId}` `DELETE`
- `/purchase/confirm/{inventoryId}`
- `/tickets`
- `/tickets/{ticketId}/qr`
- `/marketplace`
- `/marketplace/list`
- `/marketplace/{listingId}` `DELETE`
- `/transfer/initiate`
- `/transfer/pending`
- `/transfer/{transferId}`
- `/transfer/{transferId}/seller-accept`
- `/transfer/{transferId}/seller-reject`
- `/transfer/{transferId}/buyer-verify`
- `/transfer/{transferId}/seller-verify`
- `/transfer/{transferId}/resend-otp`
- `/transfer/{transferId}/cancel`
- `/verify/scan`
- `/verify/manual`

`/webhooks/stripe` is not a browser UI route and should not be treated like one.

## Required audit before declaring completion

1. Re-audit implemented pages against the Stitch HTML/screenshots.
2. Reconcile every mismatch against the user overrides above.
3. Verify each compulsory backend route has an actual frontend surface or action.
4. Verify extra frontend pages do not call unsupported backend endpoints.
5. Check loading, empty, error, and offline/demo states on the major data pages.

## Route audit snapshot

- Now covered explicitly:
  - `/auth/logout` is expected to be called from shared logout actions.
  - `/events/{eventId}/seats/{inventoryId}` is called when selecting a live seat to hydrate seat detail.
  - `/transfer/pending` is surfaced through the notifications flow and seller polling helper.
  - `/transfer/{transferId}/cancel` is now surfaced in the transfer UI for buyer wait states and OTP states.
  - frontend route guards are tightened for protected transfer detail and QR routes.
- Remaining route-contract ambiguity is mostly product/navigation, not missing endpoint wiring:
  - live admin still lacks a clean universal sidebar target for the event-specific dashboard route

## Known unresolved point

- Admin dashboard routing is event-specific (`/admin/events/{eventId}/dashboard`).
- The current rule is to preserve the active `eventId` context and use that specific dashboard when exposing the admin sidebar `Dashboard` link.
- The admin profile link should carry `eventId` context when opened from an event-scoped admin page so the sidebar can resolve the correct dashboard target.
