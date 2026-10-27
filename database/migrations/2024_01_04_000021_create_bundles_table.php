<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bundles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            
            $table->unsignedBigInteger('bundle_price');
            $table->unsignedBigInteger('regular_price');
            $table->unsignedBigInteger('savings')->virtualAs('regular_price - bundle_price');
            
            $table->date('start_date');
            $table->date('end_date')->nullable();
            
            $table->integer('max_quantity')->nullable();
            $table->integer('sold_quantity')->default(0);
            
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            
            $table->timestamps();
            $table->softDeletes();

            $table->index('code');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bundles');
    }
};
