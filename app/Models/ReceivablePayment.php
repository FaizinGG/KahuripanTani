<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReceivablePayment extends Model
{
    protected $fillable = [
        'receivable_id',
        'sale_item_id',
        'user_id',
        'amount',
        'payment_method',
        'reference_number',
        'notes',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'integer',
        'paid_at' => 'datetime',
    ];

    // Relationships
    public function receivable()
    {
        return $this->belongsTo(Receivable::class);
    }

    public function saleItem()
    {
        return $this->belongsTo(SaleItem::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
