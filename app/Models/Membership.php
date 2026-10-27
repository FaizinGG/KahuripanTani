<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Membership extends Model
{
    protected $fillable = [
        'customer_id',
        'total_spent',
        'loyalty_points',
        'is_active',
        'joined_at',
    ];

    protected $casts = [
        'total_spent' => 'integer',
        'loyalty_points' => 'integer',
        'is_active' => 'boolean',
        'joined_at' => 'datetime',
    ];

    // Relationships
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
