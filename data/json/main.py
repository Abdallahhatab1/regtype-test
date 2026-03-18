import json

file_path = "themes.json"

with open(file_path, "r", encoding="utf-8") as f:
    data = json.load(f)

for theme_type in ["dark", "light"]:
    if theme_type in data and isinstance(data[theme_type], list):
        new_section = {}

        for theme in data[theme_type]:
            theme_name = theme.get("name")
            if theme_name:
                new_section[theme_name] = theme

        data[theme_type] = new_section

with open(file_path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("✅ تم تحويل dark و light إلى object مع الاسم كمفتاح.")
