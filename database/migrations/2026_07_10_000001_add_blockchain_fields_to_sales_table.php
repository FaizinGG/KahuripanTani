<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->string('blockchain_hash', 64)->nullable()->after('status');
            $table->string('blockchain_previous_hash', 64)->nullable()->after('blockchain_hash');
            $table->timestamp('blockchain_verified_at')->nullable()->after('blockchain_previous_hash');
        });

        $sales = \App\Models\Sale::query()
            ->orderBy('id')
            ->get();

        $previousHash = null;

        foreach ($sales as $sale) {
            $hash = $sale->generateBlockchainHash();
            $sale->forceFill([
                'blockchain_hash' => $hash,
                'blockchain_previous_hash' => $previousHash,
                'blockchain_verified_at' => $sale->created_at ?? now(),
            ])->saveQuietly();
            $previousHash = $hash;
        }
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['blockchain_hash', 'blockchain_previous_hash', 'blockchain_verified_at']);
        });
    }
};
