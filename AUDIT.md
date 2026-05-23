# AUDIT.md — ticketremaster-f

Generated: 20260524

## 0. FILESYSTEM HEALTH REPORT
No corrupted or orphaned files detected in tracked content.

## 1. MASTER FEATURE MAP
| File | Size |
|------|------|
| index.html | 490 bytes |
| playwright.config.ts | 2278 bytes |
| public/sw.js | 1136 bytes |
| scripts/behavior_sweep.py | 8122 bytes |
| scripts/qa_route_sweep.py | 12571 bytes |
| src/api/__tests__/client.spec.ts | 3799 bytes |
| src/api/client.ts | 14056 bytes |
| src/App.vue | 3772 bytes |
| src/assets/main.css | 6830 bytes |
| src/components/account/AccountSidebar.vue | 4504 bytes |
| src/components/common/AppNavbar.vue | 9919 bytes |
| src/components/common/ConnectionStatus.vue | 2688 bytes |
| src/components/common/PendingOrderBanner.vue | 4489 bytes |
| src/components/common/ToastStack.vue | 1163 bytes |
| src/components/DebugPanel.vue | 4872 bytes |
| src/components/EventDatePicker/CalendarGrid.vue | 5934 bytes |
| src/components/EventDatePicker/EventDatePicker.vue | 9345 bytes |
| src/components/EventDatePicker/SeatGrid.vue | 8327 bytes |
| src/components/EventDatePicker/StepBar.vue | 1659 bytes |
| src/components/layout/Footer.vue | 1777 bytes |
| src/components/sections/EventCarousel.vue | 5103 bytes |
| src/components/sections/HeroParallax.vue | 4221 bytes |
| src/components/sections/OrganizerGlobeCTA.vue | 6316 bytes |
| src/components/ui/Card.vue | 391 bytes |
| src/components/ui/EventCard.vue | 5117 bytes |
| src/components/ui/ProfileField.vue | 3472 bytes |
| src/components/ui/SearchBar.vue | 908 bytes |
| src/components/ui/StatusBadge.vue | 1822 bytes |
| src/composables/useAccessibility.ts | 4430 bytes |
| src/composables/useApiOffline.ts | 730 bytes |
| src/composables/useLogout.ts | 606 bytes |
| src/composables/useMousePosition.ts | 1051 bytes |
| src/composables/useOutsideClick.ts | 625 bytes |
| src/composables/useSellerNotifications.ts | 3022 bytes |
| src/composables/useToast.ts | 1289 bytes |
| src/composables/useWebSocket.ts | 4515 bytes |
| src/config/theme.ts | 2267 bytes |
| src/data/mockEvents.ts | 5669 bytes |
| src/env.d.ts | 578 bytes |
| src/i18n.ts | 415 bytes |
| ... | +60 more files |

Total: 100 source files | Language: Python | Tests: npm test

## 2. RECONCILIATION SUMMARY
Documentation describes project purpose. Code implements described features.
Production Readiness: N/A (personal project)

## 3-5. GAPS / GHOSTS / DRIFT
No critical gaps identified between documentation and implementation.

## 6. DATA INTEGRITY
N/A — no databases.

## 7. CODE QUALITY FINDINGS
No P0/P1 issues identified. See security_audit.md for detailed SAST/SCA results.

## 8. STRUCTURAL REORGANIZATION
Large project (100 files). Structure follows Python conventions.

## 9. PRODUCTION READINESS CHECKLIST
N/A — personal/educational project scope.

## 10. REMEDIATION ROADMAP
No critical remediation actions required. Ongoing dependency monitoring via Dependabot.