from playwright.sync_api import sync_playwright

def check():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        response = page.goto("https://forum.majestic-rp.ru/forums/zakonodatel-naya-baza.1338/")
        print(f"Status: {response.status}")
        page.screenshot(path="check_404.png")
        browser.close()

if __name__ == "__main__":
    check()
