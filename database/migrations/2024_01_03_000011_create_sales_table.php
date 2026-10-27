<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->setOnDelete('set null');
            
            // Amounts
            $table->unsignedBigInteger('subtotal')->default(0);
            $table->unsignedBigInteger('discount_amount')->default(0);
            $table->decimal('discount_percentage', 5, 2)->default(0);
            $table->unsignedBigInteger('tax_amount')->default(0);
            $table->decimal('tax_percentage', 5, 2)->default(0);
            $table->unsignedBigInteger('total_amount')->default(0);
            
            // Payment
            $table->enum('payment_method', ['cash', 'transfer', 'qris', 'debt'])->default('cash');
            $table->unsignedBigInteger('paid_amount')->default(0);
            $table->unsignedBigInteger('change_amount')->default(0);
            $table->enum('payment_status', ['paid', 'pending', 'partial'])->default('paid');
            
            // Status
            $table->enum('status', ['completed', 'returned', 'cancelled'])->default('completed');
            
            // Notes
            $table->text('notes')->nullable();
            $table->text('customer_notes')->nullable();
            
            // Cost calculation for profit
            $table->unsignedBigInteger('total_cost')->default(0);
            
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('invoice_number');
            $table->index('user_id');
            $table->index('customer_id');
            $table->index('payment_method');
            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
