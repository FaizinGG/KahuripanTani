<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check() && Auth::user()->can('supplier.update');
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:255|unique:suppliers,name,' . $this->supplier->id,
            'code' => 'sometimes|nullable|string|max:50|unique:suppliers,code,' . $this->supplier->id,
            'email' => 'sometimes|nullable|email|max:255',
            'phone' => 'sometimes|nullable|string|max:50',
            'address' => 'sometimes|nullable|string',
            'city' => 'sometimes|nullable|string|max:100',
            'province' => 'sometimes|nullable|string|max:100',
            'postal_code' => 'sometimes|nullable|string|max:20',
            'contact_person' => 'sometimes|nullable|string|max:255',
            'notes' => 'sometimes|nullable|string',
            'rating' => 'sometimes|nullable|integer|min:0|max:5',
            'is_active' => 'sometimes|nullable|boolean',
        ];
    }
}
