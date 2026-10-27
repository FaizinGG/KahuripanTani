<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check() && Auth::user()->can('product.create');
    }

    public function rules(): array
    {
        return [
            'barcode' => 'nullable|string|unique:products,barcode',
            'sku' => 'nullable|string|unique:products,sku',
            'name' => 'required|string|max:255',
            'category_id' => 'nullable|exists:categories,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'unit' => 'nullable|string',
            'price_cost' => 'nullable|numeric|min:0',
            'price_retail' => 'nullable|numeric|min:0',
            'price_reseller_small' => 'nullable|numeric|min:0',
            'price_reseller_large' => 'nullable|numeric|min:0',
            'price_employee' => 'nullable|numeric|min:0',
            'price_sales' => 'nullable|numeric|min:0',
            'stock' => 'nullable|integer|min:0',
            'minimal_stock' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string',
            'brand' => 'nullable|string|max:255',
            'rack_location' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'barcode.unique' => 'Barcode sudah terdaftar',
            'sku.unique' => 'SKU sudah terdaftar',
            'name.required' => 'Nama produk wajib diisi',
            'category_id.required' => 'Kategori wajib dipilih',
            'price_cost.required' => 'Harga modal wajib diisi',
        ];
    }
}
