import json
from datasets import load_dataset

url = "HeshamHaroon/arabic-quotes"

ds = load_dataset(url)

quotes = ds['train']



json_data = []
for item in quotes:
    text = item['quote']  # العمود يحتوي على الاقتباسات
    source = item['author']
    json_data.append({
        "text": text,
        "source": source,
        "length": len(text)
    })

with open("arabic_quotes.json", "w", encoding="utf-8") as f:
    json.dump(json_data, f, ensure_ascii=False, indent=2)

print("تم إنشاء arabic_quotes.json بنجاح!")
