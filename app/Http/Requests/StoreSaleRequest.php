<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = Auth::user();

        return $user !== null && method_exists($user, 'can') && $user->can('sale.create');
    }

    public function rules(): array
    {
        return [
            'customer_id' => 'nullable|exists:customers,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.price_type' => 'nullable|string|in:retail,reseller,reseller_besar,petugas,sales',
            'items.*.cost_price' => 'nullable|numeric|min:0',
            'subtotal' => 'nullable|numeric|min:0',
            'diskon' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'total' => 'nullable|numeric|min:0',
            'total_amount' => 'nullable|numeric|min:0',
            'dibayar' => 'nullable|numeric|min:0',
            'paid_amount' => 'nullable|numeric|min:0',
            'kembalian' => 'nullable|numeric|min:0',
            'change_amount' => 'nullable|numeric|min:0',
            'kekurangan' => 'nullable|numeric|min:0',
            'payment_method' => 'required|in:cash,transfer,qris,debt',
            'qris_confirmed' => 'exclude_unless:payment_method,qris|required|accepted',
            'payment_status' => 'nullable|in:paid,pending,partial',
            'payment_type' => 'nullable|in:full_payment,owner_discount,debt',
            'customer_name' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'due_date' => 'nullable|date',
            'down_payment' => 'nullable|numeric|min:0',
        ];
    }

    public function messages(): array
    {
        return [
            'items.required' => 'Item penjualan tidak boleh kosong',
            'items.min' => 'Minimal harus ada satu item',
            'items.*.product_id.required' => 'Produk wajib dipilih',
            'items.*.quantity.required' => 'Kuantitas wajib diisi',
            'items.*.quantity.min' => 'Kuantitas minimal 1',
            'payment_method.required' => 'Metode pembayaran wajib dipilih',
        ];
    }
}
