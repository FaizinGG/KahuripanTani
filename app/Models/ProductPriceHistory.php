<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductPriceHistory extends Model
{
    protected $fillable = [
        'product_id',
        'user_id',
        'price_type',
        'old_price',
        'new_price',
        'reason',
        'notes',
        'changed_at',
    ];

    protected $casts = [
        'old_price' => 'integer',
        'new_price' => 'integer',
        'changed_at' => 'datetime',
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
}
