<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Debt extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'supplier_id',
        'amount',
        'paid_amount',
        'status',
        'due_date',
        'reference_number',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'integer',
        'paid_amount' => 'integer',
        'due_date' => 'date',
    ];

    // Relationships
    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function payments()
    {
        return $this->hasMany(DebtPayment::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
