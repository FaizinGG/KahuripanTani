# RetailPOS Pro - Quick Start Guide

## Prerequisites
- PHP 8.3+
- Node.js 18+
- MySQL 8+ (optional, using SQLite by default)
- Composer

## Quick Setup

### Option 1: Automated Setup (Windows)
```batch
setup.bat
```

### Option 2: Manual Setup

#### 1. Install Dependencies
```bash
# PHP dependencies
composer install

# JavaScript dependencies
npm install
```

#### 2. Setup Database
```bash
# Generate app key
php artisan key:generate

# Run migrations & seeds
php artisan migrate --seed
```

#### 3. Build Frontend
```bash
npm run build
```

## Running the Application

### Terminal 1: Start Laravel Server
```bash
php artisan serve
# Server akan run di http://localhost:8000
```

### Terminal 2: Start Vite Dev Server
```bash
npm run dev
# Dev server akan run di http://localhost:5173
```

### Open in Browser
```
http://localhost:5173
```

## Test Credentials

### Owner Account
- Email: `owner@retailpos.local`
- Password: `password123`

### Admin Account
- Email: `admin@retailpos.local`
- Password: `password123`

### Employee Account
- Email: `kasir1@retailpos.local`
- Password: `password123`

## Project Structure

```
kahuripantanipos/
├── app/
│   ├── Http/
│   │   ├── Controllers/       # API Controllers
│   │   ├── Requests/          # Form Validations
│   │   └── Resources/         # API Response Resources
│   └── Models/                # Eloquent Models
├── database/
│   ├── migrations/            # Database Migrations
│   └── seeders/               # Database Seeders
├── routes/
│   ├── api.php                # API Routes
│   └── web.php                # Web Routes
├── resources/
│   └── js/
│       ├── pages/             # React Pages
│       ├── components/        # React Components
│       ├── contexts/          # React Context
│       └── App.jsx            # Main React App
└── storage/
    └── app/                   # Application Storage
```

## Key Features Implemented

✅ **Authentication**
- Login/Logout with JWT (Sanctum)
- Role-based access control (Owner, Admin, Employee)
- Session management

✅ **API Endpoints**
- Products CRUD
- Categories Management
- Sales/POS
- Customer Management
- Stock Management
- Authentication

✅ **Frontend Pages**
- Dashboard
- Point of Sale (POS)
- Product List
- Protected Routes
- Role-based Navigation

✅ **Database**
- 25 Database Tables
- Complete Migrations
- Test Data Seeder
- RBAC System

## API Documentation

### Authentication
```
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
POST /api/auth/refresh
```

### Products
```
GET /api/products
POST /api/products
GET /api/products/{id}
PUT /api/products/{id}
DELETE /api/products/{id}
GET /api/products/barcode/{barcode}
POST /api/products/bulk-update
```

### Sales
```
GET /api/sales
POST /api/sales
GET /api/sales/{id}
POST /api/sales/{id}/cancel
POST /api/sales/{id}/return
```

### Customers
```
GET /api/customers
POST /api/customers
GET /api/customers/{id}
PUT /api/customers/{id}
GET /api/customers/phone/{phone}
```

### Stock Management
```
GET /api/stocks
GET /api/stocks/low-stock
POST /api/stocks/adjust
GET /api/stocks/movements
```

## Environment Setup

Copy `.env.example` to `.env` and configure:
```
APP_NAME=RetailPOS
APP_ENV=local
APP_KEY=base64:... (auto-generated)
APP_DEBUG=true
APP_URL=http://localhost

DB_CONNECTION=sqlite
# Or use MySQL:
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=retail_pos
# DB_USERNAME=root
# DB_PASSWORD=
```

## Troubleshooting

### Issue: "Class not found" error
```bash
composer dump-autoload
php artisan config:cache
```

### Issue: Database connection failed
- Verify MySQL is running
- Check `.env` database credentials
- Run `php artisan migrate`

### Issue: Vite dev server not working
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Issue: Permission denied on Laravel
```bash
chmod -R 775 storage bootstrap/cache
```

## Next Steps

### Immediate (Phase 6-7)
- [ ] Create Supplier Management API
- [ ] Create Discount Management
- [ ] Create Attendance System
- [ ] Add more React pages for Admin

### Short-term (Phase 8-9)
- [ ] Complete POS Interface
- [ ] Add Receipt Printing
- [ ] Dashboard with Charts
- [ ] Inventory Management

### Medium-term (Phase 10-11)
- [ ] Report Generation (PDF/Excel)
- [ ] Mobile Responsive Design
- [ ] Advanced Search & Filters
- [ ] Multi-warehouse Support

### Long-term (Phase 12+)
- [ ] Docker Deployment
- [ ] Unit & Integration Tests
- [ ] Performance Optimization
- [ ] API Documentation (Swagger)
- [ ] User Manual & Training

## Support & Development

For issues or questions, refer to:
- [Laravel Documentation](https://laravel.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)

## License

MIT License - See LICENSE file for details
