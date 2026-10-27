<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockOpname extends Model
{
    protected $fillable = [
        'product_id',
        'user_id',
        'system_quantity',
        'physical_quantity',
        'status',
        'notes',
        'approved_by',
        'approved_at',
        'approval_notes',
    ];

    protected $casts = [
        'system_quantity' => 'integer',
        'physical_quantity' => 'integer',
        'approved_at' => 'datetime',
    ];

    // Relationships
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
