<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Discount extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'sale_id',
        'user_id',
        'approved_by',
        'amount',
        'percentage',
        'reason',
        'notes',
        'status',
        'approved_at',
    ];

    protected $casts = [
        'amount' => 'integer',
        'approved_at' => 'datetime',
    ];

    // Relationships
    public function sale()
    {
        return $this->belongsTo(Sale::class);
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
