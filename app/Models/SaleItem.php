<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaleItem extends Model
{
    protected $fillable = [
        'sale_id',
        'product_id',
        'price_type',
        'quantity',
        'unit_price',
        'selling_price',
        'cost_price',
        'profit',
        'discount_amount',
        'discount_percentage',
        'final_price',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'integer',
        'selling_price' => 'integer',
        'cost_price' => 'integer',
        'profit' => 'integer',
        'discount_amount' => 'integer',
        'final_price' => 'integer',
    ];

    // Relationships
    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function receivablePayments()
    {
        return $this->hasMany(ReceivablePayment::class);
    }
}
