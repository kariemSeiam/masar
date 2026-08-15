# MASAR مسار — Minimal Server API

> Simple server API that matches the frontend pages exactly.

---

## 🔐 Authentication

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "phone": "+201234567890",
  "password": "password123"
}

Response 200:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "phone": "+201234567890"
    },
    "token": "jwt_token"
  }
}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "phone": "+201234567890"
    }
  }
}
```

---

## 📊 Data Models

### Place
```typescript
{
  id: string;
  userId: string;
  name: string;
  type: 'pharmacy' | 'restaurant' | 'cafe' | 'supermarket' | 'bakery' | 'clinic' | 'other';
  governorate: string;
  city: string;
  address?: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  facebook?: string;
  rating?: number;
  ratingCount?: number;
  status: 'new' | 'visited' | 'postponed' | 'closed' | 'not_found';
  isImportant: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Visit
```typescript
{
  id: string;
  userId: string;
  placeId: string;
  placeName: string;  // Cached
  date: string;       // ISO date
  checkInTime: string; // ISO timestamp
  outcome: 'visited' | 'postponed' | 'closed' | 'not_found';
  notes?: string;
  rating?: number;   // 1-5, only for 'visited'
  isManualNote: boolean; // true if added manually
  createdAt: string;
}
```

### Order (Data Request)
```typescript
{
  id: string;
  userId: string;
  placeName: string;
  placeType: string;
  governorates: string[];
  cities: string[];
  status: 'pending' | 'processing' | 'completed';
  createdAt: string;
  updatedAt: string;
}
```

---

## 📄 Screen 1: DATA (طلب البيانات)

### Get Available Data Summary
```http
GET /api/places/available-data
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": [
    {
      "type": "pharmacy",
      "count": 150,
      "cities": ["الزقازيق", "بلبيس"],
      "governorates": ["الشرقية"]
    }
  ]
}
```

### Get Orders
```http
GET /api/orders
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "placeName": "صيدلية",
      "placeType": "pharmacy",
      "governorates": ["الشرقية"],
      "cities": ["الزقازيق", "بلبيس"],
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create Order
```http
POST /api/orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "placeName": "صيدلية",
  "placeType": "pharmacy",
  "governorates": ["الشرقية"],
  "cities": ["الزقازيق", "بلبيس"]
}

Response 201:
{
  "success": true,
  "data": {
    "order": { /* Order object */ }
  }
}

Business Logic:
- If order with same placeName + placeType exists → merge cities/governorates
- Otherwise → create new order with status='pending'
```

### Delete City from Order
```http
DELETE /api/orders/:id/cities
Authorization: Bearer {token}
Content-Type: application/json

{
  "city": "الزقازيق",
  "governorate": "الشرقية"
}

Response 200:
{
  "success": true,
  "data": {
    "order": { /* Updated Order */ }
  }
}

Business Logic:
- Remove city from order
- If no cities left → delete entire order
- If governorate has no cities → remove governorate
```

---

## 📄 Screen 2: PLAN (تجهيز الرحلة)

### Get Places (with filters)
```http
GET /api/places?status=new&governorate=الشرقية&city=الزقازيق&type=pharmacy&hasPhone=true&hasWebsite=true&radius=2.5&lat=30.5877&lng=31.5020
Authorization: Bearer {token}

Query Parameters:
- status: 'all' | 'new' | 'visited' | 'postponed' | 'closed' | 'not_found'
- governorate: string (can be multiple)
- city: string (can be multiple)
- type: string (can be multiple: pharmacy, restaurant, etc.)
- hasPhone: boolean
- hasWebsite: boolean
- radius: number (km, requires lat & lng)
- lat: number
- lng: number

Response 200:
{
  "success": true,
  "data": {
    "places": [ /* Place objects */ ],
    "counts": {
      "all": 150,
      "new": 80,
      "visited": 50,
      "postponed": 15
    }
  }
}
```

### Get Place by ID
```http
GET /api/places/:id
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "place": { /* Place object */ }
  }
}
```

### Update Place Status
```http
PATCH /api/places/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "visited"  // or 'new', 'postponed', 'closed', 'not_found'
}

Response 200:
{
  "success": true,
  "data": {
    "place": { /* Updated Place */ }
  }
}
```

---

## 📄 Screen 3: JOURNEY (وضع الرحلة)

### Create Visit (Check-in)
```http
POST /api/visits
Authorization: Bearer {token}
Content-Type: application/json

{
  "placeId": "uuid",
  "outcome": "visited",  // 'visited' | 'postponed' | 'closed' | 'not_found'
  "notes": "باع 20 علبة باندول",
  "rating": 5  // Optional, 1-5, only for 'visited'
}

Response 201:
{
  "success": true,
  "data": {
    "visit": { /* Visit object */ },
    "place": { /* Updated Place (status changed) */ }
  }
}

Business Logic:
- Set date = today
- Set checkInTime = now
- Cache placeName from Place
- Update Place.status based on outcome:
  - 'visited' → status='visited'
  - 'postponed' → status='postponed'
  - 'closed' → status='closed'
  - 'not_found' → status='not_found'
```

### Add New Place (during journey)
```http
POST /api/places
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "صيدلية جديدة",
  "type": "pharmacy",
  "governorate": "الشرقية",
  "city": "الزقازيق",
  "lat": 30.5877,
  "lng": 31.5020,
  "address": "شارع الجلاء"  // Optional
}

Response 201:
{
  "success": true,
  "data": {
    "place": { /* Created Place with status='new' */ }
  }
}
```

---

## 📄 Screen 4: HISTORY (السجل)

### Get Visits (with filters)
```http
GET /api/visits?dateFrom=2024-01-01&dateTo=2024-01-31&outcome=visited&placeId=uuid
Authorization: Bearer {token}

Query Parameters:
- dateFrom: ISO date (optional)
- dateTo: ISO date (optional)
- outcome: 'visited' | 'postponed' | 'closed' | 'not_found' | 'all'
- placeId: string (optional)

Response 200:
{
  "success": true,
  "data": {
    "visits": [
      {
        "id": "uuid",
        "placeId": "uuid",
        "placeName": "صيدلية الأمل",
        "date": "2024-01-15T00:00:00Z",
        "checkInTime": "2024-01-15T10:30:00Z",
        "outcome": "visited",
        "notes": "باع 20 علبة باندول",
        "rating": 5,
        "isManualNote": false
      }
    ],
    "statistics": {
      "visited": 80,
      "postponed": 25,
      "closed": 10
    }
  }
}
```

### Get Visits for Place
```http
GET /api/places/:placeId/visits
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "visits": [ /* Visit objects */ ]
  }
}
```

### Add Manual Note
```http
POST /api/places/:placeId/notes
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "ملاحظة يدوية"
}

Response 201:
{
  "success": true,
  "data": {
    "visit": { /* Visit with isManualNote=true, outcome='visited' */ }
  }
}

Business Logic:
- Create Visit with:
  - outcome = 'visited'
  - isManualNote = true
  - notes = content
  - date/checkInTime = now
```

### Delete Note/Visit
```http
DELETE /api/visits/:id
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "تم الحذف"
}
```

---

## 🔄 Complete Cycles

### Cycle 1: Order Data
```
1. User creates order → POST /api/orders
   - If exists: merge cities
   - If new: create order

2. User views orders → GET /api/orders

3. User deletes city → DELETE /api/orders/:id/cities
   - Remove city, delete order if empty
```

### Cycle 2: Filter & Select Places
```
1. User filters places → GET /api/places?status=...&governorate=...
   - Returns filtered places + counts

2. User selects places → (Client-side only, no API)

3. User views place details → GET /api/places/:id
```

### Cycle 3: Check-in
```
1. User arrives → POST /api/visits
   - Input: placeId, outcome, notes, rating
   - Updates Place.status automatically
   - Returns Visit + updated Place

2. User adds new place → POST /api/places
   - Creates place with status='new'
```

### Cycle 4: View History
```
1. User views visits → GET /api/visits?dateFrom=...&dateTo=...
   - Returns filtered visits + statistics

2. User adds manual note → POST /api/places/:placeId/notes
   - Creates Visit with isManualNote=true

3. User deletes visit → DELETE /api/visits/:id
```

---

## ⚠️ Error Responses

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "رسالة بالعربية"
  }
}
```

**Error Codes:**
- `VALIDATION_ERROR` (400) - Missing/invalid data
- `UNAUTHORIZED` (401) - Not logged in
- `FORBIDDEN` (403) - Not your data
- `NOT_FOUND` (404) - Resource not found

---

## 🔒 Security

- **Authentication**: JWT token in `Authorization: Bearer {token}` header
- **Authorization**: Users can only access their own data (filter by userId)
- **Validation**: Validate all inputs (lat/lng ranges, required fields)

---

## 📝 Notes

- **No Journey API**: Journey is managed client-side (just array of placeIds)
- **No soldItems**: Not used in frontend
- **Simple Status Updates**: Place status updated automatically on check-in
- **Manual Notes**: Created as Visit with `isManualNote=true`

---

**Minimal. Focused. Matches the frontend exactly.**
