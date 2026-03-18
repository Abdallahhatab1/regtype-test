import json
import os
import re
import requests
from pathlib import Path

# ========= إعدادات =========
FONTS_JSON = "fonts.json"
OUTPUT_DIR = Path("fonts")
GOOGLE_CSS_API = "https://fonts.googleapis.com/css2?family="

HEADERS = {
    "User-Agent": "Mozilla/5.0"
}

# ========= أدوات =========
def normalize(name: str) -> str:
    return re.sub(r"[^a-z0-9]", "", name.lower())

def font_to_api_name(name: str) -> str:
    return name.strip().replace(" ", "+")

def extract_font_urls(css_text: str):
    return re.findall(r"url\((https:[^)]+)\)", css_text)

def download_file(url, path):
    r = requests.get(url, headers=HEADERS, timeout=15)
    if r.status_code == 200:
        with open(path, "wb") as f:
            f.write(r.content)
        return True
    return False

# ========= منطق التحميل =========
def download_font(font_name, category):
    api_name = font_to_api_name(font_name)
    css_url = f"{GOOGLE_CSS_API}{api_name}&display=swap"

    try:
        css = requests.get(css_url, headers=HEADERS, timeout=15)
        if css.status_code != 200:
            raise Exception("CSS not found")

        urls = extract_font_urls(css.text)
        if not urls:
            raise Exception("No font files")

        font_dir = OUTPUT_DIR / category / normalize(font_name)
        font_dir.mkdir(parents=True, exist_ok=True)

        downloaded = 0
        for i, url in enumerate(urls):
            ext = url.split("?")[0].split(".")[-1]
            file_path = font_dir / f"{normalize(font_name)}_{i}.{ext}"
            if download_file(url, file_path):
                downloaded += 1

        if downloaded > 0:
            print(f"✅ {font_name} ({downloaded} ملفات)")
        else:
            print(f"⚠️ {font_name} — لم يتم تحميل ملفات")

    except Exception as e:
        print(f"⚠️ {font_name} — تم التخطي")

# ========= التشغيل =========
def main():
    if not os.path.exists(FONTS_JSON):
        print("❌ ملف fonts.json غير موجود")
        return

    with open(FONTS_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)

    OUTPUT_DIR.mkdir(exist_ok=True)

    for category, fonts in data.items():
        print(f"\n📁 القسم: {category}")
        for font in fonts:
            download_font(font, category)

    print("\n🎉 انتهى تحميل الخطوط")

if __name__ == "__main__":
    main()
