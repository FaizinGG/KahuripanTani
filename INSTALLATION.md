# 🚀 RetailPOS Pro - Installation & Setup Guide

Panduan lengkap untuk setup dan menjalankan RetailPOS Pro di environment lokal Anda.

## 📋 Prerequisites

Sebelum memulai, pastikan Anda sudah menginstall:

- **PHP 8.4+** → [Download](https://www.php.net/downloads)
- **Composer** → [Download](https://getcomposer.org/)
- **Node.js 18+** → [Download](https://nodejs.org/)
- **MySQL 8.0+** → [Download](https://www.mysql.com/downloads/mysql/)
- **Git** → [Download](https://git-scm.com/)

Cek versi yang sudah terinstall:
```bash
php --version
composer --version
node --version
npm --version
mysql --version
```

---

## 🔧 Step 1: Clone & Setup Project

### Clone Repository
```bash
cd ~/projects
git clone <repository-url> kahuripantanipos
cd kahuripantanipos
```

### Install Backend Dependencies
```bash
composer install
```

### Setup Environment File
```bash
cp .env.example .env
```

Edit `.env` dan sesuaikan konfigurasi database:
```env
APP_NAME=RetailPOS
APP_ENV=local
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=retailpos_db
DB_USERNAME=root
DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=localhost:8000,localhost:5173
```

### Generate Application Key
```bash
php artisan key:generate
```

---

## 🗄️ Step 2: Database Setup

### Create Database
```bash
mysql -u root -p
CREATE DATABASE retailpos_db;
EXIT;
```

### Run Migrations
```bash
php artisan migrate
```

### Seed Database (Optional but Recommended)
```bash
php artisan db:seed
```

Setelah seeding, Anda akan mendapat credentials:
- Owner: `owner@retailpos.local` / `password123`
- Admin: `admin@retailpos.local` / `password123`
- Kasir: `kasir1@retailpos.local` / `password123`

---

## 📦 Step 3: Frontend Setup

### Install NPM Dependencies
```bash
npm install
```

### Build Assets (Development)
```bash
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

### Build Assets (Production)
```bash
npm run build
```

---

## 🎯 Step 4: Run Application

### Terminal 1: Laravel Server
```bash
php artisan serve
```

Backend akan berjalan di `http://localhost:8000`

### Terminal 2: Vite Dev Server
```bash
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

### Terminal 3: Queue Listener (Optional)
```bash
php artisan queue:listen
```

### Terminal 4: Scheduler (Optional)
```bash
while true; do php artisan schedule:run; sleep 60; done
```

---

## ✅ Verify Installation

Jika semuanya berhasil:

1. ✅ Akses `http://localhost:5173` di browser
2. ✅ Login dengan credentials test
3. ✅ Lihat dashboard
4. ✅ Explore aplikasi

---

## 🐛 Troubleshooting

### Error: SQLSTATE[HY000] [1045] Access denied for user 'root'@'localhost'
**Solusi:** Update `DB_PASSWORD` di `.env` sesuai password MySQL Anda

### Error: Class "Spatie\Permission\Models\Role" not found
**Solusi:** Publish Spatie Permission config
```bash
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
php artisan migrate
```

### Error: Port 8000 already in use
**Solusi:** Jalankan di port berbeda
```bash
php artisan serve --port=8001
```

### Error: Port 5173 already in use
**Solusi:** Vite akan otomatis pakai port berikutnya (5174, 5175, etc)

### CORS Error di Frontend
**Solusi:** Pastikan `SANCTUM_STATEFUL_DOMAINS` di `.env` benar:
```env
SANCTUM_STATEFUL_DOMAINS=localhost:8000,localhost:5173
```

### Database Connection Error
**Solusi:** Pastikan MySQL running dan database sudah dibuat
```bash
# Check MySQL status
mysql -u root -p -e "SHOW DATABASES;"

# Rebuild database
php artisan migrate:fresh --seed
```

---

## 📁 Project Structure

```
kahuripantanipos/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   ├── Middleware/
│   │   ├── Requests/
│   │   └── Resources/
│   ├── Models/
│   ├── Repositories/
│   ├── Services/
│   └── Policies/
├── database/
│   ├── migrations/      (25+ tables)
│   ├── seeders/
│   └── factories/
├── resources/
│   └── js/
│       ├── App.jsx
│       ├── pages/
│       ├── components/
│       ├── contexts/
│       ├── hooks/
│       ├── services/
│       └── layouts/
├── routes/
│   ├── api.php          (API endpoints)
│   └── web.php
├── storage/
├── tests/
├── vite.config.js
├── tailwind.config.js
├── package.json
├── composer.json
└── .env                 (gitignore)
```

---

## 🔑 Key Features Implemented

### ✅ Complete
- Database schema dengan 25+ tables
- Authentication dengan Laravel Sanctum
- Role-Based Access Control (RBAC)
- Models dengan relationships
- API endpoints untuk login/logout
- React frontend dengan routing
- Protected routes & authentication context
- Test data seeder

### 🚧 In Progress / To Do
- POS Module (Kasir Interface)
- Product Management API
- Sales Management API
- Inventory Management API
- Dashboard dengan charts
- Reports & Export
- Admin Panel
- User Management
- More...

---

## 🔌 API Documentation

### Authentication Endpoints

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
    "email": "owner@retailpos.local",
    "password": "password123"
}

Response:
{
    "message": "Login successful",
    "token": "token_here",
    "user": {
        "id": 1,
        "name": "Pemilik Toko",
        "email": "owner@retailpos.local",
        "roles": ["owner"],
        "permissions": [...]
    }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {token}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer {token}
```

#### Refresh Token
```http
POST /api/auth/refresh
Authorization: Bearer {token}
```

---

## 📚 Technology Stack

- **Backend:** Laravel 13, PHP 8.4, MySQL 8
- **Frontend:** React 19, React Router, Tailwind CSS, Vite
- **Authentication:** Laravel Sanctum
- **Authorization:** Spatie Laravel Permission
- **Database:** MySQL 8 dengan 25+ tables
- **Tools:** Git, Composer, NPM

---

## 💡 Development Tips

### Hot Module Replacement (HMR)
Frontend auto-reload ketika ada perubahan:
```bash
npm run dev
```

### Laravel Tinker
Debug dan test code secara interaktif:
```bash
php artisan tinker
```

### Database Reset
Reset database ke state awal (dengan seed):
```bash
php artisan migrate:fresh --seed
```

### Create Model + Migration
```bash
php artisan make:model ModelName -m
```

### Create API Resource
```bash
php artisan make:resource ModelNameResource
```

### Create Request Validation
```bash
php artisan make:request StoreModelRequest
```

---

## 📞 Support & Contact

Untuk bantuan dan pertanyaan, silakan buka issue di repository ini.

---

## 📄 License

MIT License - Lihat LICENSE file untuk detail lengkap.

---

**Happy Coding! 🎉**
