# MASAR مسار — Field Journey Companion

> A minimal, Arabic-first journey management app for Egyptian field sales reps.

---

## 🎯 Core Concept

**MASAR** = "Path" in Arabic. A focused app that helps sales reps plan, execute, and review daily field visits. Think of it as a smart travel companion that knows your territory.

**Philosophy**: The Map is the Canvas. Everything flows from location.

---

## 🎨 Design System

### Visual Identity
| Element | Value |
|---------|-------|
| Primary | `#4A90D9` (Calm Blue) |
| Success | `#34C759` (Visited Green) |
| Warning | `#F5A623` (Scheduled Orange) |
| Danger | `#FF3B30` (Overdue Red) |
| Neutral | `#8E8E93` (Gray) |
| Background | `#F8F9FA` |
| Cards | `#FFFFFF` with `shadow-sm` |

### Typography
- **Arabic**: Cairo font (Google Fonts)
- **English**: Inter
- RTL layout by default
- Direction: `rtl` on `<html>`

### Components Style
- Border radius: `12px` (cards), `8px` (buttons), `full` (chips)
- Shadows: Soft, minimal (`0 2px 8px rgba(0,0,0,0.08)`)
- Transitions: `200ms ease-out`
- Glass-morphism for overlays: `backdrop-blur-md bg-white/80`

### Design Soul
- **Warm & Friendly**: Speaks like a companion, not a tool
- **Calm Density**: Information-rich without overwhelm
- **Purposeful Animation**: Celebrate wins (confetti on journey complete)
- **Arabic-First**: Not translated — natively designed for Arabic

---

## 📱 App Structure (4 Main Views)

```
┌─────────────────────────────────┐
│  1. DATA    →  Order/Add Data   │
│  2. PLAN    →  Filter & Prepare │
│  3. JOURNEY →  Execute Route    │
│  4. HISTORY →  Review Visits    │
└─────────────────────────────────┘
```

**Navigation**: Bottom tab bar with 4 icons + Extended FAB for "Start Journey"

---

## 📄 Screen 1: DATA (طلب البيانات)

### Purpose
Order places data OR add places manually. Entry point for building your territory.

### Header
- Title: "مسار" with logo
- Right: Settings icon

### Main Content

**Section A — Available Data** (Collapsible)
Shows place types user already has data for:
```
┌──────────────────────────────────────┐
│ 💊 صيدليات     │ 📍 187 مكان        │
│ 🍽️ مطاعم      │ 📍 45 مكان         │
│ ➕ طلب نوع جديد                      │
└──────────────────────────────────────┘
```

**Section B — Order New Data**
1. **Place Type Selector** (Grid of common types + custom input)
   - 💊 Pharmacies, 🏪 Supermarkets, 🍞 Bakeries
   - 🏥 Clinics, ☕ Cafes, 🍽️ Restaurants
   - Custom: Text input with icon picker

2. **Location Selector**
   - **Governorate** dropdown (multi-select enabled)
   - **Cities/Districts** chips (multi-select, depends on governorate)
   - "Select All" / "Clear" actions

3. **Preview Card**
   ```
   ┌────────────────────────────────────┐
   │ 📊 البيانات المتوقعة              │
   │ ~180-220 صيدلية                   │
   │ 📞 ~40% بأرقام تليفون             │
   │ ⭐ ~76% بتقييمات                  │
   └────────────────────────────────────┘
   ```

4. **CTA Button**: `[📥 طلب البيانات]` (Primary, full-width)

### Empty State
```
┌────────────────────────────────────────┐
│      [Illustration: Map + Pins]        │
│                                        │
│   ابدأ رحلتك! 🚀                       │
│   اطلب بيانات الأماكن اللي بتشتغل    │
│   معاها عشان تجهز رحلاتك              │
│                                        │
│   [💊 طلب بيانات صيدليات]             │
└────────────────────────────────────────┘
```

---

## 📄 Screen 2: PLAN (تجهيز الرحلة)

### Purpose
Filter and select places for today's journey. The "preparation room" before execution.

### Header
- Back arrow (if coming from Data)
- Title: "تجهيز الرحلة"
- Right: Map/List toggle

### Filters Bar (Horizontal scroll chips)
```
[الكل] [جديد 🔵] [تمت الزيارة 🟢] [مؤجل 🟡] [مهم ⭐]
```

### Location Filter (Dropdown bar)
```
المحافظة: [الشرقية ▼]  المدينة: [الزقازيق ▼]
```

### Map View (Primary)
- Full-screen map with markers
- Marker colors match status:
  - 🔵 Blue: New (never visited)
  - 🟢 Green: Visited
  - 🟡 Orange: Postponed
  - ⭐ Gold outline: Important
- User location pulsing dot
- Tap marker → Mini card popup

### Mini Card (On marker tap)
```
┌────────────────────────────────────┐
│ 💊 صيدلية الشفاء          ⭐ 4.3  │
│ 📍 شارع الجلاء، الزقازيق          │
│ 📞 055-123-4567                   │
│ [➕ أضف للرحلة] [📝 ملاحظة]       │
└────────────────────────────────────┘
```

### Bottom Sheet (Swipe up)
- Shows selected places count: "12 مكان محدد للرحلة"
- List of selected places (reorderable)
- Radius filter slider: "المسافة: 5 كم"
- Remove button per place (swipe or X)

### Actions
- **Add Manual Place**: FAB with ➕ icon → Opens add form
- **Extended FAB**: `[🚀 ابدأ الرحلة]` (Bottom right, prominent)

### List View (Secondary)
Standard list with place cards:
```
┌────────────────────────────────────────┐
│ 🔵 │ صيدلية الشفاء           ⭐ 4.3   │
│    │ 📍 الزقازيق • 1.2 كم             │
│    │ 📞 055-123-4567                   │
│    │ 🏷️ جديد • لم تتم الزيارة         │
│    │                           [→]    │
└────────────────────────────────────────┘
```

---

## 📄 Screen 3: JOURNEY (وضع الرحلة)

### Purpose
Active navigation mode. Guides rep through optimized route with check-in at each stop.

### Triggered By
"Start Journey" FAB → Takes current location → Calculates optimal route

### Layout

**Top Section (40%)**: Map with route
- Animated route line connecting places
- Current location prominent
- Next destination highlighted
- Progress: `📍───📍───📍───📍`

**Bottom Section (60%)**: Current target card

```
┌──────────────────────────────────────────┐
│  المحطة 2 من 8                   [تخطي →] │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ 💊 صيدلية النور                    │  │
│  │                                    │  │
│  │ 📍 شارع الملك فيصل، الزقازيق       │  │
│  │ 📞 055-123-4567  📱 WhatsApp       │  │
│  │ ⭐ 4.1  •  🔵 زيارة أولى           │  │
│  │                                    │  │
│  │ 📏 1.2 كم  •  🚗 ~5 دقائق          │  │
│  │                                    │  │
│  │ [🗺️ افتح في خرائط جوجل]           │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                          │
│  🏁 وصلت؟                                │
│                                          │
│  ┌────────┬────────┬────────┬────────┐   │
│  │   ✅   │   🗓️   │   🚫   │   ❌   │   │
│  │ تمت   │ تأجيل  │ مغلق  │ غير   │   │
│  │الزيارة │        │       │ موجود │   │
│  └────────┴────────┴────────┴────────┘   │
│                                          │
└──────────────────────────────────────────┘
```

### Check-in Flow (Modal)

**On "✅ تمت الزيارة" tap:**
```
┌──────────────────────────────────────────┐
│ ✅ تسجيل زيارة: صيدلية النور       [✕]   │
├──────────────────────────────────────────┤
│                                          │
│  📝 ملاحظات الزيارة                      │
│  ┌────────────────────────────────────┐  │
│  │ اكتب ملاحظاتك هنا...               │  │
│  │ مثال: "باع 20 علبة باندول"         │  │
│  │                                    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  النتيجة:                                │
│  [تم البيع ✓] [مهتم] [غير مهتم] [أخرى]   │
│                                          │
│  ⭐ تقييم الزيارة (اختياري)              │
│  ☆ ☆ ☆ ☆ ☆                              │
│                                          │
│         [✅ حفظ والمتابعة]               │
│                                          │
└──────────────────────────────────────────┘
```

**On "🗓️ تأجيل" tap:**
- Date picker → Returns place to list with "postponed" status
- Optional: Add reason note

**On "🚫 مغلق" or "❌ غير موجود" tap:**
- Confirmation dialog
- Marks place appropriately
- Moves to next stop

### Journey Complete Screen
```
┌──────────────────────────────────────────┐
│                                          │
│               🎉 🎉 🎉                    │
│                                          │
│          أحسنت! خلصت الرحلة              │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ ✅ 6 زيارات ناجحة                  │  │
│  │ 🗓️ 2 مؤجلين                        │  │
│  │ 🚫 0 مغلق                          │  │
│  │ ⏱️ الوقت: 3 ساعات 20 دقيقة         │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [📋 شوف التفاصيل]  [🏠 الرئيسية]       │
│                                          │
└──────────────────────────────────────────┘
```

---

## 📄 Screen 4: HISTORY (السجل)

### Purpose
Review past visits, notes, and daily performance. The "memory" of your work.

### Header
- Title: "السجل"
- Right: Date filter / Calendar icon

### Date Picker Bar
```
[◀️] اليوم: الأربعاء 10 ديسمبر [▶️]
```

### Daily Summary Card
```
┌────────────────────────────────────────────┐
│ 📊 ملخص اليوم                              │
│                                            │
│ ✅ 8 زيارات  │ 🗓️ 2 مؤجل  │ ⏱️ 4:30 ساعة  │
└────────────────────────────────────────────┘
```

### Visits List
```
┌────────────────────────────────────────────┐
│ 10:30 ص │ ✅ صيدلية الشفاء                 │
│         │ 📝 "باع 20 باندول، مهتم بعرض..." │
│         │ ⭐⭐⭐⭐☆                          │
├─────────────────────────────────────────────│
│ 11:15 ص │ 🗓️ صيدلية النور                  │
│         │ 📝 "مؤجل - صاحبها مش موجود"      │
├─────────────────────────────────────────────│
│ 12:00 م │ ✅ صيدلية الأمل                  │
│         │ 📝 "تم البيع - طلب زيارة الأسبوع.." │
│         │ ⭐⭐⭐⭐⭐                          │
└────────────────────────────────────────────┘
```

### Place Detail (On tap)
Opens modal with full visit history for that place:
- All visits with dates
- All notes
- Contact info (phone, website, social)
- Rating trend
- Quick actions: Call, WhatsApp, Navigate, Add to next journey

---

## 📄 Add Place Modal

### Purpose
Manually add a new place to the database.

### Form Fields
```
┌────────────────────────────────────────────┐
│ ➕ إضافة مكان جديد                    [✕]  │
├────────────────────────────────────────────┤
│                                            │
│ اسم المكان *                               │
│ ┌────────────────────────────────────────┐ │
│ │                                        │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ نوع المكان *                               │
│ [💊 صيدلية ▼]                              │
│                                            │
│ المحافظة *            المدينة *            │
│ [الشرقية ▼]           [الزقازيق ▼]         │
│                                            │
│ العنوان (اختياري)                          │
│ ┌────────────────────────────────────────┐ │
│ │                                        │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ 📍 تحديد الموقع على الخريطة               │
│ [اضغط لاختيار الموقع]                      │
│                                            │
│ رقم التليفون (اختياري)                     │
│ ┌────────────────────────────────────────┐ │
│ │                                        │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ ملاحظات (اختياري)                          │
│ ┌────────────────────────────────────────┐ │
│ │                                        │ │
│ │                                        │ │
│ └────────────────────────────────────────┘ │
│                                            │
│            [💾 حفظ المكان]                 │
│                                            │
└────────────────────────────────────────────┘
```

---

## 🗂️ Data Model (Simplified)

### Place
```typescript
{
  id: string
  name: string
  type: 'pharmacy' | 'restaurant' | 'cafe' | ...
  governorate: string
  city: string
  address?: string
  lat?: number
  lng?: number
  phone?: string
  website?: string
  facebook?: string
  rating?: number
  ratingCount?: number
  status: 'new' | 'visited' | 'postponed' | 'closed' | 'not_found'
  isImportant: boolean
  createdAt: Date
}
```

### Visit
```typescript
{
  id: string
  placeId: string
  date: Date
  checkInTime: Date
  outcome: 'visited' | 'postponed' | 'closed' | 'not_found'
  notes?: string
  rating?: 1-5
  soldItems?: string
}
```

### Journey
```typescript
{
  id: string
  date: Date
  startTime: Date
  endTime?: Date
  places: string[] // placeIds in order
  status: 'planning' | 'active' | 'completed'
}
```

---

## 🔧 Technical Notes

### Map Integration
- Use Mapbox GL or Google Maps
- Arabic labels preferred
- Route optimization: Nearest neighbor algorithm for simple MVP

### Offline Consideration
- Cache visited places
- Queue check-ins when offline
- Sync when back online

### Arabic Support
- RTL throughout
- Cairo font from Google Fonts
- Egyptian Arabic for UI copy

### Key Animations
- Marker bounce on select
- Route line drawing animation
- Confetti on journey complete
- Smooth sheet transitions

---

## 💡 UX Principles

1. **One Action Per Screen**: Don't overwhelm. Clear primary action always visible.

2. **Map First**: The map is the hero. Lists are secondary.

3. **Quick Check-in**: Under 10 seconds to log a visit.

4. **Forgiving**: Easy to undo, edit, or reschedule.

5. **Celebratory**: Acknowledge completions warmly.

6. **Arabic Soul**: Not translated English — genuinely Arabic UX patterns.

---

## 🚀 MVP Scope

### Must Have (P0)
- [ ] Order data by type/location
- [ ] View places on map
- [ ] Filter by status
- [ ] Start journey with route
- [ ] Check-in with notes
- [ ] View daily history

### Should Have (P1)
- [ ] Add places manually
- [ ] Edit place details
- [ ] WhatsApp integration
- [ ] Export daily report

### Nice to Have (P2)
- [ ] Offline mode
- [ ] Analytics dashboard
- [ ] Team features

---

## 📝 Sample Arabic UI Copy

| Context | Arabic | Transliteration |
|---------|--------|-----------------|
| App name | مسار | Masar |
| Start journey | ابدأ الرحلة | Ibda' el-rehla |
| Visited | تمت الزيارة | Tammet el-zyara |
| Postpone | تأجيل | Ta'geel |
| Closed | مغلق | Moghlag |
| Not found | غير موجود | Gher mawgood |
| Notes | ملاحظات | Molahazat |
| Save | حفظ | Hefz |
| History | السجل | El-Segell |
| Today | اليوم | El-Yom |
| Well done! | أحسنت! | Ahsant! |

---

**Built with 💙 for Egyptian field reps. Yalla نشتغل!**
