<?php

namespace App\Http\Controllers;

use App\Models\Receivable;
use App\Models\ReceivablePayment;
use App\Models\SaleItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ReceivableController extends Controller
{
    private function addCustomerBalance($query)
    {
        return $query
            ->select('receivables.*')
            ->selectSub(
                Receivable::query()
                    ->selectRaw('COALESCE(SUM(amount - paid_amount), 0)')
                    ->whereColumn('customer_id', 'receivables.customer_id'),
                'customer_active_balance'
            );
    }

    private function setCustomerBalance(Receivable $receivable): Receivable
    {
        $balance = Receivable::query()
            ->where('customer_id', $receivable->customer_id)
            ->selectRaw('COALESCE(SUM(amount - paid_amount), 0) as balance')
            ->value('balance');

        $receivable->setAttribute('customer_active_balance', max(0, (int) $balance));

        return $receivable;
    }

    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function index(Request $request): JsonResponse
    {
        $query = $this->addCustomerBalance(
            Receivable::query()->with(['customer', 'sale.items.product', 'payments.user', 'payments.saleItem'])
        );

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('customer', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $receivables = $query->orderBy('due_date', 'asc')
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data' => $receivables->items(),
            'pagination' => [
                'total' => $receivables->total(),
                'per_page' => $receivables->perPage(),
                'current_page' => $receivables->currentPage(),
                'last_page' => $receivables->lastPage(),
            ],
        ]);
    }

    public function show(Receivable $receivable): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->setCustomerBalance(
                $receivable->load(['customer', 'sale.items.product', 'payments.user', 'payments.saleItem'])
            ),
        ]);
    }

    public function destroy(Receivable $receivable): JsonResponse
    {
        if ($receivable->status !== 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya piutang lunas yang dapat dihapus.',
            ], 422);
        }

        $receivable->delete();

        return response()->json([
            'success' => true,
            'message' => 'Piutang lunas berhasil dihapus.',
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'sale_id' => 'nullable|exists:sales,id',
            'amount' => 'required|integer|min:1',
            'due_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $receivable = Receivable::create([
            ...$validated,
            'paid_amount' => 0,
            'status' => 'pending',
            'created_by' => Auth::id(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Piutang berhasil dibuat',
            'data' => $receivable,
        ], 201);
    }

    public function storePayment(Request $request, Receivable $receivable): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|integer|min:1',
            'sale_item_id' => 'nullable|exists:sale_items,id',
            'payment_method' => 'nullable|in:cash,transfer,qris',
            'notes' => 'nullable|string',
            'reference_number' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated, $receivable): JsonResponse {
            $receivable = Receivable::query()
                ->whereKey($receivable->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $item = null;
            if (!empty($validated['sale_item_id'])) {
                $item = SaleItem::query()
                    ->whereKey($validated['sale_item_id'])
                    ->where('sale_id', $receivable->sale_id)
                    ->first();

                if (!$item) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Barang tidak termasuk dalam nota piutang ini.',
                    ], 422);
                }
            }

            $receivableRemaining = max(0, $receivable->amount - $receivable->paid_amount);
            $remaining = $receivableRemaining;
            if ($item) {
                $itemTotal = (int) $item->quantity * (int) ($item->final_price ?: $item->selling_price ?: $item->unit_price);
                $itemPaid = (int) ReceivablePayment::query()
                    ->where('sale_item_id', $item->id)
                    ->sum('amount');
                $remaining = min($receivableRemaining, max(0, $itemTotal - $itemPaid));
            }
            $amount = (int) $validated['amount'];

            if ($amount > $remaining) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nominal pembayaran tidak boleh melebihi sisa tagihan.',
                ], 422);
            }

            if ($amount <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Piutang sudah lunas',
                ], 422);
            }

            $receivable->payments()->create([
                'sale_item_id' => $item?->id,
                'user_id' => Auth::id(),
                'amount' => $amount,
                'payment_method' => $validated['payment_method'] ?? 'cash',
                'reference_number' => $validated['reference_number'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'paid_at' => now(),
            ]);

            $receivable->paid_amount = $receivable->paid_amount + $amount;
            $receivable->status = $receivable->paid_amount >= $receivable->amount ? 'paid' : 'partial';
            $receivable->save();

            if ($receivable->sale_id) {
                $sale = $receivable->sale()->lockForUpdate()->first();
                if ($sale) {
                    $sale->paid_amount = $receivable->paid_amount;
                    $sale->dibayar = $receivable->paid_amount;
                    $sale->kekurangan = max(0, $sale->total_amount - $receivable->paid_amount);
                    $sale->payment_status = $receivable->status;
                    $sale->save();
                }
            }

            $updatedReceivable = $this->setCustomerBalance(
                $receivable->fresh(['customer', 'sale.items.product', 'payments.user', 'payments.saleItem'])
            );

            return response()->json([
                'success' => true,
                'message' => 'Pembayaran piutang berhasil dicatat',
                'data' => $updatedReceivable,
            ], 201);
        });
    }
}
