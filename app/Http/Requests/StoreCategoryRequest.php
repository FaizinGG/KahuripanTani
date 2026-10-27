<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->can('category.create');
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|unique:categories,name',
            'slug' => 'required|string|unique:categories,slug',
            'description' => 'nullable|string',
            'display_order' => 'integer|min:0',
        ];
    }
}
