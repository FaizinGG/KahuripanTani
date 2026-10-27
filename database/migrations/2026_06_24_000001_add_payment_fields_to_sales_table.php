<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->unsignedBigInteger('diskon')->default(0);
            $table->unsignedBigInteger('total')->default(0);
            $table->unsignedBigInteger('dibayar')->default(0);
            $table->unsignedBigInteger('kembalian')->default(0);
            $table->unsignedBigInteger('kekurangan')->default(0);
            $table->string('payment_type')->default('full_payment');
        });

        DB::table('sales')->update([
            'diskon' => DB::raw('discount_amount'),
            'total' => DB::raw('total_amount'),
            'dibayar' => DB::raw('paid_amount'),
            'kembalian' => DB::raw('change_amount'),
        ]);
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['diskon', 'total', 'dibayar', 'kembalian', 'kekurangan', 'payment_type']);
        });
    }
};
