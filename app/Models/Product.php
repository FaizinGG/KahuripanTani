<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'barcode',
        'sku',
        'name',
        'description',
        'category_id',
        'supplier_id',
        'unit',
        'cost_price',
        'retail_price',
        'reseller_price',
        'reseller_besar_price',
        'petugas_price',
        'small_reseller_price',
        'large_reseller_price',
        'employee_price',
        'sales_price',
        'price_cost',
        'price_retail',
        'price_reseller_small',
        'price_reseller_large',
        'price_employee',
        'price_sales',
        'stock',
        'minimum_stock',
        'minimal_stock',
        'reorder_quantity',
        'image_url',
        'brand',
        'rack_location',
        'notes',
        'is_active',
        'is_featured',
    ];

    protected $casts = [
        'cost_price' => 'integer',
        'retail_price' => 'integer',
        'reseller_price' => 'integer',
        'reseller_besar_price' => 'integer',
        'petugas_price' => 'integer',
        'small_reseller_price' => 'integer',
        'large_reseller_price' => 'integer',
        'employee_price' => 'integer',
        'sales_price' => 'integer',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
    ];

    // Relationships
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function stock()
    {
        return $this->hasOne(Stock::class);
    }

    public function stocks()
    {
        return $this->hasMany(Stock::class);
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

    public function priceHistories()
    {
        return $this->hasMany(ProductPriceHistory::class);
    }

    public function saleItems()
    {
        return $this->hasMany(SaleItem::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeLowStock($query)
    {
        return $query->whereColumn('stock', '<=', 'minimum_stock');
    }

    // Accessors & Mutators
    public function getMinimalStockAttribute()
    {
        return $this->attributes['minimum_stock'] ?? 0;
    }

    public function setMinimalStockAttribute($value): void
    {
        $this->attributes['minimum_stock'] = (int) $value;
    }

    public function getPriceCostAttribute()
    {
        return $this->attributes['cost_price'] ?? 0;
    }

    public function setPriceCostAttribute($value): void
    {
        $this->attributes['cost_price'] = (int) $value;
    }

    public function getPriceRetailAttribute()
    {
        return $this->attributes['retail_price'] ?? 0;
    }

    public function setPriceRetailAttribute($value): void
    {
        $this->attributes['retail_price'] = (int) $value;
    }

    public function getPriceResellerSmallAttribute()
    {
        return $this->attributes['small_reseller_price'] ?? 0;
    }

    public function setPriceResellerSmallAttribute($value): void
    {
        $this->attributes['small_reseller_price'] = (int) $value;
    }

    public function getPriceResellerLargeAttribute()
    {
        return $this->attributes['large_reseller_price'] ?? 0;
    }

    public function setPriceResellerLargeAttribute($value): void
    {
        $this->attributes['large_reseller_price'] = (int) $value;
    }

    public function getPriceEmployeeAttribute()
    {
        return $this->attributes['employee_price'] ?? 0;
    }

    public function setPriceEmployeeAttribute($value): void
    {
        $this->attributes['employee_price'] = (int) $value;
    }

    public function getPriceSalesAttribute()
    {
        return $this->attributes['sales_price'] ?? 0;
    }

    public function setPriceSalesAttribute($value): void
    {
        $this->attributes['sales_price'] = (int) $value;
    }

    // Methods
    public function getPriceByCustomerType($customerType)
    {
        $priceMap = [
            'retail' => 'retail_price',
            'reseller' => 'reseller_price',
            'reseller_besar' => 'reseller_besar_price',
            'petugas' => 'petugas_price',
            'sales' => 'sales_price',
            'small_reseller' => 'small_reseller_price',
            'large_reseller' => 'large_reseller_price',
            'employee' => 'employee_price',
        ];

        return $this->{$priceMap[$customerType] ?? 'retail_price'};
    }
}
