# BananaVision - Arsitektur Sistem v3

## Gambaran Umum

BananaVision adalah aplikasi Progressive Web App (PWA) untuk deteksi penyakit pada daun pisang menggunakan machine learning. Sistem terdiri dari tiga komponen utama:

1. **Frontend** - React/Vite (PWA)
2. **Backend** - Node.js/Express API
3. **ML Server** - Python Flask untuk prediksi gambar

```
┌─────────────────────────────────────────────────────────────────┐
│                       BananaVision System                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Frontend (React/Vite)          Backend (Node.js)   ML Server   │
│  ┌──────────────────┐           ┌──────────────┐   ┌──────────┐│
│  │ • Pages          │──────────▶│ • Controllers│──▶│ • Python ││
│  │ • Components     │◀──────────│ • Services   │◀──│ • Models ││
│  │ • Hooks          │           │ • Routes     │   │          ││
│  │ • Utils          │           │ • Middleware │   └──────────┘│
│  └──────────────────┘           └──────────────┘                │
│         │                              │                         │
│         │                       Firebase Auth                    │
│         │                              │                         │
│         └──────────┬───────────────────┘                         │
│                    │                                             │
│              MongoDB Database                                   │
│                    │                                             │
│         (Prisma ORM)                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Arsitektur Backend

### Struktur Folder

```
backend/
├── src/
│   ├── controllers/        # Endpoint handlers
│   ├── models/            # Database models (Prisma)
│   ├── services/          # Business logic
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   ├── validators/        # Input validation
│   └── utils/             # Helper functions
├── config/                # Configuration files
├── prisma/                # Prisma schema & migrations
├── app.js                 # Express app setup
└── server.js              # Server entry point
```

### Alur Request

```
HTTP Request
    │
    ▼
Rate Limiter (express-rate-limit)
    │
    ▼
CORS & Security (Helmet)
    │
    ▼
Routes (/api/*)
    │
    ▼
Middleware (Auth)
    │
    ▼
Controller
    │
    ▼
Service (Business Logic)
    │
    ▼
Model (Database/ML Server)
    │
    ▼
Response
```

### API Endpoints

#### Authentication (`/api/auth`)

- `POST /auth/google` - Login dengan Google
- `GET /auth/verify` - Verify JWT token
- `PUT /auth/profile` - Update profile pengguna

#### Analysis (`/api/analyses`)

- `POST /analyses/analyze` - Analyze gambar (call ML Server)
- `GET /analyses` - Get analysis history (paginated)
- `GET /analyses/:id` - Get analysis detail
- `DELETE /analyses/:id` - Delete analysis
- `GET /analyses/dashboard/stats` - Get stats untuk dashboard
- `GET /analyses/dashboard/trends` - Get trends untuk chart

#### Disease (`/api/diseases`)

- `GET /diseases` - Get semua penyakit
- `GET /diseases/:id` - Get detail penyakit
- `POST /diseases` - Buat penyakit baru (admin)
- `PUT /diseases/:id` - Update penyakit (admin)
- `DELETE /diseases/:id` - Hapus penyakit (admin)

#### Feedback (`/api/feedbacks`)

- `POST /feedbacks` - Buat feedback
- `GET /feedbacks` - Get semua feedback (admin)
- `GET /feedbacks/user` - Get feedback user

---

## Arsitektur Frontend

### Struktur Folder

```
frontend/src/
├── pages/              # Halaman utama
│   ├── HomePage.jsx
│   ├── LoginPage.jsx
│   ├── AnalyzePage.jsx
│   ├── DashboardPage.jsx
│   ├── HistoryPage.jsx
│   ├── DiseasesPage.jsx
│   ├── ProfilePage.jsx
│   └── RegisterPage.jsx
├── components/         # Reusable components
│   ├── Navigation.jsx
│   ├── DiseaseCard.jsx
│   ├── LoadingSpinner.jsx
│   ├── Toast.jsx
│   ├── StatCard.jsx
│   ├── OfflineIndicator.jsx
│   ├── SplashScreen.jsx
│   └── InstallPrompt.jsx
├── hooks/             # Custom hooks
│   ├── data.js        # API calls
│   └── useToast.jsx   # Toast notifications
├── utils/             # Utilities
│   ├── config.js      # Base URL config
│   ├── firebaseClient.js  # Firebase auth
│   └── token.js       # JWT token management
├── public/            # PWA assets
│   ├── service-worker.js
│   ├── manifest.json
│   └── offline.html
└── App.jsx            # Main component
```

### Fitur PWA

- **Service Worker** - Offline support
- **Manifest** - Install as app
- **Offline Page** - Fallback saat offline
- **Cache Strategy** - Cache-first untuk static assets

---

## ML Server

### Endpoint

```
POST /api/predict

Request Body:
{
  "image": "base64_string"
}

Response:
{
  "success": true,
  "data": {
    "detectedDisease": "Leaf Spot",
    "confidence": 0.95,
    "predictions": [
      {"disease": "Leaf Spot", "confidence": 0.95},
      {"disease": "Healthy Leaf", "confidence": 0.04},
      {"disease": "Anthracnose", "confidence": 0.01}
    ]
  }
}
```

### Models

- **Primary**: MobileNetV2 (Real-time, lightweight)
- **Secondary**: ResNet50 (Fallback)

---

## Database Schema (MongoDB)

Menggunakan Prisma ORM untuk query dan migrations.

### User

```
- id: ObjectId
- email: String (unique)
- name: String
- photoUrl: String
- firebaseUid: String (unique)
- createdAt: DateTime
- updatedAt: DateTime
```

### Analysis

```
- id: ObjectId
- userId: ObjectId (FK → User)
- detectedDisease: String
- diseaseId: ObjectId (FK → Disease)
- imageUrl: String (null - gambar tidak disimpan)
- confidence: Float
- status: String (completed, failed)
- predictions: Json (array)
- notes: String
- isDeleted: Boolean
- createdAt: DateTime
- updatedAt: DateTime
```

### Disease

```
- id: ObjectId
- name: String (unique)
- description: String
- treatment: String
- symptoms: String
- createdAt: DateTime
- updatedAt: DateTime
```

### Feedback

```
- id: ObjectId
- userId: ObjectId (FK → User)
- analysisId: String
- message: String
- rating: Int (1-5)
- status: String (pending, resolved)
- isDeleted: Boolean
- createdAt: DateTime
- updatedAt: DateTime
```

---

## Security

### Authentication

- **Firebase Auth** - Google login
- **JWT Tokens** - Backend session (7 hari validity)
- **Token Storage** - localStorage di frontend

### Protection

- **Rate Limiting** - 100 req/15min (general), 20 req/1min (auth)
- **Helmet** - XSS, clickjacking protection
- **CORS** - Whitelist origins
- **CSP** - Content Security Policy

---

## Alur Utama

### Authentication Flow

```
1. User clicks Google Sign-In (Frontend)
   ↓
2. Firebase SDK shows Google popup
   ↓
3. User authenticates → idToken diterima
   ↓
4. Frontend POST /api/auth/google { idToken }
   ↓
5. Backend verifies via Firebase Admin SDK
   ↓
6. Backend creates/updates User in DB
   ↓
7. Backend generates JWT token
   ↓
8. Frontend stores JWT in localStorage
   ↓
9. Frontend uses JWT for all subsequent requests
```

### Image Analysis Flow

```
1. User selects image (Frontend Analyze page)
   ↓
2. Convert to base64 using FileReader
   ↓
3. POST /api/analyses/analyze { image, notes }
   ↓
4. Backend validates & extracts base64
   ↓
5. Backend calls ML Server POST /api/predict
   ↓
6. ML Server returns prediction + confidence
   ↓
7. Backend saves to DB (imageUrl = null)
   ↓
8. Backend returns analysis result
   ↓
9. Frontend displays result & updates history
```

### Dashboard Stats Flow

```
1. Frontend loads dashboard
   ↓
2. Request GET /api/analyses/dashboard/stats
   ↓
3. Backend fetches ALL analyses (no pagination)
   ↓
4. Calculate stats:
   - totalAnalyses: count all
   - diseasePrevalence: (disease / total) * 100
   - healthyCount: count healthy
   - avgConfidence: average confidence
   ↓
5. Return aggregated stats
   ↓
6. Frontend renders stat cards
```

---

## Tech Stack

| Layer        | Technology       | Purpose           |
| ------------ | ---------------- | ----------------- |
| **Frontend** | React 18         | UI Library        |
|              | Vite             | Build tool        |
|              | Tailwind CSS     | Styling           |
|              | Recharts         | Charts            |
|              | Lucide React     | Icons             |
| **Backend**  | Node.js          | Runtime           |
|              | Express          | Framework         |
|              | Prisma           | ORM               |
|              | MongoDB          | Database          |
|              | Firebase Admin   | Auth verification |
|              | JWT              | Session tokens    |
|              | Helmet           | Security headers  |
| **ML**       | Python           | Language          |
|              | Flask            | Framework         |
|              | TensorFlow/Keras | ML Models         |
|              | MobileNetV2      | Primary model     |
|              | ResNet50         | Fallback model    |

---

## 📝 Catatan Penting (v3 Changes)

### ❌ Removed

- `/api/statistics/user` endpoint (redundan)
- StatisticModel, StatisticService, StatisticController

### ✅ Current

- Dashboard stats menggunakan `/api/analyses/dashboard/stats` (lebih comprehensive)
- Includes: totalAnalyses, diseasePrevalence, healthyCount, avgConfidence
- Stats always calculated from ALL analyses (no pagination)

### 🔧 Best Practices

1. **Image Storage** - Images TIDAK disimpan di database (mencegah bloat)
2. **Soft Delete** - Analysis bisa di-soft delete (isDeleted flag)
3. **ML Fallback** - Jika ML server down, analysis dibuat dengan status "failed"
4. **Pagination** - History menggunakan pagination (limit, skip)
5. **Trends** - Trends dihitung dari 7d/30d/1y terakhir

---

Dokumentasi terakhir update: **May 19, 2026 (v3)**
