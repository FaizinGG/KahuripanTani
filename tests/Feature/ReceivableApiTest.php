<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Category;
use App\Models\Product;
use App\Models\Receivable;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReceivableApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_receivables_index_returns_paginated_data(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;
        $customer = Customer::create([
            'name' => 'Budi',
            'phone' => '08123456789',
            'address' => 'Bandung',
            'type' => 'retail',
            'is_active' => true,
        ]);

        Receivable::create([
            'customer_id' => $customer->id,
            'sale_id' => null,
            'amount' => 250000,
            'paid_amount' => 50000,
            'status' => 'partial',
            'due_date' => now()->addDays(5)->toDateString(),
            'notes' => 'Cicilan 1',
            'created_by' => $user->id,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/receivables');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.customer_active_balance', 200000);
    }

    public function test_active_debtors_aggregate_balances_across_receivables(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;
        $activeCustomer = Customer::create([
            'name' => 'Budi',
            'phone' => '08123456789',
            'type' => 'retail',
            'is_active' => true,
        ]);
        $paidCustomer = Customer::create([
            'name' => 'Citra',
            'phone' => '0811111111',
            'type' => 'retail',
            'is_active' => true,
        ]);

        foreach ([[200000, 50000], [100000, 100000]] as [$amount, $paidAmount]) {
            Receivable::create([
                'customer_id' => $activeCustomer->id,
                'amount' => $amount,
                'paid_amount' => $paidAmount,
                'status' => $paidAmount < $amount ? 'partial' : 'paid',
                'due_date' => now()->addDays(5)->toDateString(),
                'created_by' => $user->id,
            ]);
        }

        Receivable::create([
            'customer_id' => $paidCustomer->id,
            'amount' => 150000,
            'paid_amount' => 150000,
            'status' => 'paid',
            'due_date' => now()->addDays(5)->toDateString(),
            'created_by' => $user->id,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/customers/active-debtors');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $activeCustomer->id)
            ->assertJsonPath('data.0.active_receivable_balance', 150000);

        $customerSearchResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/customers?search=Citra');

        $customerSearchResponse->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $paidCustomer->id);
    }

    public function test_receivable_payment_updates_balance_and_creates_payment_record(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;
        $customer = Customer::create([
            'name' => 'Citra',
            'phone' => '0811111111',
            'address' => 'Jakarta',
            'type' => 'retail',
            'is_active' => true,
        ]);

        $sale = Sale::create([
            'invoice_number' => 'INV-RECEIVABLE-PAYMENT',
            'user_id' => $user->id,
            'customer_id' => $customer->id,
            'subtotal' => 30000,
            'total_amount' => 30000,
            'total' => 30000,
            'payment_method' => 'debt',
            'payment_type' => 'debt',
            'payment_status' => 'pending',
            'status' => 'completed',
        ]);

        $receivable = Receivable::create([
            'customer_id' => $customer->id,
            'sale_id' => $sale->id,
            'amount' => 30000,
            'paid_amount' => 0,
            'status' => 'pending',
            'due_date' => now()->addDays(7)->toDateString(),
            'notes' => 'Pelunasan awal',
            'created_by' => $user->id,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/receivables/' . $receivable->id . '/payments', [
                'amount' => 2000,
                'payment_method' => 'cash',
                'notes' => 'Bayar tunai',
            ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.amount', 30000)
            ->assertJsonPath('data.paid_amount', 2000)
            ->assertJsonPath('data.remaining_amount', 28000)
            ->assertJsonPath('data.status', 'partial')
            ->assertJsonPath('data.payments.0.amount', 2000);

        $receivable->refresh();
        $this->assertSame(2000, $receivable->paid_amount);
        $this->assertSame('partial', $receivable->status);
        $this->assertSame(1, $receivable->payments()->count());
        $this->assertDatabaseHas('sales', [
            'id' => $sale->id,
            'paid_amount' => 2000,
            'dibayar' => 2000,
            'kekurangan' => 28000,
            'payment_status' => 'partial',
        ]);

        $finalPayment = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/receivables/' . $receivable->id . '/payments', [
                'amount' => 28000,
                'payment_method' => 'transfer',
            ]);

        $finalPayment->assertCreated()
            ->assertJsonPath('data.paid_amount', 30000)
            ->assertJsonPath('data.remaining_amount', 0)
            ->assertJsonPath('data.status', 'paid');
        $this->assertSame(2, $receivable->payments()->count());
        $this->assertDatabaseHas('sales', [
            'id' => $sale->id,
            'paid_amount' => 30000,
            'dibayar' => 30000,
            'kekurangan' => 0,
            'payment_status' => 'paid',
        ]);

        $overpayment = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/receivables/' . $receivable->id . '/payments', [
                'amount' => 1,
            ]);

        $overpayment->assertStatus(422);
        $this->assertSame(2, $receivable->payments()->count());
        $this->assertSame(30000, $receivable->fresh()->paid_amount);
    }

    public function test_payment_can_be_allocated_to_one_sale_item(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;
        $customer = Customer::create([
            'name' => 'Budi',
            'phone' => '08123456789',
            'type' => 'retail',
            'is_active' => true,
        ]);
        $category = Category::create([
            'name' => 'Piutang Test',
            'slug' => 'piutang-test',
            'is_active' => true,
        ]);
        $product = Product::create([
            'name' => 'Produk Piutang',
            'sku' => 'PIUTANG-001',
            'category_id' => $category->id,
            'cost_price' => 5000,
            'retail_price' => 100000,
            'price_cost' => 5000,
            'price_retail' => 100000,
            'stock' => 10,
            'minimum_stock' => 1,
            'is_active' => true,
        ]);
        $sale = Sale::create([
            'invoice_number' => 'INV-ITEM-PAYMENT',
            'user_id' => $user->id,
            'customer_id' => $customer->id,
            'subtotal' => 150000,
            'total_amount' => 150000,
            'total' => 150000,
            'payment_method' => 'debt',
            'payment_type' => 'debt',
            'payment_status' => 'pending',
            'status' => 'completed',
        ]);
        $firstItem = SaleItem::create([
            'sale_id' => $sale->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'unit_price' => 100000,
            'selling_price' => 100000,
            'final_price' => 100000,
            'cost_price' => 5000,
        ]);
        SaleItem::create([
            'sale_id' => $sale->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'unit_price' => 50000,
            'selling_price' => 50000,
            'final_price' => 50000,
            'cost_price' => 5000,
        ]);
        $receivable = Receivable::create([
            'customer_id' => $customer->id,
            'sale_id' => $sale->id,
            'amount' => 150000,
            'paid_amount' => 0,
            'status' => 'pending',
            'due_date' => now()->addDays(7)->toDateString(),
            'created_by' => $user->id,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/receivables/' . $receivable->id . '/payments', [
                'amount' => 50000,
                'sale_item_id' => $firstItem->id,
                'payment_method' => 'cash',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.paid_amount', 50000)
            ->assertJsonPath('data.payments.0.sale_item_id', $firstItem->id);

        $overpaymentResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/receivables/' . $receivable->id . '/payments', [
                'amount' => 75000,
                'sale_item_id' => $firstItem->id,
                'payment_method' => 'cash',
            ]);

        $overpaymentResponse->assertStatus(422)
            ->assertJsonPath('message', 'Nominal pembayaran tidak boleh melebihi sisa tagihan.');
        $this->assertSame(50000, $receivable->fresh()->paid_amount);

        $secondResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/receivables/' . $receivable->id . '/payments', [
                'amount' => 25000,
                'sale_item_id' => $firstItem->id,
                'payment_method' => 'cash',
            ]);

        $secondResponse->assertCreated()
            ->assertJsonPath('data.paid_amount', 75000);

        $thirdResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/receivables/' . $receivable->id . '/payments', [
                'amount' => 25000,
                'sale_item_id' => $firstItem->id,
                'payment_method' => 'cash',
            ]);

        $thirdResponse->assertCreated()
            ->assertJsonPath('data.paid_amount', 100000);

        $this->assertDatabaseHas('receivable_payments', [
            'receivable_id' => $receivable->id,
            'sale_item_id' => $firstItem->id,
            'amount' => 50000,
        ]);
        $this->assertSame(3, $receivable->payments()->count());
        $this->assertCount(3, $thirdResponse->json('data.payments'));
    }

    public function test_paid_receivable_can_be_deleted(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;
        $customer = Customer::create([
            'name' => 'Dewi',
            'phone' => '0822222222',
            'address' => 'Surabaya',
            'type' => 'retail',
            'is_active' => true,
        ]);

        $receivable = Receivable::create([
            'customer_id' => $customer->id,
            'sale_id' => null,
            'amount' => 150000,
            'paid_amount' => 150000,
            'status' => 'paid',
            'due_date' => now()->addDays(3)->toDateString(),
            'notes' => 'Lunas',
            'created_by' => $user->id,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->deleteJson('/api/receivables/' . $receivable->id);

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted('receivables', ['id' => $receivable->id]);
    }

    public function test_non_paid_receivable_cannot_be_deleted(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;
        $customer = Customer::create([
            'name' => 'Fajar',
            'phone' => '0833333333',
            'address' => 'Medan',
            'type' => 'retail',
            'is_active' => true,
        ]);

        $receivable = Receivable::create([
            'customer_id' => $customer->id,
            'sale_id' => null,
            'amount' => 200000,
            'paid_amount' => 50000,
            'status' => 'partial',
            'due_date' => now()->addDays(4)->toDateString(),
            'notes' => 'Belum lunas',
            'created_by' => $user->id,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->deleteJson('/api/receivables/' . $receivable->id);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->assertDatabaseHas('receivables', ['id' => $receivable->id, 'status' => 'partial']);
    }
}
