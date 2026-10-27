<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CleanupController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('permission:category.read|supplier.read');
    }

    /**
     * Get unused categories and suppliers (with 0 products)
     */
    public function getUnused(Request $request): JsonResponse
    {
        $categories = Category::withCount('products')
            ->orderBy('name')
            ->get();

        $suppliers = Supplier::withCount('products')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'categories' => $categories,
            'suppliers' => $suppliers,
        ]);
    }
}
