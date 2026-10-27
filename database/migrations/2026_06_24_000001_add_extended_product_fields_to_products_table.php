<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'sales_price')) {
                $table->unsignedBigInteger('sales_price')->default(0)->after('employee_price');
            }

            if (!Schema::hasColumn('products', 'brand')) {
                $table->string('brand')->nullable()->after('unit');
            }

            if (!Schema::hasColumn('products', 'rack_location')) {
                $table->string('rack_location')->nullable()->after('brand');
            }

            if (!Schema::hasColumn('products', 'notes')) {
                $table->text('notes')->nullable()->after('description');
            }

            $table->string('sku')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'sales_price')) {
                $table->dropColumn('sales_price');
            }

            if (Schema::hasColumn('products', 'brand')) {
                $table->dropColumn('brand');
            }

            if (Schema::hasColumn('products', 'rack_location')) {
                $table->dropColumn('rack_location');
            }

            if (Schema::hasColumn('products', 'notes')) {
                $table->dropColumn('notes');
            }
        });
    }
};
