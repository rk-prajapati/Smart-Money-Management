# 💰 SmartMoney — Source Code (Explained)

**Smart Money Management & Expense Tracking System**
Pure HTML + CSS + JavaScript — koi framework nahi, koi library nahi, koi internet nahi.
Data browser ke **localStorage** me save hota hai → 100% offline, 100% private.

---

## 📁 Folder Structure

```
smart-money-app/
├── index.html          → App ka structure (HTML skeleton — koi logic nahi)
├── css/
│   └── style.css       → Saara styling + light/dark theme variables
├── js/
│   ├── 01-config.js    → FIXED DATA: categories, colors, methods (43 lines)
│   ├── 02-storage.js   → localStorage database + data queries (64 lines)
│   ├── 03-utils.js     → Chhote helpers: ₹ format, dates (46 lines)
│   ├── 04-charts.js    → SVG graphs + illustrations (247 lines)
│   ├── 05-insights.js  → Smart insights engine (114 lines)
│   ├── 06-views.js     → Screens: Home/Stats/Plan/Settings (337 lines)
│   ├── 07-actions.js   → Add/edit txn, goals, budgets, export (252 lines)
│   └── 08-app.js       → State + events + init (210 lines)
├── build.py            → Sab files jodkar single-file app banata hai
└── README.md           → Ye file
```

**Workspace root me** `smart-money-manager.html` = build.py se bana hua
single-file version (wahi purana working app, 1 file me sab kuch).

---

## 🔢 Load Order (index.html me scripts isi order me load hote hain)

```
01-config → 02-storage → 03-utils → 04-charts → 05-insights → 06-views → 07-actions → 08-app
```

- **Config pehle** — categories/colors har jagah chahiye
- **App sabse last** — ye events bind karke init() chalata hai
- Beech ke files sirf **function definitions** hain (load pe kuch execute nahi hota)

---

## 🧠 App Flow — ek transaction ka safar

```
1. User ＋ dabata hai                    → 08-app.js  (event listener pakadta hai)
2. Keypad sheet khulti hai               → 07-actions.js (openTxnSheet)
3. Amount + category choose karke SAVE   → 07-actions.js (saveTxn)
4. Data localStorage me JSON ban ke save → 02-storage.js (saveDB)
5. Screen dobara render                  → 06-views.js (renderView)
6. Graphs naye data se bante hain        → 04-charts.js (lineChart, donutChart...)
7. Smart insights calculate hote hain    → 05-insights.js (computeInsights)
```

---

## 🗄️ localStorage — data kaise store hota hai (02-storage.js)

- **Key:** `smartpaisa_v1`
- **Format:** ek hi JSON object, poora app ka data

```json
{
  "txns": [
    { "id": "kx2...", "type": "expense", "amount": 250, "cat": "food",
      "note": "Swiggy", "date": "2026-09-26", "method": "upi", "ts": 1727300000000 }
  ],
  "budgets": { "overall": 32000, "cats": { "food": 6000, "shopping": 5000 } },
  "goals": [ { "id": "...", "emoji": "📱", "name": "New Phone", "target": 80000, "saved": 32000 } ],
  "settings": { "theme": "light" },
  "seenWelcome": true
}
```

- **Save:** har change ke baad `saveDB()` → `localStorage.setItem('smartpaisa_v1', JSON.stringify(db))`
- **Load:** page khulte hi `loadDB()` → `JSON.parse(...)` → `db` object me sab aa jata hai
- **Queries:** `txnsIn(30)` (30 din ka data), `sumBy()`, `dailyTotals()`, `aggByCat()` — ye sab bhi 02-storage.js me

---

## ▶️ Kaise Chalayein

| Tarika | Kaise |
|---|---|
| **Browser me (best)** | Ye folder download karo → `index.html` pe double-click — done! Internet ki zaroorat nahi |
| **Single file** | `smart-money-manager.html` (root me) — kahin bhi bhejo, wahi pura app |
| **Code change ke baad** | `python3 build.py` chalao → single-file version auto-regenerate |

⚠️ **Note:** Arena viewer ka preview sirf single-file version (`smart-money-manager.html`) dikhata hai —
preview sandbox external css/js files load nahi kar sakta. Browser me `index.html` perfectly chalta hai.

---

## 🛠️ Common Customizations (kya kahan badalna hai)

| Karna hai | File | Kahan |
|---|---|---|
| Naya category add | `js/01-config.js` | `CATS.expense` me ek line: `{id, name, icon, color}` |
| App colors change | `css/style.css` | `:root { --primary: ... }` (dark: `[data-theme=dark]`) |
| Budget warning limit (80%) | `js/05-insights.js` | `budgetAlerts()` me `pct>=80` |
| Transaction list cap (150) | `js/06-views.js` | `renderTxnListBox()` me `const cap=150` |
| Home ka chart (7 days) | `js/06-views.js` | `renderHome()` me `rangeDays(7)` |
| localStorage key | `js/02-storage.js` | `'smartpaisa_v1'` (2 jagah) |
| Demo data ka logic | `js/07-actions.js` | `seedDemo()` |

---

## ✅ Guarantee (kya split se kuch toota?)

Nahi. Script se verify kiya gaya hai:
- Saare **18 code-sections byte-identical** hain (sirf files me grouping alag hai)
- **Top-level execution order same** (26 statements, same sequence)
- Saari files ka **syntax check pass** (node --check)
- Built single-file = original app ka exact clone
