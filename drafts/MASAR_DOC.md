# MASAR مسار — Field Journey Companion

> A minimal, Arabic-first journey management app for Egyptian field sales reps.

---

## 🎯 Core Concept

**MASAR** = "Path" in Arabic. A focused app that helps sales reps plan, execute, and review daily field visits. Think of it as a smart travel companion that knows your territory.

**Philosophy**: The Map is the Canvas. Everything flows from location.

---

## 🛠️ Tech Stack

### Framework & Language
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI (shadcn/ui)
- **Animations**: Framer Motion
- **Maps**: Leaflet (via React-Leaflet)
- **State Management**: React Hooks (useState, useMemo, useEffect)
- **Forms**: React Hook Form + Zod (via shadcn/ui)
- **Theme**: next-themes (Light/Dark mode support)
- **Date Handling**: date-fns with Arabic locale

### Project Structure
```
src/
├── app/              # Next.js app router pages
│   ├── layout.tsx   # Root layout with Cairo font & RTL
│   ├── page.tsx     # Main app component with tab navigation
│   └── globals.css  # Global styles & theme variables
├── components/       # React components
│   ├── screens/     # Main screen components
│   │   ├── DataScreen.tsx
│   │   ├── PlanScreen.tsx
│   │   ├── JourneyScreen.tsx
│   │   └── HistoryScreen.tsx
│   ├── ui/          # Reusable UI components (shadcn/ui)
│   └── [other components]
├── lib/             # Utilities and types
│   ├── types.ts     # TypeScript type definitions
│   ├── store.ts     # Mock data & helper functions
│   └── constants.ts # App constants
└── hooks/           # Custom React hooks
```

---

## 🎨 Design System

### Visual Identity
| Element | Value | CSS Variable |
|---------|-------|--------------|
| Primary | `#4A90D9` (Calm Blue) | `--primary`, `--masar-blue` |
| Success | `#34C759` (Visited Green) | `--masar-green` |
| Warning | `#F5A623` (Scheduled Orange) | `--masar-orange` |
| Danger | `#FF3B30` (Overdue Red) | `--destructive`, `--masar-red` |
| Neutral | `#8E8E93` (Gray) | `--muted-foreground`, `--masar-gray` |
| Background | `#F8F9FA` | `--background` |
| Cards | `#FFFFFF` | `--card` |
| Dark Mode | Supported via `next-themes` | `.dark` class |

### Typography
- **Arabic**: Cairo font (Google Fonts) - weights: 300, 400, 500, 600, 700, 800
- **Font Variable**: `--font-cairo`
- **RTL Layout**: `dir="rtl"` on `<html>` tag
- **Font Family**: Applied via `font-[Cairo]` class

### Components Style
- **Border Radius**: 
  - Cards: `12px` (`rounded-2xl`)
  - Buttons: `8px` (`rounded-xl`) to `full` (rounded-full)
  - Inputs: `12px` (`rounded-xl`)
- **Shadows**: 
  - Soft: `shadow-soft` (custom utility)
  - Elevated: `shadow-elevated` (for floating elements)
- **Transitions**: `200ms ease-out` (via Tailwind `transition-all`)
- **Glass-morphism**: `glass` class with `backdrop-blur-md bg-white/80 dark:bg-card/80`
- **Gradients**: 
  - Primary: `gradient-primary` (blue gradient)
  - Success: `gradient-success` (green gradient)

### Design Soul
- **Warm & Friendly**: Speaks like a companion, not a tool
- **Calm Density**: Information-rich without overwhelm
- **Purposeful Animation**: Smooth transitions, hover effects, and micro-interactions via Framer Motion
- **Arabic-First**: Not translated — natively designed for Arabic
- **Dark Mode**: Full dark mode support with theme switching

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

### Navigation Structure
- **Bottom Navigation Bar**: Fixed bottom tab bar with 4 tabs
  - Icons: Database (البيانات), MapPin (التجهيز), Navigation (الرحلة), History (السجل)
  - Active tab indicator with animated background
  - Tab labels below icons
- **Start Journey Button**: Floating button above bottom nav (when applicable)
  - Shows when: Not on Data tab, and (not on Plan tab OR on Plan map view)
  - Disabled when: No places selected
- **Selected Places Button**: Shows count badge when places are selected
  - Opens bottom sheet with selected places list
- **Theme Toggle**: Sun/Moon icon in Data screen header

### State Management
- Main app state managed in `page.tsx`:
  - `activeTab`: Current tab ('data' | 'plan' | 'journey' | 'history')
  - `places`: Array of all places
  - `visits`: Array of all visits
  - `selectedPlaces`: Places selected for journey
  - `userLocation`: Current GPS location
  - `isJourneyActive`: Whether journey is currently active
  - `journeyIndex`: Current place index in journey

---

## 📄 Screen 1: DATA (طلب البيانات)

### Purpose
Order places data OR add places manually. Entry point for building your territory.

### Implementation
**Component**: `DataScreen.tsx`  
**Location**: `src/components/screens/DataScreen.tsx`

### Header
- **Left**: Theme toggle button (Sun/Moon icon) + "مسار" title with "طلب البيانات" subtitle
- **Right**: Empty (no settings icon currently)

### Main Content Structure

**Section A — Orders Section** (Collapsible, shows when orders exist)
- Header with Rocket icon and completion badge
- Shows pending orders with expandable details
- Each order shows:
  - Place type icon and name
  - Status badge (قيد الانتظار / قيد المعالجة / مكتمل)
  - Governorates and cities grouped by governorate
  - Delete city functionality (with confirmation dialog)
- Expandable to show full order details

**Section B — Available Data** (Collapsible)
Shows place types user already has data for:
- Each item displays:
  - Place type icon (💊 صيدلية, 🍽️ مطعم, etc.)
  - Place type label
  - Count of places
  - "Add to Map" button (Map icon) - navigates to Plan screen with filters applied
- "Request New Type" button at bottom
- Clicking an item auto-fills the order form below

**Section C — Order New Data** (Collapsible)
1. **Place Name Input**
   - Text input with Tag icon
   - Auto-filled when selecting from available data or place type

2. **Place Type Selector** (Grid layout, 3 columns)
   - Available types: صيدلية, ماركت, ملابس, كافيه, مطعم, أخرى
   - Each type shows icon and label
   - Selecting type auto-fills place name (except "أخرى")
   - Visual selection state with border and background

3. **Location Selectors**
   - **Governorate Popover**:
     - Multi-select with checkboxes
     - Search functionality
     - Shows selected count or single name
   - **City Popover**:
     - Depends on selected governorates
     - Multi-select with checkboxes
     - Grouped by governorate
     - "Select All" / "Clear All" per governorate
     - Shows "متوفر" badge for cities with existing data
     - Cities with data are locked (can't be unchecked)

4. **Summary Card** (Shows when selections made)
   - Groups cities by governorate
   - Shows chips for each city
   - Green badge for cities with available data
   - Remove buttons for each city/governorate

5. **Preview Card** (Shows when type and locations selected)
   ```
   ┌────────────────────────────────────┐
   │ 📊 البيانات المتوقعة              │
   │ ~180-220 مكان                     │
   │ 📞 ~40% بأرقام                    │
   │ ⭐ ~76% بتقييمات                  │
   └────────────────────────────────────┘
   ```

6. **CTA Button**: `[📥 طلب البيانات]` 
   - Primary gradient button
   - Disabled until: place name, type, governorates, and cities are selected
   - Creates/updates order (merges if same type exists)
   - Resets form after submission

### Empty State
Shows when `availableData.length === 0`:
- Large MapPin icon in muted circle
- "ابدأ رحلتك! 🚀" heading
- Description text
- CTA button: "طلب بيانات صيدليات"

### Key Features
- **Order Management**: Orders persist in component state
- **Smart Merging**: Orders with same place type merge cities/governorates
- **City Deletion**: Can delete cities from orders (with confirmation)
- **Data Integration**: Clicking available data auto-fills form
- **Theme Support**: Dark/light mode toggle

---

## 📄 Screen 2: PLAN (تجهيز الرحلة)

### Purpose
Filter and select places for today's journey. The "preparation room" before execution.

### Implementation
**Component**: `PlanScreen.tsx`  
**Location**: `src/components/screens/PlanScreen.tsx`  
**Map Component**: `MapView.tsx` (dynamically imported)

### View Modes
Two view modes with toggle:
- **Map View** (Primary): Full-screen interactive map
- **List View** (Secondary): Scrollable list of place cards

### Header (List View Only)
- **Left**: Calendar icon + "تجهيز الرحلة" title
- **Right**: Map icon button (switches to map view)

### Status Filters Bar (Horizontal scroll chips)
Located at top of both views:
```
[الكل (count)] [جديد 🔵 (count)] [تمت الزيارة 🟢 (count)] [مؤجل 🟡 (count)]
```
- Color-coded by status
- Shows count for each status
- Smooth horizontal scroll
- Active filter highlighted with solid background

### Additional Filters (List View)
- **Place Type Filter**: Tag icon button with popover
  - Multi-select checkboxes for all place types
  - Shows count when active
- **Has Phone Filter**: Phone icon toggle button
- **Has Website Filter**: Globe icon toggle button
- **Select All Toggle**: CheckSquare/Square icon button
  - Selects/deselects all filtered places

### Location Filters (Map View)
- **Governorate & City Selectors**: 
  - Popover dropdowns with search
  - Multi-select with checkboxes
  - Shows selected count or single name
  - Green checkmark button to confirm selection
  - Appears when clicking location edit button

### Map View Features
- **Full-screen Map**: Leaflet map with custom styling
- **Markers**: 
  - Color-coded by status (matches STATUS_COLORS)
  - Blue (#4A90D9): New
  - Green (#34C759): Visited
  - Orange (#F5A623): Postponed
  - Gray (#8E8E93): Closed
  - Red (#FF3B30): Not found
- **User Location**: Pulsing blue dot
- **Selected Places**: Highlighted route line connecting them
- **Current Target**: Highlighted marker (in journey mode)
- **Tap Marker**: Opens PlaceCard popup

### PlaceCard Popup (Map View)
Shows when marker is tapped:
- Place icon and name
- Address
- Phone number (if available)
- Distance from user location
- Status badge
- Action buttons:
  - Add/Remove from journey
  - Call (if phone available)
  - WhatsApp (if phone available)
  - Open in Google Maps
  - View details
- Notes count badge (if notes exist)

### Floating Action Buttons (Map View)
- **List View Toggle**: Building icon, bottom-left
  - Shows filtered places count badge
- **Radius Filter**: Target icon, bottom-right
  - Popover with range slider
  - Dynamic range expansion (0-2.5km, then expands)
  - Shows current radius value
  - Reset and Save buttons

### Bottom Sheet (Selected Places)
Opens via "المحددة" button in bottom nav:
- Title: "الأماكن المحددة (count)"
- Draggable with snap points (60%, 90%)
- List of selected places:
  - Numbered badges (1, 2, 3...)
  - Grip icon (for future reordering)
  - Place name and address
  - Remove button (Minus icon)
- Swipe down to close

### List View Features
- **Place Cards**: 
  - Status indicator dot
  - Place icon and name
  - Address and distance
  - Phone number (if available)
  - Status and type badges
  - Notes count badge
  - Tap to toggle selection
  - Tap details area to open PlaceDetailsSheet
- **Empty State**: 
  - Animated MapPin icon
  - "لا توجد أماكن" message
  - Helpful text based on filter state

### PlaceDetailsSheet (Both Views)
Full-screen bottom sheet with:
- Place header with icon
- All place details
- Visit history
- Notes section (add/delete)
- Action buttons (Call, WhatsApp, Navigate, Add to journey)
- Swipe down to close

### Key Features
- **Smart Filtering**: Filters combine (status + location + type + radius + phone/website)
- **Initial Filters**: Can receive filters from Data screen when adding data to map
- **Radius Filter**: Dynamic range slider with auto-expansion
- **Selection Management**: Toggle places on/off, view selected count
- **Notes Integration**: Shows notes count, allows adding notes
- **Responsive**: Smooth transitions between views

---

## 📄 Screen 3: JOURNEY (وضع الرحلة)

### Purpose
Active navigation mode. Guides rep through optimized route with check-in at each stop.

### Implementation
**Component**: `JourneyScreen.tsx`  
**Location**: `src/components/screens/JourneyScreen.tsx`  
**Check-in Modal**: `CheckInModal.tsx`  
**Complete Screen**: `JourneyComplete.tsx`

### Triggered By
"Start Journey" button → Takes selected places → Calculates route (nearest neighbor algorithm) → Starts journey

### Layout Structure

**Full-screen Map Background**:
- MapView component with journey mode enabled
- Route line connecting all places
- Current location marker
- Current target highlighted
- All journey places shown as markers

**Bottom Card Overlay** (60% of screen):
- Rounded top corners (`rounded-t-3xl`)
- Contains all journey controls and info

### Floating Action Buttons
- **Navigation Button** (Bottom-left, floating):
  - Opens Google Maps navigation to current place
  - Blue primary color with shadow
- **Check-in Button** (Bottom-right, floating):
  - "وصلت؟" (Did you arrive?) label
  - Green success color
  - Opens CheckInModal

### Station Info Section
- **Progress**: "المحطة X من Y"
- **Skip Button**: "تخطي" with SkipForward icon
- **Progress Bar**: Horizontal bars showing:
  - Green: Completed stops
  - Blue: Current stop
  - Gray: Upcoming stops

### Current Place Card
- **Place Icon**: Large icon in gradient circle
- **Place Name**: Bold, large text
- **Phone Number**: 
  - Displayed if available
  - Copy button with checkmark feedback
- **Distance & Time Chips**:
  - Blue chip: Distance (e.g., "1.2 كم")
  - Orange chip: Estimated time (e.g., "5 د.ق")
- **Address**: Below name (if available)
- **Action Buttons Row**:
  - Google Maps (red)
  - WhatsApp (green, if phone available)
  - Call (blue, if phone available)

### Check-in Modal (BottomSheet)

**Trigger**: "وصلت؟" button

**Layout**:
- Draggable bottom sheet (65-75% height)
- Place header with icon and name
- "Add New Place" button (top-right)

**Outcome Selection** (4 buttons in grid):
```
┌────────┬────────┬────────┬────────┐
│   ✅   │   🗓️   │   🚫   │   ❌   │
│ تمت   │ تأجيل  │ مغلق  │ غير   │
│الزيارة │        │       │ موجود │
└────────┴────────┴────────┴────────┘
```
- Color-coded: Green, Orange, Gray, Red
- Selected state: Solid background with white text

**Extended Content** (When "تمت الزيارة" selected):

1. **Result Options** (Horizontal scroll chips):
   - "تم البيع" (Sale completed)
   - "مهتم" (Interested)
   - "غير مهتم" (Not interested)
   - Optional selection, can select one

2. **Rating Stars** (Optional):
   - 5-star rating system
   - Hover effect for preview
   - Amber/yellow filled stars

3. **Notes Textarea**:
   - Multi-line text input
   - Placeholder: "اكتب ملاحظاتك هنا... مثال: 'باع 20 علبة باندول'"
   - Auto-expands

**Submit Button**:
- "حفظ والمتابعة" (Save and Continue)
- Green gradient
- Disabled until outcome selected
- Submits and moves to next place

**Other Outcomes**:
- **تأجيل** (Postponed): Just notes, no rating
- **مغلق** (Closed): Just notes
- **غير موجود** (Not Found): Just notes

### Add New Place Feature
- Button in CheckInModal header
- Opens AddPlaceSheet
- Allows adding place at current location
- Saves and continues journey

### Journey Complete Screen

**Component**: `JourneyComplete.tsx`

**Layout**:
- Centered celebration content
- Confetti animation (via Framer Motion)
- Stats cards:
  - ✅ Visited count (green)
  - 🗓️ Postponed count (orange)
  - 🚫 Closed count (gray)
  - ⏱️ Duration (blue)
- Action buttons:
  - "شوف التفاصيل" (View Details) - navigates to History
  - "الرئيسية" (Home) - returns to Plan screen

### Key Features
- **Route Optimization**: Nearest neighbor algorithm (simple MVP)
- **Progress Tracking**: Visual progress bar and station counter
- **Distance Calculation**: Real-time distance from user to current place
- **Time Estimation**: ~3 minutes per kilometer
- **Skip Functionality**: Can skip places without check-in
- **Notes Integration**: Can add notes during check-in
- **Rating System**: Optional 5-star rating for successful visits
- **Add Places**: Can add new places during journey
- **Navigation Integration**: Opens Google Maps for directions
- **Contact Actions**: Quick access to call/WhatsApp

---

## 📄 Screen 4: HISTORY (السجل)

### Purpose
Review past visits, notes, and daily performance. The "memory" of your work.

### Implementation
**Component**: `HistoryScreen.tsx`  
**Location**: `src/components/screens/HistoryScreen.tsx`  
**Date Library**: `date-fns` with Arabic locale

### Header
- **Left**: Calendar icon + "السجل" title
- **Right**: Map icon button (navigates to Plan screen)

### Filter Tabs (Horizontal scroll)
Five filter options:
1. **الكل** (All): Shows all visits
2. **اليوم** (Today): Today's visits only
3. **هذا الأسبوع** (This Week): Current week
4. **هذا الشهر** (This Month): Current month
5. **مخصص** (Custom): Date range picker

**Custom Date Range**:
- Opens calendar popover
- Range selection mode
- "تطبيق" (Apply) button
- Shows selected range in header

### Date Navigation (For Week/Month/Custom)
- **Previous Button**: ChevronRight icon (RTL)
- **Date Display**: Formatted date range
- **Next Button**: ChevronLeft icon (RTL)
- Only shows for week/month/custom filters

### Summary Card
Shows statistics for filtered period:
```
┌────────────────────────────────────────────┐
│ 📊 ملخص [Period]                           │
│                                            │
│ ✅ X زيارات  │ 🗓️ Y مؤجل  │ ⏱️ Z ساعة     │
└────────────────────────────────────────────┘
```
- **Visited Count**: Green card with CheckCircle icon
- **Postponed Count**: Orange card with Calendar icon
- **Duration**: Blue card with Clock icon (currently static "4:30")

### Visits List
Each visit card shows:
- **Left Section**:
  - Outcome icon (color-coded):
    - ✅ Green: Visited
    - 🗓️ Orange: Postponed
    - ❌ Gray: Closed
    - ❌ Red: Not Found
  - Manual note indicator: PenSquare icon (purple) for manually added notes
  - Place name (bold)
  - Notes text (if available) with FileText icon
  - Star rating (if available, amber/yellow)
- **Right Section**:
  - Vertical divider
  - Check-in time (formatted: "hh:mm a" in Arabic)

**Empty State**:
- Large Calendar icon
- "لا توجد زيارات" heading
- Helpful message

### Place Details Sheet
Opens when tapping a visit card:
- **Component**: `PlaceDetailsSheet.tsx`
- **Full Details**:
  - Place header with icon
  - Address and location info
  - Contact info (phone, website, Facebook)
  - Distance from user location
- **Visit History**:
  - All visits to this place
  - Chronological list with dates/times
  - Notes for each visit
  - Ratings displayed
- **Notes Section**:
  - List of all notes
  - Add note button
  - Delete note functionality
- **Actions**:
  - Add to journey button
  - Call button (if phone available)
  - WhatsApp button (if phone available)
  - Open in Google Maps button
- **Swipe down to close**

### Key Features
- **Date Filtering**: Multiple filter types with navigation
- **Arabic Dates**: Full Arabic date formatting via date-fns
- **Visit Grouping**: Shows all visits chronologically
- **Manual Notes**: Distinguishes manual notes from visit notes
- **Rating Display**: Visual star ratings
- **Place Details**: Full place information and history
- **Quick Actions**: Easy access to contact and navigation
- **Responsive**: Smooth animations and transitions

---

## 📄 Add Place Modal

### Purpose
Manually add a new place to the database.

### Implementation
**Component**: `AddPlaceSheet.tsx`  
**Location**: `src/components/AddPlaceSheet.tsx`  
**Opens From**: 
- CheckInModal (during journey)
- Plan screen (via FAB - if implemented)

### Layout
- **Bottom Sheet**: Draggable sheet (85-95% height)
- **Title**: "إضافة مكان جديد" with close button
- **Form Fields**: Vertical stack with spacing

### Form Fields

1. **Place Name** (Required)
   - Text input with MapPin icon
   - Placeholder: "أدخل اسم المكان"
   - Auto-focus on open
   - RTL direction

2. **Place Type** (Required)
   - Select dropdown
   - Shows icon + label
   - Options: All PLACE_TYPES (صيدلية, ماركت, ملابس, كافيه, مطعم, أخرى)
   - Default: "أخرى"

3. **Governorate** (Required)
   - Select dropdown
   - Options: All GOVERNORATES
   - Placeholder: "اختر المحافظة"
   - RTL direction
   - Resets city when changed

4. **City** (Required)
   - Select dropdown
   - Depends on selected governorate
   - Options: CITIES[governorate]
   - Placeholder: "اختر المدينة" or "اختر المحافظة أولاً"
   - Disabled until governorate selected
   - RTL direction

5. **Location** (Required)
   - Status display:
     - ✅ "تم الحصول على الموقع" with coordinates
     - ❌ "لم يتم الحصول على الموقع"
   - **Get Current Location Button**:
     - Uses browser Geolocation API
     - Shows loading spinner while getting location
     - Falls back to userLocation prop if available
     - Error handling with alerts

### Save Button
- **Label**: "حفظ المكان"
- **Style**: Primary gradient, full-width, large height
- **Disabled Until**: All required fields filled (name, type, governorate, city, location)
- **On Save**: 
  - Creates new Place object
  - Sets status to 'new'
  - Sets isImportant to false
  - Calls onSave callback
  - Closes sheet
  - Resets form

### Key Features
- **Geolocation**: Uses browser API to get current location
- **Form Validation**: Required fields enforced
- **Smart Defaults**: Auto-fills location from userLocation prop
- **Error Handling**: Alerts for missing fields or geolocation errors
- **Reset on Close**: Form clears when sheet closes
- **RTL Support**: All inputs support RTL text

---

## 🗂️ Data Model

### Type Definitions
**File**: `src/lib/types.ts`

### Place
```typescript
export type PlaceType = 'pharmacy' | 'restaurant' | 'cafe' | 'supermarket' | 'bakery' | 'clinic' | 'other';

export type PlaceStatus = 'new' | 'visited' | 'postponed' | 'closed' | 'not_found';

export interface Place {
  id: string;
  name: string;
  type: PlaceType;
  governorate: string;
  city: string;
  address?: string;
  lat: number;  // Required (not optional)
  lng: number; // Required (not optional)
  phone?: string;
  website?: string;
  facebook?: string;
  rating?: number;
  ratingCount?: number;
  status: PlaceStatus;
  isImportant: boolean;
  createdAt: string; // ISO string (not Date object)
}
```

**Place Types**:
- `pharmacy` → صيدلية (Pill icon)
- `supermarket` → ماركت (Store icon)
- `bakery` → مخبز (Croissant icon)
- `clinic` → ملابس (Building2 icon) - Note: Label says "clothes" but icon suggests clinic
- `cafe` → كافيه (Coffee icon)
- `restaurant` → مطعم (UtensilsCrossed icon)
- `other` → أخرى (MapPin icon)

**Status Colors**:
- `new`: #4A90D9 (Blue)
- `visited`: #34C759 (Green)
- `postponed`: #F5A623 (Orange)
- `closed`: #8E8E93 (Gray)
- `not_found`: #FF3B30 (Red)

### Visit
```typescript
export type VisitOutcome = 'visited' | 'postponed' | 'closed' | 'not_found';

export interface Visit {
  id: string;
  placeId: string;
  placeName: string; // Cached for display
  date: string; // ISO string
  checkInTime: string; // ISO string
  outcome: VisitOutcome;
  notes?: string;
  rating?: number; // 1-5
  soldItems?: string; // Not currently used in UI
  isManualNote?: boolean; // Indicates manually added note (not from visit)
}
```

**Visit Outcomes**:
- `visited`: Successful visit (green)
- `postponed`: Rescheduled visit (orange)
- `closed`: Place was closed (gray)
- `not_found`: Place doesn't exist (red)

### Journey
```typescript
export interface Journey {
  id: string;
  date: string; // ISO string
  startTime: string; // ISO string
  endTime?: string; // ISO string
  places: string[]; // placeIds in order
  status: 'planning' | 'active' | 'completed';
  currentIndex: number; // Current place index in journey
}
```

**Journey Status**:
- `planning`: Places selected, not started
- `active`: Currently in progress
- `completed`: Finished

### Constants

**Governorates** (`GOVERNORATES`):
- الشرقية, القاهرة, الجيزة, الإسكندرية, الدقهلية, الغربية, المنوفية, البحيرة, كفر الشيخ, الفيوم

**Cities** (`CITIES`):
- Object mapping governorate → array of cities
- Example: `{ 'الشرقية': ['الزقازيق', 'بلبيس', ...] }`

**Place Types** (`PLACE_TYPES`):
- Array of objects with `value`, `label`, and `icon` (React component)

### Mock Data
**File**: `src/lib/store.ts`

- `mockPlaces`: Array of sample Place objects
- `mockVisits`: Array of sample Visit objects
- Helper functions:
  - `getPlaceIcon(type, size, variant)`: Returns icon component
  - `getStatusColor(status)`: Returns hex color
  - `formatDistance(km)`: Formats distance (meters/kilometers)
  - `formatDuration(minutes)`: Formats duration
  - `calculateDistance(lat1, lng1, lat2, lng2)`: Haversine formula for distance

---

## 🔧 Technical Notes

### Map Integration
- **Library**: Leaflet (via React-Leaflet)
- **Styling**: Custom map styles via CSS
- **Markers**: Custom colored markers based on place status
- **Route Display**: Polyline connecting selected places
- **User Location**: Browser Geolocation API
- **Navigation**: Opens Google Maps in external browser
- **Route Optimization**: Nearest neighbor algorithm (simple MVP)
- **Arabic Labels**: Map tiles support Arabic (depends on provider)

### State Management
- **Pattern**: React Hooks (useState, useMemo, useEffect)
- **No Global State**: State managed in `page.tsx` and passed as props
- **Local State**: Each screen manages its own local state
- **Data Flow**: Props down, callbacks up pattern

### Performance Optimizations
- **Dynamic Imports**: MapView component dynamically imported (code splitting)
- **Memoization**: useMemo for filtered lists and calculations
- **Debouncing**: Filter inputs debounced (via constants)
- **Lazy Loading**: Components loaded on demand

### Offline Consideration
- **Current**: Not implemented (MVP)
- **Future**: 
  - Cache visited places in localStorage
  - Queue check-ins when offline
  - Sync when back online

### Arabic Support
- **RTL Layout**: `dir="rtl"` on `<html>` tag
- **Font**: Cairo from Google Fonts (weights 300-800)
- **Date Formatting**: date-fns with Arabic locale (`ar`)
- **UI Copy**: Egyptian Arabic throughout
- **Text Direction**: All inputs support RTL

### Animations
- **Library**: Framer Motion
- **Key Animations**:
  - Tab transitions (slide/fade)
  - Bottom sheet drag and snap
  - Button hover/tap effects
  - Card entrance animations
  - Progress bar updates
  - Confetti on journey complete (via JourneyComplete component)
- **Performance**: `willChange` CSS property for smooth animations

### Theme System
- **Library**: next-themes
- **Modes**: Light (default) and Dark
- **Implementation**: CSS variables with `.dark` class
- **Toggle**: Available in Data screen header
- **Persistence**: Theme preference stored

### Bottom Sheet Component
- **Custom Implementation**: `bottom-sheet.tsx`
- **Features**:
  - Draggable with snap points
  - Backdrop dismiss
  - Close on drag down
  - Smooth animations
- **Usage**: CheckInModal, AddPlaceSheet, PlaceDetailsSheet, Selected Places list

### Error Handling
- **Error Boundary**: `ErrorBoundary.tsx` and `ErrorBoundaryWrapper.tsx`
- **Geolocation Errors**: Alert dialogs
- **Form Validation**: Required field checks with alerts
- **Network Errors**: Not currently handled (future enhancement)

### Browser Compatibility
- **Geolocation API**: Required for location features
- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile**: iOS Safari, Chrome Mobile

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
