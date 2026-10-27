<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSaleRequest;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Receivable;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Stock;
use App\Services\QrisSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SaleController extends Controller
{
    private function ensureStockEntry(int $productId): Stock
    {
        return Stock::firstOrCreate(
            ['product_id' => $productId],
            ['quantity' => 0, 'reserved_quantity' => 0]
        );
    }

    private function generateInvoiceNumber(): string
    {
        $lastSale = Sale::query()->orderByDesc('id')->first();
        $sequence = $lastSale ? ((int) $lastSale->id + 1) : 1;

        return 'INV-' . now()->format('Ymd') . '-' . str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }

    private function syncProductStock(int $productId, int $quantity, string $direction): void
    {
        $stock = $this->ensureStockEntry($productId);
        $product = Product::find($productId);

        if ($direction === 'out') {
            $stock->decrement('quantity', $quantity);
            $product?->decrement('stock', $quantity);
        } else {
            $stock->increment('quantity', $quantity);
            $product?->increment('stock', $quantity);
        }
    }

    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('permission:sale.create')->only(['store']);
        $this->middleware('permission:sale.read')->only(['index', 'show']);
        $this->middleware('permission:sale.cancel')->only(['cancel']);
        $this->middleware('permission:sale.return')->only(['return']);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Sale::query();

        if ($request->has('date')) {
            $query->whereDate('created_at', $request->date);
        }

        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $sales = $query->with(['items', 'customer', 'user'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data' => $sales->items(),
            'pagination' => [
                'total' => $sales->total(),
                'per_page' => $sales->perPage(),
                'current_page' => $sales->currentPage(),
                'last_page' => $sales->lastPage(),
            ],
        ]);
    }

    public function store(StoreSaleRequest $request): JsonResponse
    {
        return DB::transaction(function () use ($request) {
            $validated = $request->validated();
            $items = collect($validated['items']);
            $subtotal = (int) ($validated['subtotal'] ?? $items->sum(fn ($item) => (int) $item['quantity'] * (int) $item['price']));
            $manualDiscount = (int) ($validated['diskon'] ?? $validated['discount_amount'] ?? 0);
            $paymentMethod = $validated['payment_method'] ?? 'cash';
            $paidAmount = (int) ($validated['dibayar'] ?? $validated['paid_amount'] ?? $validated['down_payment'] ?? 0);
            $paymentType = $validated['payment_type'] ?? (($paymentMethod === 'debt' || ($validated['payment_status'] ?? null) === 'pending') ? 'debt' : 'full_payment');
            $baseTotal = max(0, $subtotal - $manualDiscount);
            if ($paymentMethod === 'qris') {
                if (!app(QrisSettings::class)->imagePath()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'QRIS belum dikonfigurasi. Silakan upload gambar QRIS terlebih dahulu melalui Pengaturan Pembayaran.',
                    ], 422);
                }
                $paidAmount = $baseTotal;
                $paymentType = 'full_payment';
            }
            $effectiveDiscount = $manualDiscount;
            $changeAmount = 0;
            $shortageAmount = 0;
            $paymentStatus = 'paid';
            $totalAmount = $baseTotal;

            if ($paymentType === 'debt') {
                $paymentStatus = $paidAmount > 0 ? 'partial' : 'pending';
                $shortageAmount = max(0, $baseTotal - $paidAmount);
                $totalAmount = $baseTotal;
            } elseif ($paymentType === 'owner_discount') {
                $effectiveDiscount = $manualDiscount + max(0, $baseTotal - $paidAmount);
                $totalAmount = max(0, $subtotal - $effectiveDiscount);
                $paymentStatus = 'paid';
                $shortageAmount = 0;
            } else {
                $changeAmount = max(0, $paidAmount - $baseTotal);
                $shortageAmount = max(0, $baseTotal - $paidAmount);
                $paymentStatus = $shortageAmount > 0 ? 'partial' : 'paid';
                $totalAmount = $baseTotal;
            }

            $customerId = $validated['customer_id'] ?? null;
            $customer = null;
            if ($customerId) {
                $customer = Customer::find($customerId);
            }

            if ($paymentType === 'debt') {
                if (!$customer) {
                    $customer = Customer::create([
                        'name' => $validated['customer_name'] ?? 'Pelanggan Hutang',
                        'phone' => $validated['phone'] ?? null,
                        'address' => $validated['address'] ?? null,
                        'notes' => $validated['notes'] ?? null,
                        'type' => 'retail',
                        'is_active' => true,
                    ]);
                }

                $customerId = $customer->id;
            }

            $totalCost = 0;
            $saleItems = [];
            foreach ($items as $item) {
                $productId = (int) $item['product_id'];
                $quantity = (int) $item['quantity'];
                $priceType = (string) ($item['price_type'] ?? 'retail');
                $unitPrice = (int) ($item['price'] ?? 0);
                $product = Product::find($productId);
                $costPrice = (int) ($product?->cost_price ?? 0);
                $resolvedPrice = $unitPrice > 0 ? $unitPrice : (int) $product?->getPriceByCustomerType($priceType) ?? 0;
                $profitAmount = max(0, $resolvedPrice - $costPrice) * $quantity;
                $totalCost += $quantity * $costPrice;

                $saleItems[] = [
                    'sale_id' => 0,
                    'product_id' => $productId,
                    'price_type' => $priceType,
                    'quantity' => $quantity,
                    'unit_price' => $resolvedPrice,
                    'selling_price' => $resolvedPrice,
                    'cost_price' => $costPrice,
                    'profit' => $profitAmount,
                    'discount_amount' => 0,
                    'discount_percentage' => 0,
                    'final_price' => $resolvedPrice,
                ];
            }

            $sale = Sale::create([
                'invoice_number' => $this->generateInvoiceNumber(),
                'user_id' => Auth::id(),
                'customer_id' => $customerId,
                'subtotal' => $subtotal,
                'discount_amount' => $effectiveDiscount,
                'diskon' => $effectiveDiscount,
                'tax_amount' => (int) ($validated['tax_amount'] ?? 0),
                'total_amount' => $totalAmount,
                'total' => $totalAmount,
                'payment_method' => $paymentMethod,
                'paid_amount' => $paidAmount,
                'dibayar' => $paidAmount,
                'change_amount' => $changeAmount,
                'kembalian' => $changeAmount,
                'kekurangan' => $shortageAmount,
                'payment_status' => $paymentStatus,
                'payment_type' => $paymentType,
                'status' => 'completed',
                'notes' => $validated['notes'] ?? null,
                'total_cost' => $totalCost,
                'completed_at' => now(),
            ]);

            $previousHash = Sale::query()
                ->whereNotNull('blockchain_hash')
                ->orderByDesc('id')
                ->value('blockchain_hash');

            $sale->attachBlockchainMetadata($previousHash);
            $sale->save();

            foreach ($saleItems as $saleItem) {
                $saleItem['sale_id'] = $sale->id;
                SaleItem::create($saleItem);
                $this->syncProductStock((int) $saleItem['product_id'], (int) $saleItem['quantity'], 'out');
            }

            if ($paymentType === 'debt') {
                $dueDate = $validated['due_date'] ?? now()->toDateString();
                $receivableAmount = $totalAmount;
                $initialPaidAmount = min($paidAmount, $receivableAmount);
                $receivableStatus = $initialPaidAmount >= $receivableAmount ? 'paid' : ($initialPaidAmount > 0 ? 'partial' : 'pending');

                Receivable::create([
                    'customer_id' => $customerId,
                    'sale_id' => $sale->id,
                    'amount' => $receivableAmount,
                    'paid_amount' => $initialPaidAmount,
                    'status' => $receivableStatus,
                    'due_date' => $dueDate,
                    'notes' => $validated['notes'] ?? null,
                    'created_by' => Auth::id(),
                ]);
            }

            // Award loyalty points if customer has membership
            if ($sale->customer_id) {
                $membership = \App\Models\Membership::where('customer_id', $sale->customer_id)->first();
                if ($membership) {
                    $currencyPerPoint = config('membership.currency_per_point', 10000);
                    $points = (int) floor(($sale->total_amount ?? 0) / $currencyPerPoint);
                    if ($points > 0) {
                        $membership->increment('loyalty_points', $points);
                        $membership->increment('total_spent', $sale->total_amount ?? 0);
                    }
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Penjualan berhasil dicatat',
                'data' => $sale->load('items'),
            ], 201);
        });
    }

    public function show(Sale $sale): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $sale->load(['items', 'customer', 'user']),
        ]);
    }

    public function cancel(Sale $sale): JsonResponse
    {
        if ($sale->status === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => 'Penjualan sudah dibatalkan',
            ], 422);
        }

        return DB::transaction(function () use ($sale) {
            foreach ($sale->items as $item) {
                $this->syncProductStock($item->product_id, $item->quantity, 'in');
            }

            $sale->update(['status' => 'cancelled']);

            return response()->json([
                'success' => true,
                'message' => 'Penjualan berhasil dibatalkan',
            ]);
        });
    }

    public function return(Request $request, Sale $sale): JsonResponse
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($request, $sale) {
            $returnAmount = 0;

            foreach ($request->items as $item) {
                $saleItem = $sale->items()
                    ->where('product_id', $item['product_id'])
                    ->first();

                if (!$saleItem) {
                    throw new \Exception('Item tidak ditemukan dalam penjualan');
                }

                $returnAmount += $saleItem->unit_price * $item['quantity'];
                $this->syncProductStock($item['product_id'], $item['quantity'], 'in');
                $saleItem->update([
                    'quantity' => $saleItem->quantity - $item['quantity'],
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Retur berhasil diproses',
                'return_amount' => $returnAmount,
            ]);
        });
    }
}
