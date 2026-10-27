<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Receivable;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SalePaymentFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_separate_debt_sales_keep_distinct_invoices_for_same_customer(): void
    {
        $user = User::factory()->create();
        $role = Role::create(['name' => 'owner']);
        $permission = Permission::firstOrCreate(['name' => 'sale.create']);
        $role->givePermissionTo($permission);
        $user->assignRole($role);

        $category = Category::create([
            'name' => 'Debt Category',
            'slug' => 'debt-category',
            'is_active' => true,
        ]);
        $product = Product::create([
            'name' => 'Debt Product',
            'sku' => 'DEBT-001',
            'category_id' => $category->id,
            'cost_price' => 7000,
            'retail_price' => 10000,
            'price_cost' => 7000,
            'price_retail' => 10000,
            'stock' => 10,
            'minimum_stock' => 2,
            'is_active' => true,
        ]);
        $customer = Customer::create([
            'name' => 'Budi',
            'phone' => '08123456789',
            'type' => 'retail',
            'is_active' => true,
        ]);

        $payload = [
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 1,
                'price' => 10000,
            ]],
            'subtotal' => 10000,
            'discount_amount' => 0,
            'total_amount' => 10000,
            'payment_method' => 'debt',
            'payment_type' => 'debt',
            'paid_amount' => 0,
            'dibayar' => 0,
            'diskon' => 0,
            'total' => 10000,
            'kembalian' => 0,
            'kekurangan' => 10000,
            'customer_id' => $customer->id,
            'due_date' => now()->addDays(7)->toDateString(),
        ];

        $firstResponse = $this->actingAs($user)->postJson('/api/sales', $payload);
        $secondResponse = $this->actingAs($user)->postJson('/api/sales', $payload);

        $firstResponse->assertCreated();
        $secondResponse->assertCreated();

        $sales = Sale::where('customer_id', $customer->id)->orderBy('id')->get();
        $this->assertCount(2, $sales);
        $this->assertNotSame($sales[0]->invoice_number, $sales[1]->invoice_number);
        $this->assertSame(2, Receivable::where('customer_id', $customer->id)->count());
    }

    public function test_underpaid_sale_with_owner_discount_is_marked_as_paid(): void
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
            'sku' => 'SKU-001',
            'category_id' => $category->id,
            'cost_price' => 7000,
            'retail_price' => 10000,
            'price_cost' => 7000,
            'price_retail' => 10000,
            'stock' => 10,
            'minimum_stock' => 2,
            'is_active' => true,
        ]);

        $response = $this->withoutMiddleware()
            ->actingAs($user)
            ->postJson('/api/sales', [
                'items' => [[
                    'product_id' => $product->id,
                    'quantity' => 1,
                    'price' => 10000,
                ]],
                'subtotal' => 10000,
                'discount_amount' => 0,
                'total_amount' => 10000,
                'payment_method' => 'cash',
                'payment_type' => 'owner_discount',
                'paid_amount' => 8000,
                'change_amount' => 0,
                'dibayar' => 8000,
                'diskon' => 0,
                'total' => 10000,
                'kembalian' => 0,
                'kekurangan' => 2000,
            ]);

        $response->assertCreated()
            ->assertJsonPath('success', true);

        $sale = Sale::latest('id')->first();
        $this->assertNotNull($sale);
        $this->assertSame(2000, $sale->diskon);
        $this->assertSame(8000, $sale->total);
        $this->assertSame('paid', $sale->payment_status);
        $this->assertSame('owner_discount', $sale->payment_type);
    }
}
