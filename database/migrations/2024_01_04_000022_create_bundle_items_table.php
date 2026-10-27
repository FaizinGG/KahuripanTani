<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bundle_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bundle_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained();
            
            $table->integer('quantity')->default(1);
            
            $table->timestamps();

            $table->index('bundle_id');
            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bundle_items');
    }
};
