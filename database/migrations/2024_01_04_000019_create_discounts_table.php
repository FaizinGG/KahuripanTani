<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('discounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->nullable()->constrained()->setOnDelete('set null');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users');
            
            $table->unsignedBigInteger('amount');
            $table->decimal('percentage', 5, 2)->default(0);
            $table->string('reason')->nullable();
            $table->text('notes')->nullable();
            
            $table->enum('status', ['applied', 'pending_approval', 'approved', 'rejected'])->default('applied');
            $table->timestamp('approved_at')->nullable();
            
            $table->timestamps();
            $table->softDeletes();

            $table->index('user_id');
            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discounts');
    }
};
