<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_price_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            
            $table->string('price_type'); // 'cost', 'retail', 'small_reseller', 'large_reseller', 'employee'
            $table->unsignedBigInteger('old_price');
            $table->unsignedBigInteger('new_price');
            $table->text('reason')->nullable();
            $table->text('notes')->nullable();
            
            $table->timestamp('changed_at');
            $table->timestamps();

            $table->index('product_id');
            $table->index('price_type');
            $table->index('changed_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_price_histories');
    }
};
