<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Bundle extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'description',
        'bundle_price',
        'regular_price',
        'start_date',
        'end_date',
        'max_quantity',
        'sold_quantity',
        'is_active',
        'is_featured',
    ];

    protected $casts = [
        'bundle_price' => 'integer',
        'regular_price' => 'integer',
        'start_date' => 'date',
        'end_date' => 'date',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
    ];

    // Relationships
    public function items()
    {
        return $this->hasMany(BundleItem::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
