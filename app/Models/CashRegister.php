<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CashRegister extends Model
{
    protected $fillable = [
        'user_id',
        'opening_balance',
        'opened_at',
        'closing_balance',
        'closed_at',
        'total_sales',
        'total_cash_in',
        'total_cash_out',
        'cash_difference',
        'status',
        'notes',
    ];

    protected $casts = [
        'opening_balance' => 'integer',
        'closing_balance' => 'integer',
        'total_sales' => 'integer',
        'total_cash_in' => 'integer',
        'total_cash_out' => 'integer',
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    public function scopeClosed($query)
    {
        return $query->where('status', 'closed');
    }
}
