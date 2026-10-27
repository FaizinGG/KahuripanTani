<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'phone',
        'email',
        'address',
        'city',
        'province',
        'type',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Relationships
    public function membership()
    {
        return $this->hasOne(Membership::class);
    }

    public function points()
    {
        return $this->hasMany(CustomerPoint::class);
    }

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }

    public function receivables()
    {
        return $this->hasMany(Receivable::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
