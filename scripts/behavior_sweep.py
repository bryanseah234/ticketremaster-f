from __future__ import annotations

import json
import time
from pathlib import Path

from playwright.sync_api import Page, expect, sync_playwright


BASE_URL = "http://127.0.0.1:3000"
NOW = time.strftime("%Y%m%d-%H%M%S")
RUN_DIR = Path("qa-artifacts") / "behavior-sweep" / NOW
SCREENSHOT_DIR = RUN_DIR / "screenshots"
REPORT_PATH = RUN_DIR / "report.json"


def ensure_dirs() -> None:
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)


def wait_for_app(page: Page) -> None:
    page.wait_for_load_state("domcontentloaded")
    try:
        page.wait_for_load_state("networkidle", timeout=4000)
    except Exception:
        page.wait_for_timeout(600)
    else:
        page.wait_for_timeout(200)


def screenshot(page: Page, name: str) -> str:
    path = SCREENSHOT_DIR / f"{name}.png"
    page.screenshot(path=str(path), full_page=True)
    return str(path.resolve())


def login_demo(page: Page, label: str, url_fragment: str) -> None:
    page.goto(f"{BASE_URL}/demo-login")
    wait_for_app(page)
    page.locator("button.persona-card").filter(has_text=label).first.click()
    page.wait_for_url(lambda url: url_fragment in url)
    wait_for_app(page)


def run_guest_flow(page: Page) -> list[dict]:
    results = []

    page.goto(BASE_URL)
    wait_for_app(page)
    expect(page.locator("h1")).to_contain_text("Sell, Buy, Enjoy")
    page.locator('input[placeholder*="Search"]').fill("Taylor")
    page.locator('button[type="submit"]:has-text("Find Tickets")').click()
    page.wait_for_url("**/events?search=Taylor")
    wait_for_app(page)
    expect(page.locator("h1")).to_contain_text("Curated")
    results.append({
        "flow": "guest-search",
        "status": "passed",
        "url": page.url,
        "screenshot": screenshot(page, "guest-search"),
    })

    page.goto(f"{BASE_URL}/events/demo-event-001")
    wait_for_app(page)
    expect(page.locator("h1")).to_contain_text("Taylor Swift")
    results.append({
        "flow": "guest-event-detail",
        "status": "passed",
        "url": page.url,
        "screenshot": screenshot(page, "guest-event-detail"),
    })

    return results


def run_user_flow(page: Page) -> list[dict]:
    results = []
    login_demo(page, "Demo User", "/events")

    expect(page.locator(".events-page")).to_be_visible()
    results.append({
        "flow": "user-login",
        "status": "passed",
        "url": page.url,
        "screenshot": screenshot(page, "user-login"),
    })

    page.goto(f"{BASE_URL}/events/demo-event-001/seats")
    wait_for_app(page)
    expect(page.locator(".seat-page")).to_be_visible()
    page.locator("button.seat-tile.available").first.click()
    page.get_by_role("button", name="Reserve Seat").click()
    expect(page.get_by_role("button", name="Checkout Now")).to_be_visible()
    results.append({
        "flow": "user-seat-reserve",
        "status": "passed",
        "url": page.url,
        "screenshot": screenshot(page, "user-seat-reserve"),
    })

    page.get_by_role("button", name="Checkout Now").click()
    page.wait_for_url("**/checkout/**")
    wait_for_app(page)
    expect(page.locator(".checkout-page")).to_be_visible()
    page.get_by_role("button", name="Confirm Purchase").click()
    wait_for_app(page)
    expect(page.locator(".success-shell")).to_be_visible()
    results.append({
        "flow": "user-checkout",
        "status": "passed",
        "url": page.url,
        "screenshot": screenshot(page, "user-checkout"),
    })

    page.goto(f"{BASE_URL}/tickets")
    wait_for_app(page)
    expect(page.locator("body")).to_contain_text("My Tickets")
    results.append({
        "flow": "user-tickets",
        "status": "passed",
        "url": page.url,
        "screenshot": screenshot(page, "user-tickets"),
    })

    page.goto(f"{BASE_URL}/marketplace")
    wait_for_app(page)
    expect(page.locator(".marketplace-page h1")).to_contain_text("Authentic")
    page.goto(f"{BASE_URL}/transfer/initiate?listingId=demo-listing-001")
    wait_for_app(page)
    expect(page.locator("body")).to_contain_text("Transfer")
    page.locator('input[placeholder*="lst_001"]').fill("demo-listing-001")
    page.get_by_role("button", name="Continue").click()
    page.wait_for_url("**/transfer/demo-transfer-001")
    wait_for_app(page)
    expect(page.locator(".transfer-page")).to_be_visible()
    results.append({
        "flow": "user-transfer",
        "status": "passed",
        "url": page.url,
        "screenshot": screenshot(page, "user-transfer"),
    })

    page.goto(f"{BASE_URL}/profile")
    wait_for_app(page)
    expect(page.locator(".profile-page")).to_be_visible()
    expect(page.locator('input[name="email"]')).to_have_value("demo@ticketremaster.com")
    results.append({
        "flow": "user-profile",
        "status": "passed",
        "url": page.url,
        "screenshot": screenshot(page, "user-profile"),
    })

    return results


def run_admin_flow(page: Page) -> list[dict]:
    results = []
    login_demo(page, "Demo Admin", "/admin/events")

    expect(page.locator(".admin-page")).to_be_visible()
    page.locator('input[placeholder="Neon Skyline Festival"]').fill("QA Sunset Session")
    page.locator('textarea').fill("Behavior sweep event creation check.")
    page.locator('select').nth(1).select_option("demo-venue-001")
    page.get_by_role("button", name="Create Event").click()
    wait_for_app(page)
    expect(page.locator("body")).to_contain_text("Created")
    results.append({
        "flow": "admin-create-event",
        "status": "passed",
        "url": page.url,
        "screenshot": screenshot(page, "admin-create-event"),
    })

    page.goto(f"{BASE_URL}/admin/users")
    wait_for_app(page)
    expect(page.locator(".admin-users-page")).to_be_visible()
    page.locator('input[placeholder*="Email"]').fill("demo")
    page.locator('input[placeholder*="Email"]').press("Enter")
    wait_for_app(page)
    expect(page.locator(".user-card").first).to_be_visible()
    results.append({
        "flow": "admin-users",
        "status": "passed",
        "url": page.url,
        "screenshot": screenshot(page, "admin-users"),
    })

    return results


def run_staff_flow(page: Page) -> list[dict]:
    results = []
    login_demo(page, "Demo Staff", "/staff/scan")

    expect(page.locator(".scanner-page")).to_be_visible()
    page.locator('input[placeholder="Ticket ID"]').fill("demo-ticket-001")
    page.get_by_role("button", name="Verify").click()
    wait_for_app(page)
    expect(page.locator(".history-item").first).to_be_visible()
    results.append({
        "flow": "staff-manual-verify",
        "status": "passed",
        "url": page.url,
        "screenshot": screenshot(page, "staff-manual-verify"),
    })

    return results


def main() -> int:
    ensure_dirs()
    report: dict[str, object] = {
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "baseUrl": BASE_URL,
        "results": [],
    }

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        try:
            page = browser.new_page(viewport={"width": 1440, "height": 1200})
            for runner in (run_guest_flow, run_user_flow, run_admin_flow, run_staff_flow):
                report["results"].extend(runner(page))
        finally:
            browser.close()

    results = report["results"]
    report["summary"] = {
        "flows": len(results),
        "passed": sum(1 for item in results if item["status"] == "passed"),
        "failed": sum(1 for item in results if item["status"] != "passed"),
        "reportPath": str(REPORT_PATH.resolve()),
        "screenshotsDir": str(SCREENSHOT_DIR.resolve()),
    }

    REPORT_PATH.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report["summary"], indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
