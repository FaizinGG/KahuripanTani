<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $stockQuantity = (int) ($this->stock ?? 0);

        if ($this->relationLoaded('stocks')) {
            $stockQuantity = (int) optional($this->getRelationValue('stocks')->first())->quantity ?? $stockQuantity;
        }

        $categoryName = null;
        if ($this->relationLoaded('category')) {
            $categoryName = $this->getRelationValue('category')?->name;
        }

        $supplierName = null;
        if ($this->relationLoaded('supplier')) {
            $supplierName = $this->getRelationValue('supplier')?->name;
        }

        return [
            'id' => $this->id,
            'barcode' => $this->barcode,
            'sku' => $this->sku,
            'name' => $this->name,
            'category_id' => $this->category_id,
            'category_name' => $categoryName,
            'supplier_id' => $this->supplier_id,
            'supplier_name' => $supplierName,
            'unit' => $this->unit,
            'price_cost' => (float) ($this->price_cost ?? $this->cost_price ?? 0),
            'price_retail' => (float) ($this->price_retail ?? $this->retail_price ?? 0),
            'price_reseller_small' => (float) ($this->price_reseller_small ?? $this->small_reseller_price ?? 0),
            'price_reseller_large' => (float) ($this->price_reseller_large ?? $this->large_reseller_price ?? 0),
            'price_employee' => (float) ($this->price_employee ?? $this->employee_price ?? 0),
            'price_sales' => (float) ($this->price_sales ?? $this->sales_price ?? 0),
            'minimal_stock' => (int) $this->minimal_stock,
            'minimum_stock' => (int) $this->minimum_stock,
            'stock' => (int) ($this->stock ?? 0),
            'current_stock' => $stockQuantity,
            'is_active' => (bool) $this->is_active,
            'description' => $this->description,
            'image_url' => $this->image_url,
            'brand' => $this->brand,
            'rack_location' => $this->rack_location,
            'notes' => $this->notes,
            'unit' => $this->unit,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
