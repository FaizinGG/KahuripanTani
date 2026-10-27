<?php

namespace Tests\Unit;

use App\Models\Sale;
use PHPUnit\Framework\TestCase;

class SaleBlockchainTest extends TestCase
{
    public function test_sale_blockchain_hash_is_stable_for_same_payload(): void
    {
        $sale = new Sale([
            'invoice_number' => 'INV-20260710-0001',
            'total_amount' => 150000,
            'payment_status' => 'paid',
            'status' => 'completed',
            'created_at' => '2026-07-10 10:00:00',
        ]);

        $firstHash = $sale->generateBlockchainHash();
        $secondHash = $sale->generateBlockchainHash();

        $this->assertSame($firstHash, $secondHash);
        $this->assertMatchesRegularExpression('/^[a-f0-9]{64}$/', $firstHash);
    }
}
