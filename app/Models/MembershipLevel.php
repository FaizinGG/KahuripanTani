<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MembershipLevel extends Model
{
    protected $table = 'membership_levels';

    protected $fillable = [
        'name',
        'discount_percentage',
        'is_active',
    ];

    protected $casts = [
        'discount_percentage' => 'integer',
        'is_active' => 'boolean',
    ];
}
