<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\Supplier;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('permission:product.read')->only(['index', 'show']);
        $this->middleware('permission:product.create')->only(['store']);
        $this->middleware('permission:product.update')->only(['update']);
        $this->middleware('permission:product.delete')->only(['destroy']);
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $query = Product::query()->with(['category', 'supplier']);

            if ($request->filled('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            if ($request->filled('search')) {
                $search = trim($request->search);
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('sku', 'like', "%{$search}%")
                      ->orWhere('barcode', 'like', "%{$search}%")
                      ->orWhereHas('category', function ($categoryQuery) use ($search) {
                          $categoryQuery->where('name', 'like', "%{$search}%");
                      });
                });
            }

            if ($request->has('is_active')) {
                $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
            }

            $products = $query->orderByDesc('updated_at')->paginate($request->per_page ?? 15);

            return response()->json([
                'success' => true,
                'data' => ProductResource::collection($products->items()),
                'pagination' => [
                    'total' => $products->total(),
                    'per_page' => $products->perPage(),
                    'current_page' => $products->currentPage(),
                    'last_page' => $products->lastPage(),
                ],
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat produk: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();
            $validated['barcode'] = $validated['barcode'] ?? null;
            $validated['sku'] = $validated['sku'] ?? null;
            $validated['category_id'] = $validated['category_id'] ?? null;
            $validated['supplier_id'] = $validated['supplier_id'] ?? null;
            $validated['price_cost'] = $validated['price_cost'] === '' || $validated['price_cost'] === null ? 0 : (int) $validated['price_cost'];
            $validated['price_retail'] = $validated['price_retail'] === '' || $validated['price_retail'] === null ? 0 : (int) $validated['price_retail'];
            $validated['price_reseller_small'] = $validated['price_reseller_small'] === '' || $validated['price_reseller_small'] === null ? 0 : (int) $validated['price_reseller_small'];
            $validated['price_reseller_large'] = $validated['price_reseller_large'] === '' || $validated['price_reseller_large'] === null ? 0 : (int) $validated['price_reseller_large'];
            $validated['price_employee'] = $validated['price_employee'] === '' || $validated['price_employee'] === null ? 0 : (int) $validated['price_employee'];
            $validated['price_sales'] = $validated['price_sales'] === '' || $validated['price_sales'] === null ? 0 : (int) $validated['price_sales'];
            $validated['stock'] = $validated['stock'] === '' || $validated['stock'] === null ? 0 : (int) $validated['stock'];
            $validated['minimal_stock'] = $validated['minimal_stock'] === '' || $validated['minimal_stock'] === null ? 0 : (int) $validated['minimal_stock'];
            $validated['is_active'] = $validated['is_active'] ?? true;
            $validated['unit'] = $validated['unit'] ?? 'PCS';

            $product = Product::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Produk berhasil dibuat',
                'data' => new ProductResource($product->load(['category', 'supplier'])),
            ], 201);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat produk: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new ProductResource($product->load(['category', 'supplier', 'priceHistories', 'stocks'])),
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        try {
            $validated = $request->validated();
            $validated['barcode'] = $validated['barcode'] ?? null;
            $validated['sku'] = $validated['sku'] ?? null;
            $validated['category_id'] = $validated['category_id'] ?? null;
            $validated['supplier_id'] = $validated['supplier_id'] ?? null;
            $validated['price_cost'] = $validated['price_cost'] === '' || $validated['price_cost'] === null ? 0 : (int) $validated['price_cost'];
            $validated['price_retail'] = $validated['price_retail'] === '' || $validated['price_retail'] === null ? 0 : (int) $validated['price_retail'];
            $validated['price_reseller_small'] = $validated['price_reseller_small'] === '' || $validated['price_reseller_small'] === null ? 0 : (int) $validated['price_reseller_small'];
            $validated['price_reseller_large'] = $validated['price_reseller_large'] === '' || $validated['price_reseller_large'] === null ? 0 : (int) $validated['price_reseller_large'];
            $validated['price_employee'] = $validated['price_employee'] === '' || $validated['price_employee'] === null ? 0 : (int) $validated['price_employee'];
            $validated['price_sales'] = $validated['price_sales'] === '' || $validated['price_sales'] === null ? 0 : (int) $validated['price_sales'];
            $validated['reseller_price'] = $validated['price_reseller_small'] ?? 0;
            $validated['reseller_besar_price'] = $validated['price_reseller_large'] ?? 0;
            $validated['petugas_price'] = $validated['price_employee'] ?? 0;
            $validated['stock'] = $validated['stock'] === '' || $validated['stock'] === null ? 0 : (int) $validated['stock'];
            $validated['minimal_stock'] = $validated['minimal_stock'] === '' || $validated['minimal_stock'] === null ? 0 : (int) $validated['minimal_stock'];
            $product->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Produk berhasil diperbarui',
                'data' => new ProductResource($product->fresh()->load(['category', 'supplier'])),
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui produk: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Product $product): JsonResponse
    {
        try {
            $product->delete();

            return response()->json([
                'success' => true,
                'message' => 'Produk berhasil dihapus',
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus produk: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function byBarcode(string $barcode): JsonResponse
    {
        $product = Product::where('barcode', $barcode)->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => new ProductResource($product),
        ]);
    }

    public function suppliers(): JsonResponse
    {
        try {
            $suppliers = Supplier::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']);

            return response()->json([
                'success' => true,
                'data' => $suppliers,
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat supplier: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function bulkUpdate(Request $request): JsonResponse
    {
        $request->validate([
            'products' => 'required|array',
            'products.*.id' => 'required|exists:products,id',
            'products.*.price_retail' => 'required|numeric|min:0',
        ]);

        foreach ($request->products as $productData) {
            Product::find($productData['id'])->update([
                'price_retail' => $productData['price_retail'],
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil diperbarui secara massal',
        ]);
    }
}
