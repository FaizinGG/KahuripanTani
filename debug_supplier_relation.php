<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use Illuminate\Support\Facades\Artisan;

Artisan::call('migrate:fresh', ['--seed' => false]);

$supplier = Supplier::factory()->create();
$category = Category::factory()->create();
$product = Product::factory()->create(['supplier_id' => $supplier->id, 'category_id' => $category->id]);

echo 'supplier_id=' . $product->supplier_id . PHP_EOL;
echo 'products_exists=' . ($supplier->products()->exists() ? 'true' : 'false') . PHP_EOL;
echo 'products_count=' . $supplier->products()->count() . PHP_EOL;
