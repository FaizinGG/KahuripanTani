<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class QrisPaymentFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_qris_requires_manual_confirmation_and_uploaded_image(): void
    {
        Storage::fake('public');
        $user = $this->createUserWithRole('owner', ['sale.create']);
        $payload = $this->salePayload();

        $this->actingAs($user)->postJson('/api/sales', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('qris_confirmed');

        $payload['qris_confirmed'] = true;
        $this->actingAs($user)->postJson('/api/sales', $payload)
            ->assertUnprocessable()
            ->assertJsonPath('message', 'QRIS belum dikonfigurasi. Silakan upload gambar QRIS terlebih dahulu melalui Pengaturan Pembayaran.');

        $this->assertSame(0, Sale::count());
    }

    public function test_confirmed_qris_sale_is_paid_for_the_full_total(): void
    {
        Storage::fake('public');
        $user = $this->createUserWithRole('owner', ['sale.create']);
        $this->actingAs($user)->post('/api/payment-settings/qris', [
            'qris_image' => $this->qrisUpload(),
        ])->assertOk()->assertJsonPath('data.configured', true);

        $this->actingAs($user)->postJson('/api/sales', $this->salePayload() + ['qris_confirmed' => true])
            ->assertCreated()
            ->assertJsonPath('data.payment_method', 'qris')
            ->assertJsonPath('data.payment_status', 'paid')
            ->assertJsonPath('data.payment_type', 'full_payment')
            ->assertJsonPath('data.paid_amount', 25000);

        $this->assertDatabaseHas('sales', [
            'payment_method' => 'qris',
            'payment_status' => 'paid',
            'paid_amount' => 25000,
            'total_amount' => 25000,
        ]);

        $this->actingAs($user)->deleteJson('/api/payment-settings/qris')
            ->assertOk()
            ->assertJsonPath('data.configured', false)
            ->assertJsonPath('data.image_url', null);
    }

    public function test_cashier_can_view_but_cannot_change_qris_configuration(): void
    {
        Storage::fake('public');
        $user = $this->createUserWithRole('kasir', []);

        $this->actingAs($user)->getJson('/api/payment-settings/qris')
            ->assertOk()
            ->assertJsonPath('data.configured', false)
            ->assertJsonPath('data.image_url', null);

        $this->actingAs($user)->post('/api/payment-settings/qris', [
            'qris_image' => $this->qrisUpload(),
        ])->assertForbidden();
    }

    public function test_qris_upload_rejects_non_image_files_with_clear_validation_message(): void
    {
        Storage::fake('public');
        $user = $this->createUserWithRole('owner', []);

        $this->actingAs($user)->post('/api/payment-settings/qris', [
            'qris_image' => UploadedFile::fake()->create('qris.jpg', 1, 'text/plain'),
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('qris_image')
            ->assertJsonPath('errors.qris_image.0', 'File QRIS harus berupa gambar yang valid.');
    }

    private function createUserWithRole(string $roleName, array $permissions): User
    {
        $user = User::factory()->create();
        $role = Role::firstOrCreate(['name' => $roleName]);
        foreach ($permissions as $permissionName) {
            $role->givePermissionTo(Permission::firstOrCreate(['name' => $permissionName]));
        }
        $user->assignRole($role);

        return $user;
    }

    private function salePayload(): array
    {
        $category = Category::create([
            'name' => 'QRIS Category',
            'slug' => 'qris-category',
            'is_active' => true,
        ]);
        $product = Product::create([
            'name' => 'QRIS Product',
            'sku' => 'QRIS-001',
            'category_id' => $category->id,
            'cost_price' => 15000,
            'retail_price' => 25000,
            'price_cost' => 15000,
            'price_retail' => 25000,
            'stock' => 5,
            'minimum_stock' => 1,
            'is_active' => true,
        ]);

        return [
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 1,
                'price' => 25000,
            ]],
            'subtotal' => 25000,
            'discount_amount' => 0,
            'total_amount' => 25000,
            'payment_method' => 'qris',
            'payment_type' => 'full_payment',
            'paid_amount' => 0,
            'dibayar' => 0,
            'diskon' => 0,
            'total' => 25000,
            'kembalian' => 0,
            'kekurangan' => 25000,
        ];
    }

    private function qrisUpload(): UploadedFile
    {
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pU8AAAAASUVORK5CYII=');

        return UploadedFile::fake()->createWithContent('qris.png', $png);
    }
}