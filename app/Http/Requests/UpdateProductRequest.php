<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check() && Auth::user()->can('product.update');
    }

    public function rules(): array
    {
        return [
            'barcode' => 'sometimes|nullable|string|unique:products,barcode,' . $this->product->id,
            'sku' => 'sometimes|nullable|string|unique:products,sku,' . $this->product->id,
            'name' => 'sometimes|string|max:255',
            'category_id' => 'sometimes|nullable|exists:categories,id',
            'supplier_id' => 'sometimes|nullable|exists:suppliers,id',
            'unit' => 'sometimes|nullable|string',
            'price_cost' => 'sometimes|nullable|numeric|min:0',
            'price_retail' => 'sometimes|nullable|numeric|min:0',
            'price_reseller_small' => 'sometimes|nullable|numeric|min:0',
            'price_reseller_large' => 'sometimes|nullable|numeric|min:0',
            'price_employee' => 'sometimes|nullable|numeric|min:0',
            'price_sales' => 'sometimes|nullable|numeric|min:0',
            'stock' => 'sometimes|nullable|integer|min:0',
            'minimal_stock' => 'sometimes|nullable|integer|min:0',
            'description' => 'nullable|string',
            'image_url' => 'sometimes|nullable|string',
            'brand' => 'sometimes|nullable|string|max:255',
            'rack_location' => 'sometimes|nullable|string|max:255',
            'notes' => 'sometimes|nullable|string',
            'is_active' => 'sometimes|nullable|boolean',
        ];
    }
}
