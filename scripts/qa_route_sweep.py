from __future__ import annotations

import json
import re
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from playwright.sync_api import BrowserContext, Page, sync_playwright


BASE_URL = "http://127.0.0.1:3000"
OUTPUT_ROOT = Path("qa-artifacts") / "route-sweep"
NOW = time.strftime("%Y%m%d-%H%M%S")
RUN_DIR = OUTPUT_ROOT / NOW
SCREENSHOT_DIR = RUN_DIR / "screenshots"
REPORT_PATH = RUN_DIR / "report.json"
IGNORED_HOST_FRAGMENTS = [
    "ingest.us.sentry.io",
    "us.i.posthog.com",
    "js.stripe.com",
    "m.stripe.network",
]


VIEWPORTS = [
    {"name": "desktop", "width": 1440, "height": 1280, "is_mobile": False},
    {"name": "mobile", "width": 390, "height": 844, "is_mobile": True},
]


PUBLIC_ROUTES = [
    "/",
    "/events",
    "/events/demo-event-001",
    "/help",
    "/venues",
    "/about",
    "/careers",
    "/terms",
    "/privacy",
    "/design",
    "/login",
    "/demo-login",
    "/register",
    "/verify",
    "/verify/success",
]

USER_ROUTES = [
    "/events",
    "/events/demo-event-001",
    "/events/demo-event-001/seats",
    "/checkout/demo-inv-001",
    "/tickets",
    "/tickets/demo-ticket-001",
    "/ticket-qr/demo-ticket-001",
    "/credits/topup",
    "/profile",
    "/notifications",
    "/marketplace",
    "/transfer/initiate?ticketId=demo-ticket-001",
    "/transfer/demo-transfer-001",
]

ADMIN_ROUTES = [
    "/admin/events/new",
    "/admin/events/demo-event-001/dashboard",
    "/admin/users",
]

STAFF_ROUTES = [
    "/staff/scan",
]


@dataclass
class AuditResult:
    viewport: str
    role: str
    route: str
    final_url: str
    title: str
    heading: str
    body_chars: int
    horizontal_overflow: bool
    console_errors: list[str]
    page_errors: list[str]
    failed_requests: list[str]
    bad_responses: list[str]
    screenshot: str

    @property
    def issue_count(self) -> int:
        return (
            len(self.console_errors)
            + len(self.page_errors)
            + len(self.failed_requests)
            + len(self.bad_responses)
            + (1 if self.horizontal_overflow else 0)
        )


def ensure_dirs() -> None:
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)


def sanitize_route(route: str) -> str:
    cleaned = route.strip("/")
    if not cleaned:
        return "home"
    cleaned = cleaned.replace("/", "__")
    cleaned = cleaned.replace("?", "__")
    cleaned = cleaned.replace("&", "_")
    cleaned = cleaned.replace("=", "-")
    return re.sub(r"[^a-zA-Z0-9._-]+", "-", cleaned)


def should_ignore_url(url: str) -> bool:
    return any(fragment in url for fragment in IGNORED_HOST_FRAGMENTS)


def wait_for_app(page: Page) -> None:
    page.wait_for_load_state("domcontentloaded")
    try:
        page.wait_for_load_state("networkidle", timeout=5000)
    except Exception:
        page.wait_for_timeout(900)
    else:
        page.wait_for_timeout(300)


def with_retries(work: Any, attempts: int = 4) -> Any:
    last_error: Exception | None = None
    for _ in range(attempts):
        try:
            return work()
        except Exception as error:  # noqa: BLE001
            last_error = error
            if "Execution context was destroyed" not in str(error):
                raise
            time.sleep(0.4)
    if last_error:
        raise last_error
    raise RuntimeError("Retry helper exhausted without capturing an error.")


def best_effort(work: Any, fallback: Any, issues: list[str], label: str) -> Any:
    try:
        return with_retries(work)
    except Exception as error:  # noqa: BLE001
        issues.append(f"{label}: {error}")
        return fallback


def build_pending_order() -> dict[str, Any]:
    held_until = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() + 300))
    return {
        "orderId": "demo-inv-001",
        "inventoryId": "demo-inv-001",
        "holdToken": "qa-demo-hold-token",
        "eventId": "demo-event-001",
        "heldUntil": held_until,
        "seat": {
            "seatId": "demo-seat-001",
            "rowNumber": "A",
            "seatNumber": "1",
            "price": 149.99,
            "section": "Floor",
        },
        "event": {
            "name": "Taylor Swift - Eras Tour",
            "image": "/stitch-media/events/curated-featured.jpg",
            "eventDate": "2026-06-15T19:30:00Z",
            "venueName": "Madison Square Garden",
        },
    }


def seed_demo_checkout(page: Page) -> None:
    pending_order = build_pending_order()
    page.evaluate(
        """(payload) => {
            localStorage.setItem('pendingOrder', JSON.stringify(payload.pendingOrder));
            sessionStorage.setItem('demo_balance', payload.demoBalance);
        }""",
        {"pendingOrder": pending_order, "demoBalance": "500"},
    )


def seed_auth_context(context: BrowserContext, role: str) -> None:
    users = {
        "user": {
            "userId": "demo-user-001",
            "email": "demo@ticketremaster.com",
            "phoneNumber": "+1234567890",
            "role": "user",
            "isFlagged": False,
            "isAdmin": False,
        },
        "admin": {
            "userId": "demo-admin-001",
            "email": "admin@ticketremaster.com",
            "phoneNumber": "+1234567891",
            "role": "admin",
            "isFlagged": False,
            "isAdmin": True,
        },
        "staff": {
            "userId": "demo-staff-001",
            "email": "staff@ticketremaster.com",
            "phoneNumber": "+1234567892",
            "role": "staff",
            "isFlagged": False,
            "isAdmin": False,
        },
    }
    payload = users[role]
    seed_json = json.dumps({"token": f"demo-{role}-token", "user": payload})
    context.add_init_script(
        f"""
        (() => {{
            const seed = {seed_json};
            localStorage.setItem('access_token', seed.token);
            localStorage.setItem('refresh_token', 'demo-refresh-token');
            localStorage.setItem('user', JSON.stringify(seed.user));
            sessionStorage.setItem('demo_balance', '500');
            window.__demoMode = true;
        }})();
        """
    )


def audit_route(page: Page, viewport_name: str, role: str, route: str) -> AuditResult:
    console_errors: list[str] = []
    page_errors: list[str] = []
    failed_requests: list[str] = []
    bad_responses: list[str] = []
    audit_notes: list[str] = []

    def on_console(msg: Any) -> None:
        if msg.type == "error":
            if "Sentry Logger" in msg.text or "[PostHog.js]" in msg.text:
                return
            console_errors.append(msg.text)

    def on_page_error(err: Exception) -> None:
        if str(err).strip() == "Not supported":
            return
        page_errors.append(str(err))

    def on_request_failed(request: Any) -> None:
        if should_ignore_url(request.url):
            return
        failure = str(request.failure or "")
        if "ERR_ABORTED" in failure:
            return
        failed_requests.append(f"{request.method} {request.url} -> {failure}")

    def on_response(response: Any) -> None:
        if should_ignore_url(response.url):
            return
        if response.status >= 400:
            bad_responses.append(f"{response.status} {response.request.method} {response.url}")

    page.on("console", on_console)
    page.on("pageerror", on_page_error)
    page.on("requestfailed", on_request_failed)
    page.on("response", on_response)

    if route.startswith("/checkout/"):
        seed_demo_checkout(page)

    page.goto(f"{BASE_URL}{route}", wait_until="domcontentloaded")
    wait_for_app(page)

    heading = best_effort(lambda: page.locator("h1, h2").first.text_content(timeout=2000) or "", "", audit_notes, "heading")
    body_chars = best_effort(lambda: page.locator("body").text_content(timeout=2000) or "", "", audit_notes, "body")
    overflow = best_effort(
        lambda: page.evaluate(
            """() => {
                const root = document.documentElement;
                return root.scrollWidth > root.clientWidth + 4;
            }"""
        ),
        False,
        audit_notes,
        "overflow",
    )

    screenshot_name = f"{viewport_name}__{role}__{sanitize_route(route)}.png"
    screenshot_path = SCREENSHOT_DIR / screenshot_name
    best_effort(lambda: page.screenshot(path=str(screenshot_path), full_page=True), None, audit_notes, "screenshot")

    page.remove_listener("console", on_console)
    page.remove_listener("pageerror", on_page_error)
    page.remove_listener("requestfailed", on_request_failed)
    page.remove_listener("response", on_response)

    return AuditResult(
        viewport=viewport_name,
        role=role,
        route=route,
        final_url=page.url,
        title=best_effort(page.title, "", audit_notes, "title"),
        heading=heading.strip(),
        body_chars=len(body_chars.strip()),
        horizontal_overflow=bool(overflow),
        console_errors=console_errors,
        page_errors=page_errors + audit_notes,
        failed_requests=failed_requests,
        bad_responses=bad_responses,
        screenshot=str(screenshot_path.resolve()),
    )


def new_context(browser: Any, viewport: dict[str, Any]) -> BrowserContext:
    return browser.new_context(
        viewport={"width": viewport["width"], "height": viewport["height"]},
        is_mobile=viewport["is_mobile"],
        device_scale_factor=2 if viewport["is_mobile"] else 1,
    )


def run_viewport(browser: Any, viewport: dict[str, Any]) -> list[AuditResult]:
    results: list[AuditResult] = []

    public_context = new_context(browser, viewport)
    public_page = public_context.new_page()
    for route in PUBLIC_ROUTES:
        results.append(audit_route(public_page, viewport["name"], "guest", route))
    public_context.close()

    user_context = new_context(browser, viewport)
    seed_auth_context(user_context, "user")
    user_page = user_context.new_page()
    for route in USER_ROUTES:
        results.append(audit_route(user_page, viewport["name"], "user", route))
    user_context.close()

    admin_context = new_context(browser, viewport)
    seed_auth_context(admin_context, "admin")
    admin_page = admin_context.new_page()
    for route in ADMIN_ROUTES:
        results.append(audit_route(admin_page, viewport["name"], "admin", route))
    admin_context.close()

    staff_context = new_context(browser, viewport)
    seed_auth_context(staff_context, "staff")
    staff_page = staff_context.new_page()
    for route in STAFF_ROUTES:
        results.append(audit_route(staff_page, viewport["name"], "staff", route))
    staff_context.close()

    return results


def main() -> int:
    ensure_dirs()

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        try:
            results: list[AuditResult] = []
            for viewport in VIEWPORTS:
                results.extend(run_viewport(browser, viewport))
        finally:
            browser.close()

    payload = {
        "baseUrl": BASE_URL,
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "reportPath": str(REPORT_PATH.resolve()),
        "screenshotsDir": str(SCREENSHOT_DIR.resolve()),
        "totals": {
            "routes": len(results),
            "issueRoutes": sum(1 for item in results if item.issue_count > 0),
            "overflowRoutes": sum(1 for item in results if item.horizontal_overflow),
            "consoleErrors": sum(len(item.console_errors) for item in results),
            "pageErrors": sum(len(item.page_errors) for item in results),
            "failedRequests": sum(len(item.failed_requests) for item in results),
            "badResponses": sum(len(item.bad_responses) for item in results),
        },
        "results": [item.__dict__ | {"issue_count": item.issue_count} for item in results],
    }

    REPORT_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    print(f"Route sweep complete. Report: {REPORT_PATH.resolve()}")
    print(json.dumps(payload["totals"], indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
