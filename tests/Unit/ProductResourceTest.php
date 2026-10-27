<?php

namespace Tests\Unit;

use App\Http\Resources\ProductResource;
use App\Models\Product;
use Tests\TestCase;

class ProductResourceTest extends TestCase
{
    public function test_product_resource_returns_zero_stock_when_stock_relation_is_missing(): void
    {
        $product = new Product([
            'id' => 1,
            'barcode' => 'TEST-001',
            'sku' => 'TEST-001',
            'name' => 'Test Product',
            'category_id' => 1,
            'supplier_id' => 1,
            'unit' => 'pcs',
            'price_cost' => 100,
            'price_retail' => 200,
            'price_reseller_small' => 180,
            'price_reseller_large' => 160,
            'price_employee' => 150,
            'stock' => 0,
            'minimum_stock' => 5,
            'is_active' => true,
            'description' => 'Sample',
        ]);

        $resource = new ProductResource($product);
        $data = $resource->resolve();

        $this->assertSame(0, $data['current_stock']);
        $this->assertSame(5, $data['minimal_stock']);
    }
}
