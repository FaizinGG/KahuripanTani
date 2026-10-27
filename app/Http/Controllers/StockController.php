<?php

namespace App\Http\Controllers;

use App\Models\Stock;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StockController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('permission:stock.manage');
    }

    public function index(Request $request): JsonResponse
    {
        $query = Stock::query();

        if ($request->has('category_id')) {
            $query->whereHas('product', fn($q) => $q->where('category_id', $request->category_id));
        }

        if ($request->has('low_stock')) {
            $query->whereHas('product', function ($q) {
                $q->whereColumn('products.stock', '<=', 'products.minimum_stock');
            });
        }

        $stocks = $query->with(['product'])
            ->paginate($request->per_page ?? 20);

        return response()->json([
            'success' => true,
            'data' => $stocks->items(),
            'pagination' => [
                'total' => $stocks->total(),
                'per_page' => $stocks->perPage(),
                'current_page' => $stocks->currentPage(),
                'last_page' => $stocks->lastPage(),
            ],
        ]);
    }

    public function lowStock(): JsonResponse
    {
        $lowStocks = Stock::whereHas('product', function ($q) {
                $q->whereColumn('products.stock', '<=', 'products.minimum_stock');
            })
            ->with('product')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $lowStocks,
            'count' => count($lowStocks),
        ]);
    }

    public function adjust(Request $request): JsonResponse
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer',
            'type' => 'required|in:in,out',
            'notes' => 'nullable|string',
        ]);

        $stock = Stock::firstOrCreate(
            ['product_id' => $request->product_id],
            ['quantity' => 0, 'reserved_quantity' => 0]
        );
        $oldQuantity = $stock->quantity;
        $quantity = abs($request->quantity);

        if ($request->type === 'in') {
            $stock->increment('quantity', $quantity);
            $stock->product()->increment('stock', $quantity);
        } else {
            $stock->decrement('quantity', $quantity);
            $stock->product()->decrement('stock', $quantity);
        }

        StockMovement::create([
            'stock_id' => $stock->id,
            'product_id' => $request->product_id,
            'type' => $request->type,
            'quantity' => abs($request->quantity),
            'old_quantity' => $oldQuantity,
            'new_quantity' => $stock->quantity,
            'user_id' => Auth::id(),
            'notes' => $request->notes,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Stok berhasil disesuaikan',
            'data' => $stock,
        ]);
    }

    public function movements(Request $request): JsonResponse
    {
        $query = StockMovement::query();

        if ($request->has('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('date')) {
            $query->whereDate('created_at', $request->date);
        }

        $movements = $query->with(['product', 'user'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 20);

        return response()->json([
            'success' => true,
            'data' => $movements->items(),
            'pagination' => [
                'total' => $movements->total(),
                'per_page' => $movements->perPage(),
                'current_page' => $movements->currentPage(),
                'last_page' => $movements->lastPage(),
            ],
        ]);
    }
}
