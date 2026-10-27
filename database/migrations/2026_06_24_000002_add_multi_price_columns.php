<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'reseller_price')) {
                $table->unsignedBigInteger('reseller_price')->default(0)->after('retail_price');
            }

            if (!Schema::hasColumn('products', 'reseller_besar_price')) {
                $table->unsignedBigInteger('reseller_besar_price')->default(0)->after('reseller_price');
            }

            if (!Schema::hasColumn('products', 'petugas_price')) {
                $table->unsignedBigInteger('petugas_price')->default(0)->after('reseller_besar_price');
            }
        });

        Schema::table('sale_items', function (Blueprint $table) {
            if (!Schema::hasColumn('sale_items', 'price_type')) {
                $table->string('price_type')->nullable()->after('product_id');
            }

            if (!Schema::hasColumn('sale_items', 'selling_price')) {
                $table->unsignedBigInteger('selling_price')->default(0)->after('price_type');
            }

            if (!Schema::hasColumn('sale_items', 'profit')) {
                $table->unsignedBigInteger('profit')->default(0)->after('selling_price');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'reseller_price')) {
                $table->dropColumn('reseller_price');
            }

            if (Schema::hasColumn('products', 'reseller_besar_price')) {
                $table->dropColumn('reseller_besar_price');
            }

            if (Schema::hasColumn('products', 'petugas_price')) {
                $table->dropColumn('petugas_price');
            }
        });

        Schema::table('sale_items', function (Blueprint $table) {
            if (Schema::hasColumn('sale_items', 'price_type')) {
                $table->dropColumn('price_type');
            }

            if (Schema::hasColumn('sale_items', 'selling_price')) {
                $table->dropColumn('selling_price');
            }

            if (Schema::hasColumn('sale_items', 'profit')) {
                $table->dropColumn('profit');
            }
        });
    }
};
