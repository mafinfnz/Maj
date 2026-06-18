from playwright.sync_api import sync_playwright
import time
import json
import datetime
import re

def scrape():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        # Portland Legislation Base
        base_url = "https://forum.majestic-rp.ru/forums/zakonodatel-naya-baza.1338/"
        print(f"Visiting {base_url}...")
        page.goto(base_url, wait_until="networkidle")
        time.sleep(5)

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
