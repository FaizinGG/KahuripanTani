<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('barcode')->unique()->nullable();
            $table->string('sku')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained()->setOnDelete('set null');
            $table->string('unit')->default('pcs');
            
            // Harga
            $table->unsignedBigInteger('cost_price')->default(0);  // Harga modal
            $table->unsignedBigInteger('retail_price')->default(0);  // Harga retail
            $table->unsignedBigInteger('small_reseller_price')->default(0);  // Harga reseller kecil
            $table->unsignedBigInteger('large_reseller_price')->default(0);  // Harga reseller besar
            $table->unsignedBigInteger('employee_price')->default(0);  // Harga karyawan
            
            // Stok
            $table->integer('stock')->default(0);
            $table->integer('minimum_stock')->default(10);
            $table->integer('reorder_quantity')->default(50);
            
            // Media
            $table->string('image_url')->nullable();
            
            // Status
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            
            $table->timestamps();
            $table->softDeletes();

            $table->index('sku');
            $table->index('barcode');
            $table->index('category_id');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
