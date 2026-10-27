<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->can('category.update');
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|unique:categories,name,' . $this->category->id,
            'slug' => 'sometimes|string|unique:categories,slug,' . $this->category->id,
            'description' => 'nullable|string',
            'display_order' => 'integer|min:0',
        ];
    }
}
