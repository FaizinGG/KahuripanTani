<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('debt_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('debt_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            
            $table->unsignedBigInteger('amount');
            $table->enum('payment_method', ['cash', 'transfer', 'qris'])->default('cash');
            $table->string('reference_number')->nullable();
            
            $table->text('notes')->nullable();
            
            $table->timestamp('paid_at');
            $table->timestamps();

            $table->index('debt_id');
            $table->index('paid_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('debt_payments');
    }
};
