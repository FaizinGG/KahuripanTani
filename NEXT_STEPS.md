# 🚀 Next Steps - RetailPOS Pro Development

Panduan lengkap untuk melanjutkan development ke fase berikutnya.

---

## 📋 Current Status

✅ **Completed:**
- Database design & migrations (25 tables)
- All models dengan relationships
- Authentication system
- Frontend setup dengan React 19
- Basic routing & protection
- Tailwind CSS styling

🚧 **Next Priority:** Phase 6 - API Endpoints & Phase 8 - POS Frontend

---

## 🎯 Immediate Next Steps (Day 1-2)

### 1. Verify Installation Works
```bash
cd kahuripantanipos

# Install & setup
composer install
npm install
php artisan key:generate
php artisan migrate --seed

# Run application
php artisan serve          # Terminal 1 - http://localhost:8000
npm run dev                # Terminal 2 - http://localhost:5173
```

### 2. Test Login
- Open browser → `http://localhost:5173`
- Login dengan: `owner@retailpos.local` / `password123`
- Verify dashboard loads & logout works

### 3. Review Architecture
- Read [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- Read [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)
- Understand the 25 tables & relationships

---

## 📦 Phase 6: API Endpoints (Product Management)

### Step 1: Create Product Repository
```bash
php artisan make:class Repositories/ProductRepository
```

Create `app/Repositories/ProductRepository.php`:
```php
<?php
namespace App\Repositories;

use App\Models\Product;

class ProductRepository
{
    public function all($filters = [])
    {
        $query = Product::active();
        
        if (isset($filters['category'])) {
            $query->where('category_id', $filters['category']);
        }
        
        if (isset($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', "%{$filters['search']}%")
                  ->orWhere('sku', 'like', "%{$filters['search']}%")
                  ->orWhere('barcode', 'like', "%{$filters['search']}%");
            });
        }
        
        return $query->paginate(15);
    }
    
    public function findById($id)
    {
        return Product::findOrFail($id);
    }
    
    public function create(array $data)
    {
        return Product::create($data);
    }
    
    public function update($id, array $data)
    {
        $product = Product::findOrFail($id);
        $product->update($data);
        return $product;
    }
}
```

### Step 2: Create Product Service
```bash
php artisan make:class Services/ProductService
```

Create `app/Services/ProductService.php`:
```php
<?php
namespace App\Services;

use App\Repositories\ProductRepository;

class ProductService
{
    public function __construct(
        protected ProductRepository $repository
    ) {}
    
    public function getProducts($filters = [])
    {
        return $this->repository->all($filters);
    }
    
    public function getProductById($id)
    {
        return $this->repository->findById($id);
    }
    
    public function createProduct(array $data)
    {
        return $this->repository->create($data);
    }
}
```

### Step 3: Create Product Controller
```bash
php artisan make:controller Api/ProductController
```

Create `app/Http/Controllers/Api/ProductController.php`:
```php
<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }
    
    public function index(Request $request)
    {
        $products = Product::when($request->search, function ($q) use ($request) {
            $q->where('name', 'like', "%{$request->search}%")
              ->orWhere('sku', 'like', "%{$request->search}%");
        })
        ->when($request->category_id, function ($q) use ($request) {
            $q->where('category_id', $request->category_id);
        })
        ->active()
        ->paginate(15);
        
        return ProductResource::collection($products);
    }
    
    public function show($id)
    {
        $product = Product::findOrFail($id);
        return new ProductResource($product);
    }
}
```

### Step 4: Create Product Resource
```bash
php artisan make:resource ProductResource
```

Create `app/Http/Resources/ProductResource.php`:
```php
<?php
namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'barcode' => $this->barcode,
            'sku' => $this->sku,
            'name' => $this->name,
            'category' => $this->category->name,
            'supplier' => $this->supplier?->name,
            'prices' => [
                'cost' => $this->cost_price,
                'retail' => $this->retail_price,
                'small_reseller' => $this->small_reseller_price,
                'large_reseller' => $this->large_reseller_price,
                'employee' => $this->employee_price,
            ],
            'stock' => $this->stock,
            'minimum_stock' => $this->minimum_stock,
            'is_active' => $this->is_active,
        ];
    }
}
```

### Step 5: Add Routes
Update `routes/api.php`:
```php
Route::middleware('auth:sanctum')->group(function () {
    // Product routes
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::post('/products', [ProductController::class, 'store'])->middleware('can:product.create');
    Route::put('/products/{id}', [ProductController::class, 'update'])->middleware('can:product.update');
    Route::delete('/products/{id}', [ProductController::class, 'destroy'])->middleware('can:product.delete');
});
```

### Step 6: Test API dengan Postman
```
GET http://localhost:8000/api/products
Authorization: Bearer {token}
```

---

## 🎨 Phase 7-8: Frontend - Product Management Page

### Step 1: Create API Service
Create `resources/js/services/api.js`:
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const productAPI = {
  getAll: (filters = {}) => api.get('/products', { params: filters }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export default api;
```

### Step 2: Create Product List Page
Create `resources/js/pages/Products/ProductListPage.jsx`:
```javascript
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productAPI } from '../../services/api';

export default function ProductListPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => productAPI.getAll({ search }),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Manajemen Produk</h1>
      
      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cari produk..."
        className="w-full px-4 py-2 border rounded mb-6"
      />
      
      {/* Products Table */}
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left">SKU</th>
              <th className="px-6 py-3 text-left">Nama</th>
              <th className="px-6 py-3 text-left">Kategori</th>
              <th className="px-6 py-3 text-right">Stok</th>
              <th className="px-6 py-3 text-right">Harga</th>
              <th className="px-6 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data?.data?.map((product) => (
              <tr key={product.id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-3">{product.sku}</td>
                <td className="px-6 py-3">{product.name}</td>
                <td className="px-6 py-3">{product.category}</td>
                <td className="px-6 py-3 text-right">{product.stock}</td>
                <td className="px-6 py-3 text-right">Rp {product.prices.retail.toLocaleString('id-ID')}</td>
                <td className="px-6 py-3 text-center">
                  <a href={`/products/${product.id}/edit`} className="text-blue-600 hover:underline">
                    Edit
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### Step 3: Add Route to App.jsx
```javascript
import ProductListPage from './pages/Products/ProductListPage';

// In Routes:
<Route
  path="products"
  element={
    <RoleRoute requiredRoles={['owner', 'admin']}>
      <ProductListPage />
    </RoleRoute>
  }
/>
```

---

## 🏪 Phase 9: POS Module

### Key Files to Create:
1. `POS/POSPage.jsx` - Main POS interface
2. `POS/ProductSelector.jsx` - Barcode scanner & product search
3. `POS/Cart.jsx` - Shopping cart component
4. `POS/PaymentModal.jsx` - Payment processing
5. `services/posService.js` - POS API integration

### Key Features:
```
- Barcode scanning (js-barcode)
- Product search real-time
- Quick add to cart
- Quantity adjustment
- Discount application
- Payment methods (cash, transfer, QRIS, debt)
- Receipt printing
- Transaction history
```

---

## 🔧 Development Commands Reference

```bash
# Database
php artisan migrate                    # Run migrations
php artisan migrate:fresh --seed       # Reset & seed
php artisan tinker                     # Interactive shell

# Code Generation
php artisan make:model ModelName -m    # Model + migration
php artisan make:controller ControllerName
php artisan make:request RequestName
php artisan make:resource ResourceName
php artisan make:policy PolicyName

# Frontend
npm run dev                            # Dev server
npm run build                          # Production build
npm run preview                        # Preview build

# Utilities
php artisan cache:clear
php artisan config:cache
php artisan storage:link
```

---

## 📚 Learning Resources

### Laravel
- [Laravel Documentation](https://laravel.com/docs)
- [Sanctum Authentication](https://laravel.com/docs/sanctum)
- [Spatie Permission](https://spatie.be/docs/laravel-permission)

### React
- [React Documentation](https://react.dev)
- [React Router](https://reactrouter.com)
- [TanStack Query](https://tanstack.com/query/)

### CSS
- [Tailwind CSS](https://tailwindcss.com)
- [Shadcn UI](https://ui.shadcn.com)

---

## ✅ Completion Checklist

Before moving to next phase:

- [ ] All API endpoints created & tested
- [ ] Frontend pages created for all modules
- [ ] Forms with validation working
- [ ] Error handling implemented
- [ ] Loading states displayed
- [ ] Responsive design verified
- [ ] Protected routes working
- [ ] Role-based access verified

---

## 🎯 Priority Order for Next Development

1. **High Priority:**
   - [ ] Product Management API + Frontend
   - [ ] Category & Supplier APIs
   - [ ] POS Module (Kasir interface)
   - [ ] Sales API & Frontend

2. **Medium Priority:**
   - [ ] Inventory Management
   - [ ] Customer Management
   - [ ] Dashboard with charts
   - [ ] Reports module

3. **Low Priority:**
   - [ ] Email notifications
   - [ ] SMS integration
   - [ ] Mobile app
   - [ ] Advanced analytics

---

## 💡 Best Practices to Follow

1. **API Development:**
   - Always use repositories & services
   - Validate input with Form Requests
   - Return proper HTTP status codes
   - Use Resources for response formatting

2. **Frontend Development:**
   - Keep components small & reusable
   - Use custom hooks for logic
   - Handle loading & error states
   - Show user feedback (toast notifications)

3. **Database:**
   - Use soft deletes for important data
   - Create proper indexes
   - Add foreign key constraints
   - Track changes with audit logs

4. **Security:**
   - Validate all inputs
   - Check permissions in API
   - Use HTTPS in production
   - Keep dependencies updated

---

**Happy Coding! 🚀**

For questions or issues, refer to:
- [INSTALLATION.md](./INSTALLATION.md)
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)
