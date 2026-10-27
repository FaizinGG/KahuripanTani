<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained();
            
            $table->integer('quantity');
            $table->unsignedBigInteger('unit_price');
            $table->unsignedBigInteger('cost_price'); // Harga modal saat transaksi
            $table->unsignedBigInteger('subtotal')->virtualAs('quantity * unit_price');
            
            $table->unsignedBigInteger('discount_amount')->default(0);
            $table->decimal('discount_percentage', 5, 2)->default(0);
            $table->unsignedBigInteger('final_price')->default(0);
            
            $table->timestamps();

            $table->index('sale_id');
            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_items');
    }
};
