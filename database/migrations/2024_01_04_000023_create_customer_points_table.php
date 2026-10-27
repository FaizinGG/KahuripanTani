<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_points', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sale_id')->nullable()->constrained()->setOnDelete('set null');
            
            $table->integer('points_earned')->default(0);
            $table->integer('points_redeemed')->default(0);
            $table->integer('balance')->default(0);
            
            $table->enum('type', ['earn', 'redeem', 'expire'])->default('earn');
            $table->text('description')->nullable();
            
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index('customer_id');
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_points');
    }
};
