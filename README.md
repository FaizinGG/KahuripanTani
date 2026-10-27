# Kahuripan Tani

**Sistem Administrasi Retail, Kasir, Gudang, Karyawan, Hutang Piutang dan Laporan Keuangan**

Aplikasi web POS Enterprise yang modern, scalable, dan siap produksi untuk toko retail nyata.

## 🌟 Fitur Utama

### 💼 Retail POS System
- **Modul POS** - Interface kasir yang cepat dan user-friendly
- **Multi-Price Support** - Harga untuk Retail, Reseller Kecil, Reseller Besar, Karyawan
- **Smart Inventory** - Tracking stok real-time dengan alert stok menipis
- **Financial Management** - Piutang, Hutang, Diskon, Promosi
- **Membership System** - Loyalty points, Member levels (Silver/Gold/Platinum)
- **Advanced Reports** - 14+ jenis laporan dengan export PDF/Excel

### 🔐 Role-Based Access Control
- **Owner** - Full system access
- **Admin/Manager** - Inventory & supply management
- **Employee/Kasir** - POS dan basic operations

### 📊 Enterprise Features
- **Audit Log** - Track semua aktivitas sistem
- **Price History** - Immutable record untuk kalkulasi profit akurat
- **Cash Register** - Daily cash management dengan selisih kas
- **Stock Opname** - Physical inventory dengan approval workflow
- **Attendance** - Employee clock in/out system

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Laravel 13, PHP 8.4, MySQL 8 |
| **Frontend** | React 19, Vite, Tailwind CSS |
| **Authentication** | Laravel Sanctum |
| **Authorization** | Spatie Laravel Permission |
| **UI Framework** | Shadcn UI, Recharts |
| **API** | RESTful with JSON |

---

## 📦 Database Schema (25+ Tables)

Lihat [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) untuk ERD dan penjelasan lengkap.

---

## 🚀 Quick Start

### Prerequisites
```bash
PHP 8.4+
Composer
Node.js 18+
MySQL 8.0+
```

### Installation
```bash
# Clone repository
git clone <url> kahuripantanipos
cd kahuripantanipos

# Setup environment
cp .env.example .env
php artisan key:generate

# Install dependencies
composer install
npm install

# Setup database
php artisan migrate --seed

# Build frontend
npm run dev
```

### Running Application
```bash
# Terminal 1: Laravel server
php artisan serve

# Terminal 2: Vite dev server
npm run dev
```

Access at `http://localhost:5173`

**Demo Credentials:**
- Owner: `owner@retailpos.local` / `password123`
- Admin: `admin@retailpos.local` / `password123`
- Kasir: `kasir1@retailpos.local` / `password123`

---

## 📖 Documentation

- [Installation Guide](./INSTALLATION.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [API Documentation](./docs/API.md) (coming soon)
- [Architecture & Design](./docs/ARCHITECTURE.md) (coming soon)

---

## ✨ Key Implementation Details

### Authentication
- JWT token-based with Laravel Sanctum
- Protected API routes with Bearer token
- Secure password hashing with bcrypt
- Token refresh mechanism

### Authorization
- Spatie Permission for RBAC
- Role-based route protection
- Permission-based feature gating
- Custom policies for resource authorization

### Database Design
- Foreign key constraints for referential integrity
- Soft deletes for data preservation
- Virtual columns for calculated fields
- Proper indexing for query optimization

### API Architecture
- RESTful API design
- JSON request/response format
- Comprehensive error handling
- Input validation with Form Requests
- Resource transformation with API Resources

### Frontend Architecture
- Component-based React application
- Context API for state management
- React Router for navigation
- Custom hooks for business logic
- Tailwind CSS for styling

---

## 📁 Project Structure

```
app/
├── Http/Controllers/Auth/
├── Http/Requests/
├── Http/Resources/
├── Models/
├── Repositories/
├── Services/
└── Policies/

resources/js/
├── App.jsx
├── pages/
├── components/
├── layouts/
├── contexts/
└── hooks/

database/
├── migrations/
├── seeders/
└── factories/
```

---

## 🎯 Roadmap

### ✅ Complete
- Database design & migrations (25+ tables)
- Models with relationships
- Authentication system
- API endpoints (Auth)
- React setup with routing
- Tailwind CSS setup
- Database seeder

### 🚧 In Progress
- Product management API
- Sales/POS module
- Inventory management
- Financial module

### 📋 To Do
- Dashboard with charts
- Reports & export
- Admin panel UI
- Advanced features

---

## 📝 License

MIT License

---

**Dibuat dengan ❤️ untuk Retail Indonesia**

Last Updated: June 21, 2026


Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework.

In addition, [Laracasts](https://laracasts.com) contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

You can also watch bite-sized lessons with real-world projects on [Laravel Learn](https://laravel.com/learn), where you will be guided through building a Laravel application from scratch while learning PHP fundamentals.

## Agentic Development

Laravel's predictable structure and conventions make it ideal for AI coding agents like Claude Code, Cursor, and GitHub Copilot. Install [Laravel Boost](https://laravel.com/docs/ai) to supercharge your AI workflow:

```bash
composer require laravel/boost --dev

php artisan boost:install
```

Boost provides your agent 15+ tools and skills that help agents build Laravel applications while following best practices.

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
