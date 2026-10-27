<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->unique()->constrained()->cascadeOnDelete();
            $table->enum('level', ['silver', 'gold', 'platinum'])->default('silver');
            $table->unsignedBigInteger('discount_percentage')->default(0);
            $table->unsignedBigInteger('total_spent')->default(0);
            $table->unsignedBigInteger('loyalty_points')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamp('joined_at');
            $table->timestamps();

            $table->index('level');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('memberships');
    }
};
