<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('receivable_payments', function (Blueprint $table) {
            $table->foreignId('sale_item_id')
                ->nullable()
                ->after('receivable_id')
                ->constrained('sale_items')
                ->nullOnDelete();

            $table->index('sale_item_id');
        });
    }

    public function down(): void
    {
        Schema::table('receivable_payments', function (Blueprint $table) {
            $table->dropForeign(['sale_item_id']);
            $table->dropIndex(['sale_item_id']);
            $table->dropColumn('sale_item_id');
        });
    }
};
