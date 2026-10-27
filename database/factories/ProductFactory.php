<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->word(),
            'sku' => $this->faker->unique()->bothify('SKU###'),
            'barcode' => $this->faker->unique()->ean13(),
            'category_id' => Category::factory(),
            'supplier_id' => Supplier::factory(),
            'unit' => 'PCS',
            'price_cost' => 50000,
            'price_retail' => 75000,
            'price_reseller_small' => 70000,
            'price_reseller_large' => 65000,
            'price_employee' => 68000,
            'price_sales' => 72000,
            'stock' => 10,
            'minimum_stock' => 5,
            'is_active' => true,
        ];
    }
}
