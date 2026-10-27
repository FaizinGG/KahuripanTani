<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class MultiPriceSaleFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_sale_item_saves_price_type_and_profit_for_multi_price_transaction(): void
    {
        $user = User::factory()->create();
        $role = Role::create(['name' => 'owner']);
        $permission = Permission::firstOrCreate(['name' => 'sale.create']);
        $role->givePermissionTo($permission);
        $user->assignRole($role);

        $category = Category::create([
            'name' => 'Test Category',
            'slug' => 'test-category',
            'is_active' => true,
        ]);

        $product = Product::create([
            'name' => 'Test Product',
            'sku' => 'SKU-002',
            'category_id' => $category->id,
            'cost_price' => 2000,
            'retail_price' => 3000,
            'reseller_price' => 2800,
            'reseller_besar_price' => 2600,
            'petugas_price' => 2500,
            'sales_price' => 2400,
            'price_cost' => 2000,
            'price_retail' => 3000,
            'price_reseller_small' => 2800,
            'price_reseller_large' => 2600,
            'price_employee' => 2500,
            'price_sales' => 2400,
            'stock' => 10,
            'minimum_stock' => 2,
            'is_active' => true,
        ]);

        $response = $this->withoutMiddleware()
            ->actingAs($user)
            ->postJson('/api/sales', [
                'items' => [[
                    'product_id' => $product->id,
                    'quantity' => 2,
                    'price' => 2800,
                    'price_type' => 'reseller',
                    'cost_price' => 2000,
                ]],
                'subtotal' => 5600,
                'discount_amount' => 0,
                'total_amount' => 5600,
                'payment_method' => 'cash',
                'payment_type' => 'full_payment',
                'paid_amount' => 5600,
                'dibayar' => 5600,
                'diskon' => 0,
                'total' => 5600,
                'kembalian' => 0,
                'kekurangan' => 0,
            ]);

        $response->assertCreated()
            ->assertJsonPath('success', true);

        $sale = Sale::latest('id')->first();
        $saleItem = $sale?->items()->first();

        $this->assertNotNull($saleItem);
        $this->assertSame('reseller', $saleItem->price_type);
        $this->assertSame(2800, $saleItem->selling_price);
        $this->assertSame(2000, $saleItem->cost_price);
        $this->assertSame(1600, $saleItem->profit);
    }
}
