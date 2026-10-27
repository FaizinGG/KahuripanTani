<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promotions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            
            $table->enum('type', ['product', 'category', 'total'])->default('product');
            $table->foreignId('product_id')->nullable()->constrained()->setOnDelete('set null');
            $table->foreignId('category_id')->nullable()->constrained()->setOnDelete('set null');
            
            $table->enum('discount_type', ['fixed', 'percentage'])->default('fixed');
            $table->unsignedBigInteger('discount_value');
            
            $table->date('start_date');
            $table->date('end_date')->nullable();
            
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            
            $table->integer('max_usage')->nullable();
            $table->integer('usage_count')->default(0);
            
            $table->boolean('is_active')->default(true);
            $table->text('conditions')->nullable();
            
            $table->timestamps();
            $table->softDeletes();

            $table->index('code');
            $table->index('is_active');
            $table->index('start_date');
            $table->index('end_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promotions');
    }
};
