<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Membership;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create roles
        $ownerRole = Role::firstOrCreate(
            ['name' => 'owner'],
            ['display_name' => 'Owner/Pemilik']
        );
        $adminRole = Role::firstOrCreate(
            ['name' => 'admin'],
            ['display_name' => 'Admin/Manager']
        );
        $employeeRole = Role::firstOrCreate(
            ['name' => 'employee'],
            ['display_name' => 'Karyawan/Kasir']
        );

        // Create permissions
        $permissions = [
            'product.create' => 'Tambah Produk',
            'product.read' => 'Lihat Produk',
            'product.update' => 'Edit Produk',
            'product.delete' => 'Hapus Produk',
            'product.view_cost' => 'Lihat Harga Modal',
            'category.create' => 'Tambah Kategori',
            'category.read' => 'Lihat Kategori',
            'category.update' => 'Edit Kategori',
            'category.delete' => 'Hapus Kategori',
            'supplier.create' => 'Tambah Supplier',
            'supplier.read' => 'Lihat Supplier',
            'supplier.update' => 'Edit Supplier',
            'supplier.delete' => 'Hapus Supplier',
            'stock.manage' => 'Kelola Stok',
            'stock.opname' => 'Stok Opname',
            'stock.history' => 'Lihat Histori Stok',
            'sale.create' => 'Buat Penjualan (POS)',
            'sale.read' => 'Lihat Penjualan',
            'sale.cancel' => 'Batalkan Penjualan',
            'sale.return' => 'Retur Barang',
            'discount.create' => 'Buat Diskon',
            'discount.approve' => 'Approve Diskon',
            'user.create' => 'Buat User',
            'user.read' => 'Lihat User',
            'user.update' => 'Edit User',
            'user.delete' => 'Hapus User',
            'user.change_role' => 'Ubah Role User',
            'receivable.manage' => 'Kelola Piutang',
            'debt.manage' => 'Kelola Hutang',
            'report.view' => 'Lihat Laporan',
            'report.export' => 'Export Laporan',
            'setting.manage' => 'Kelola Setting',
        ];

        foreach ($permissions as $name => $displayName) {
            Permission::firstOrCreate(
                ['name' => $name],
                ['display_name' => $displayName]
            );
        }

        // Assign permissions to roles
        $ownerRole->syncPermissions(Permission::all());

        $adminPermissions = [
            'product.create', 'product.read', 'product.update', 'product.delete',
            'category.create', 'category.read', 'category.update', 'category.delete',
            'supplier.create', 'supplier.read', 'supplier.update', 'supplier.delete',
            'stock.manage', 'stock.opname', 'stock.history',
            'sale.create', 'sale.read',
            'discount.create', 'discount.approve',
            'user.create', 'user.read', 'user.update',
            'receivable.manage', 'debt.manage',
            'report.view', 'report.export',
        ];
        $adminRole->syncPermissions($adminPermissions);

        $employeePermissions = [
            'product.read',
            'sale.create', 'sale.read', 'sale.return',
            'discount.create',
            'report.view',
        ];
        $employeeRole->syncPermissions($employeePermissions);

        // Create test users
        $owner = User::firstOrCreate(
            ['email' => 'owner@retailpos.local'],
            [
                'name' => 'Pemilik Toko',
                'password' => bcrypt('password123'),
                'phone' => '081234567890',
                'address' => 'Jl. Main Street No.1',
            ]
        );
        $owner->assignRole($ownerRole);

        $admin = User::firstOrCreate(
            ['email' => 'admin@retailpos.local'],
            [
                'name' => 'Manager Toko',
                'password' => bcrypt('password123'),
                'phone' => '082234567890',
                'address' => 'Jl. Main Street No.1',
            ]
        );
        $admin->assignRole($adminRole);

        for ($i = 1; $i <= 3; $i++) {
            $employee = User::firstOrCreate(
                ['email' => "kasir$i@retailpos.local"],
                [
                    'name' => 'Kasir ' . $i,
                    'password' => bcrypt('password123'),
                    'phone' => '08' . str_pad($i, 10, '0', STR_PAD_LEFT),
                ]
            );
            $employee->assignRole($employeeRole);
        }

        // Create categories
        $categories = [
            ['name' => 'Minuman', 'slug' => 'minuman'],
            ['name' => 'Makanan', 'slug' => 'makanan'],
            ['name' => 'Elektronik', 'slug' => 'elektronik'],
        ];

        foreach ($categories as $catData) {
            Category::create(array_merge($catData, ['display_order' => 0]));
        }

        // Create suppliers
        $suppliers = [
            ['name' => 'PT Sinar Jaya', 'code' => 'SUP001', 'phone' => '02112345678', 'is_active' => true],
            ['name' => 'CV Maju Bersama', 'code' => 'SUP002', 'phone' => '02187654321', 'is_active' => true],
        ];

        foreach ($suppliers as $supData) {
            Supplier::firstOrCreate(
                ['code' => $supData['code']],
                $supData
            );
        }

        // Create sample products
        $categoryIds = Category::pluck('id')->toArray();
        $supplierIds = Supplier::pluck('id')->toArray();

        $products = [
            [
                'barcode' => '8992234567890',
                'sku' => 'SKU001',
                'name' => 'Aqua 600ml',
                'category_id' => $categoryIds[0],
                'supplier_id' => $supplierIds[0],
                'unit' => 'botol',
                'cost_price' => 2500,
                'retail_price' => 3000,
                'small_reseller_price' => 2800,
                'large_reseller_price' => 2700,
                'employee_price' => 2600,
                'stock' => 50,
                'minimum_stock' => 10,
            ],
            [
                'barcode' => '8992345678901',
                'sku' => 'SKU002',
                'name' => 'Coca Cola 1L',
                'category_id' => $categoryIds[0],
                'supplier_id' => $supplierIds[0],
                'unit' => 'botol',
                'cost_price' => 8000,
                'retail_price' => 10000,
                'small_reseller_price' => 9500,
                'large_reseller_price' => 9000,
                'employee_price' => 8500,
                'stock' => 30,
                'minimum_stock' => 5,
            ],
        ];

        foreach ($products as $prodData) {
            Product::create(array_merge($prodData, ['is_active' => true]));
        }

        // Seed membership levels
        $this->call(\Database\Seeders\MembershipLevelsSeeder::class);

        // Create sample customers
        for ($i = 1; $i <= 5; $i++) {
            $customer = Customer::create([
                'name' => 'Pelanggan ' . $i,
                'phone' => '081' . str_pad($i, 9, '0', STR_PAD_LEFT),
                'type' => 'retail',
                'is_active' => true,
            ]);

            Membership::create([
                'customer_id' => $customer->id,
                'level' => 'silver',
                'joined_at' => now(),
            ]);
        }

        $this->command->info('✅ Database seeded successfully!');
        $this->command->info('Owner: owner@retailpos.local / password123');
        $this->command->info('Admin: admin@retailpos.local / password123');
        $this->command->info('Kasir: kasir1@retailpos.local / password123');
    }
}
