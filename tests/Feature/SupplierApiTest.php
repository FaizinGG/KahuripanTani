<?php

namespace Tests\Feature;

use App\Http\Controllers\SupplierController;
use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SupplierApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_supplier_index_returns_data_payload(): void
    {
        Supplier::factory()->create(['name' => 'PT Demo Supplier']);

        $response = $this->withoutMiddleware()->getJson('/api/suppliers');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [['id', 'name']],
            ]);
    }

    public function test_supplier_delete_is_blocked_when_products_exist(): void
    {
        $supplier = Supplier::factory()->create();
        $category = Category::factory()->create();
        Product::factory()->create([
            'supplier_id' => $supplier->id,
            'category_id' => $category->id,
        ]);

        $controller = new SupplierController();
        $response = $controller->destroy($supplier);

        $this->assertSame(422, $response->getStatusCode());
        $this->assertSame('Supplier tidak dapat dihapus karena masih digunakan oleh produk', json_decode($response->getContent(), true)['message']);
    }
}
