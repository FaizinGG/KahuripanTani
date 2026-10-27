<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Http\Controllers\SupplierController;
use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use Illuminate\Support\Facades\Artisan;

Artisan::call('migrate:fresh', ['--seed' => false]);

$supplier = Supplier::factory()->create();
$category = Category::factory()->create();
$product = Product::factory()->create(['supplier_id' => $supplier->id, 'category_id' => $category->id]);

$controller = new SupplierController();
$response = $controller->destroy($supplier);

echo $response->getStatusCode() . PHP_EOL;
echo $response->getContent() . PHP_EOL;
