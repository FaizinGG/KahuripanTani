<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check() && Auth::user()->can('supplier.create');
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255|unique:suppliers,name',
            'code' => 'nullable|string|max:50|unique:suppliers,code',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'contact_person' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'rating' => 'nullable|integer|min:0|max:5',
            'is_active' => 'nullable|boolean',
        ];
    }
}
