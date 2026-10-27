<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerPoint extends Model
{
    protected $fillable = [
        'customer_id',
        'sale_id',
        'points_earned',
        'points_redeemed',
        'balance',
        'type',
        'description',
        'expires_at',
    ];

    protected $casts = [
        'points_earned' => 'integer',
        'points_redeemed' => 'integer',
        'balance' => 'integer',
        'expires_at' => 'datetime',
    ];

    // Relationships
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }
}
