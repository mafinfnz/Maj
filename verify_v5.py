from playwright.sync_api import sync_playwright, expect
import time

def verify_electron_style():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # We simulate the electron window by setting a viewport
        page = browser.new_page(viewport={'width': 1200, 'height': 900})

        try:
            # Wait for dev server
            max_retries = 30
            for i in range(max_retries):
                try:
                    page.goto("http://localhost:3000")
                    break
                except:
                    if i == max_retries - 1: raise
                    time.sleep(2)

            # Wait for content
            page.wait_for_selector("h1", timeout=10000)

            # Verify "SF Pro Display" and Black weight (we can't easily check actual font file, but we check computed style)
            font_weight = page.evaluate("window.getComputedStyle(document.querySelector('h1')).fontWeight")
            print(f"H1 Font Weight: {font_weight}")

            # Verify Dark Mode / Background
            # Toggle dark mode if needed
            body_bg = page.evaluate("window.getComputedStyle(document.body).backgroundColor")
            print(f"Body BG: {body_bg}")

            # Take screenshots of the requested features
            # 1. Main View (Dark Mode)
            page.screenshot(path="verify_electron_dark.png")

            # 2. Search for 17.1
            search_input = page.get_by_placeholder("Поиск по названию или содержанию...")
            search_input.fill("17.1")
            time.sleep(1) # wait for filtering
            page.screenshot(path="verify_search_17_1.png")

            # 3. Category Click
            page.get_by_role("button", name="УК", exact=True).click()
            time.sleep(1)
            page.screenshot(path="verify_category_uk.png")

        finally:
            browser.close()

if __name__ == "__main__":
    verify_electron_style()
