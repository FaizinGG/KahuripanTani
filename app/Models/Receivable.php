<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Receivable extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'customer_id',
        'sale_id',
        'amount',
        'paid_amount',
        'status',
        'due_date',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'integer',
        'paid_amount' => 'integer',
        'due_date' => 'date',
    ];

    // Relationships
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function payments()
    {
        return $this->hasMany(ReceivablePayment::class)->orderBy('paid_at', 'desc');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
