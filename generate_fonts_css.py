from pathlib import Path

FONTS_DIR = Path("fonts")
OUTPUT_CSS = Path("fonts.css")

SUPPORTED_EXTS = (".woff2", ".woff", ".ttf")

def prettify(name: str) -> str:
    return name.replace("-", " ").replace("_", " ").title()

def main():
    rules = []

    if not FONTS_DIR.exists():
        print("❌ مجلد fonts غير موجود")
        return

    for file in FONTS_DIR.rglob("*"):
        if not file.is_file():
            continue

        if file.suffix.lower() not in SUPPORTED_EXTS:
            continue

        # fonts/arabic/cairo/cairo_0.woff2
        parts = file.parts

        try:
            font_folder = parts[-2]  # cairo
        except IndexError:
            continue

        font_name = prettify(font_folder)

        rules.append(f"""
@font-face {{
  font-family: "{font_name}";
  src: url("{file.as_posix()}") format("{file.suffix[1:]}");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}}
""")

    if not rules:
        print("⚠️ لم يتم العثور على أي ملفات خطوط")
        return

    OUTPUT_CSS.write_text("\n".join(rules), encoding="utf-8")
    print(f"✅ تم توليد fonts.css ({len(rules)} خط)")

if __name__ == "__main__":
    main()
