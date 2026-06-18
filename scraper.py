from playwright.sync_api import sync_playwright
import time
import json
import datetime
import re

import sys
import subprocess

def install_playwright():
    print("Установка необходимых браузеров для Playwright...")
    try:
        subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"], check=True)
        return True
    except Exception as e:
        print(f"Ошибка при автоматической установке браузеров: {e}")
        return False

def scrape():
    with sync_playwright() as p:
        try:
            browser = p.chromium.launch(headless=True)
        except Exception as e:
            if "Executable doesn't exist" in str(e) or "playwright install" in str(e).lower():
                print("Браузер не найден.")
                if install_playwright():
                    try:
                        browser = p.chromium.launch(headless=True)
                    except Exception as e2:
                        print(f"Не удалось запустить браузер даже после установки: {e2}")
                        print("\nПОЖАЛУЙСТА, ВЫПОЛНИТЕ В КОНСОЛИ: playwright install chromium")
                        return
                else:
                    print("\nПОЖАЛУЙСТА, ВЫПОЛНИТЕ В КОНСОЛИ: playwright install chromium")
                    return
            else:
                raise e
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        # Portland Legislation Base
        base_url = "https://forum.majestic-rp.ru/forums/zakonodatel-naya-baza.1338/"
        print(f"Visiting {base_url}...")

        # Increased timeout and wait for selector to bypass DDoS protection
        page.goto(base_url, wait_until="load", timeout=60000)

        print("Waiting for DDoS protection to pass...")
        # Sometimes the page reloads or uses a challenge
        try:
            page.wait_for_selector("a[data-tp-primary='on']", timeout=30000)
        except:
            print("Selector not found. Moving mouse to simulate activity...")
            page.mouse.move(100, 100)
            time.sleep(5)
            page.mouse.move(200, 200)
            time.sleep(5)
            if page.query_selector("text=Verify you are human"):
                print("Manual verification might be needed on first run in headful mode.")
            page.wait_for_load_state("networkidle")

        # Find all pages if pagination exists, but usually one page is enough for first look
        # Get all thread links
        threads = page.query_selector_all("a[data-tp-primary='on']")
        law_links = []
        for thread in threads:
            title = thread.inner_text().strip()
            href = thread.get_attribute("href")
            law_links.append({"title": title, "url": f"https://forum.majestic-rp.ru{href}"})

        print(f"Found {len(law_links)} law threads.")

        all_laws = []
        for law in law_links:
            print(f"Scraping {law['title']}...")
            try:
                page.goto(law['url'], wait_until="networkidle")
                time.sleep(2)

                # The first post usually contains the law
                first_post = page.query_selector(".message-inner")
                if first_post:
                    content_element = first_post.query_selector(".bbWrapper")
                    if content_element:
                        content = content_element.inner_text()

                        # Determine category
                        category = "Other"
                        title_upper = law['title'].upper()
                        if "УГОЛОВНЫЙ КОДЕКС" in title_upper or "УК" in title_upper:
                            category = "УК"
                        elif "ПРОЦЕССУАЛЬНЫЙ КОДЕКС" in title_upper or "ПК" in title_upper:
                            category = "ПК"
                        elif "ДОРОЖНЫЙ КОДЕКС" in title_upper or "ДК" in title_upper:
                            category = "ДК"
                        elif "АДМИНИСТРАТИВНЫЙ" in title_upper or "АК" in title_upper:
                            category = "АК"
                        elif "КОНСТИТУЦИЯ" in title_upper:
                            category = "Конституция"
                        elif "ЭТИЧЕСКИЙ" in title_upper:
                            category = "ЭК"
                        elif "ТРУДОВОЙ" in title_upper:
                            category = "ТК"

                        all_laws.append({
                            "title": law['title'],
                            "category": category,
                            "content": content,
                            "url": law['url'],
                            "scraped_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        })
            except Exception as e:
                print(f"Failed to scrape {law['title']}: {e}")

        data = {
            "last_updated": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "laws": all_laws
        }

        with open("laws.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"Successfully saved {len(all_laws)} laws to laws.json")
        browser.close()

if __name__ == "__main__":
    scrape()
