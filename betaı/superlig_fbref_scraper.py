import json

with open("fotmob_raw.json", encoding="utf-8") as f:
    data = json.load(f)

matches = data["fixtures"]["allMatches"]
print(f"Toplam maç: {len(matches)}")

# Tamamlanmış ilk maçı bul
for m in matches:
    status = m.get("status", {})
    if status.get("finished") or status.get("reasonCode") == 0:
        print("\n=== BİTEN İLK MAÇ ===")
        print(json.dumps(m, ensure_ascii=False, indent=2))
        break