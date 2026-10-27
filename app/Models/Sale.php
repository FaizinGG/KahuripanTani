<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sale extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'invoice_number',
        'user_id',
        'customer_id',
        'subtotal',
        'discount_amount',
        'diskon',
        'discount_percentage',
        'tax_amount',
        'tax_percentage',
        'total_amount',
        'total',
        'payment_method',
        'payment_type',
        'paid_amount',
        'dibayar',
        'change_amount',
        'kembalian',
        'kekurangan',
        'payment_status',
        'status',
        'notes',
        'customer_notes',
        'total_cost',
        'completed_at',
        'blockchain_hash',
        'blockchain_previous_hash',
        'blockchain_verified_at',
    ];

    protected $casts = [
        'subtotal' => 'integer',
        'discount_amount' => 'integer',
        'diskon' => 'integer',
        'tax_amount' => 'integer',
        'total_amount' => 'integer',
        'total' => 'integer',
        'paid_amount' => 'integer',
        'dibayar' => 'integer',
        'change_amount' => 'integer',
        'kembalian' => 'integer',
        'kekurangan' => 'integer',
        'total_cost' => 'integer',
        'completed_at' => 'datetime',
        'blockchain_verified_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function receivable()
    {
        return $this->hasOne(Receivable::class);
    }

    public function getProfit()
    {
        return $this->total_amount - $this->total_cost;
    }

    public function generateBlockchainHash(): string
    {
        $payload = [
            'invoice_number' => $this->invoice_number,
            'customer_id' => $this->customer_id,
            'user_id' => $this->user_id,
            'subtotal' => (int) ($this->subtotal ?? 0),
            'discount_amount' => (int) ($this->discount_amount ?? 0),
            'total_amount' => (int) ($this->total_amount ?? 0),
            'payment_status' => $this->payment_status,
            'status' => $this->status,
            'created_at' => $this->created_at?->toDateTimeString() ?? $this->attributes['created_at'] ?? null,
        ];

        $normalized = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        return hash('sha256', $normalized ?? serialize($payload));
    }

    public function attachBlockchainMetadata(?string $previousHash = null): void
    {
        $hash = $this->generateBlockchainHash();

        $this->forceFill([
            'blockchain_hash' => $hash,
            'blockchain_previous_hash' => $previousHash,
            'blockchain_verified_at' => now(),
        ]);
    }
}
