<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_registers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            
            $table->unsignedBigInteger('opening_balance');
            $table->timestamp('opened_at');
            
            $table->unsignedBigInteger('closing_balance')->nullable();
            $table->timestamp('closed_at')->nullable();
            
            $table->unsignedBigInteger('total_sales')->default(0);
            $table->unsignedBigInteger('total_cash_in')->default(0);
            $table->unsignedBigInteger('total_cash_out')->default(0);
            
            $table->bigInteger('cash_difference')->nullable();
            
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->text('notes')->nullable();
            
            $table->timestamps();

            $table->index('user_id');
            $table->index('status');
            $table->index('opened_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_registers');
    }
};
