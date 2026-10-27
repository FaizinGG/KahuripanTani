<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Receivable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function index(Request $request): JsonResponse
    {
        $query = Customer::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                  ->orWhere('phone', 'like', "%$search%");
            });
        }

        if ($request->has('membership_id')) {
            $query->where('membership_id', $request->membership_id);
        }

        $customers = $query->paginate($request->per_page ?? 20);

        return response()->json([
            'success' => true,
            'data' => $customers->items(),
            'pagination' => [
                'total' => $customers->total(),
                'per_page' => $customers->perPage(),
                'current_page' => $customers->currentPage(),
                'last_page' => $customers->lastPage(),
            ],
        ]);
    }

    public function activeDebtors(Request $request): JsonResponse
    {
        $query = Customer::query()
            ->active()
            ->select('customers.*')
            ->selectSub(
                Receivable::query()
                    ->selectRaw('COALESCE(SUM(amount - paid_amount), 0)')
                    ->whereColumn('customer_id', 'customers.id'),
                'active_receivable_balance'
            )
            ->whereIn('customers.id', function ($receivableQuery) {
                $receivableQuery->from('receivables')
                    ->select('customer_id')
                    ->groupBy('customer_id')
                    ->havingRaw('SUM(amount - paid_amount) > 0');
            });

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($customerQuery) use ($search) {
                $customerQuery->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $customers = $query->orderBy('name')->paginate($request->per_page ?? 20);

        return response()->json([
            'success' => true,
            'data' => $customers->items(),
            'pagination' => [
                'total' => $customers->total(),
                'per_page' => $customers->perPage(),
                'current_page' => $customers->currentPage(),
                'last_page' => $customers->lastPage(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|unique:customers,phone',
            'address' => 'nullable|string',
            'membership_id' => 'nullable|exists:memberships,id',
        ]);

        $customer = Customer::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Pelanggan berhasil ditambahkan',
            'data' => $customer,
        ], 201);
    }

    public function show(Customer $customer): JsonResponse
    {
        $customer->load(['membership', 'sales', 'receivables', 'points']);

        return response()->json([
            'success' => true,
            'data' => $customer,
        ]);
    }

    public function update(Request $request, Customer $customer): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|unique:customers,phone,' . $customer->id,
            'address' => 'nullable|string',
            'membership_id' => 'nullable|exists:memberships,id',
        ]);

        $customer->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Pelanggan berhasil diperbarui',
            'data' => $customer,
        ]);
    }

    public function byPhone(string $phone): JsonResponse
    {
        $customer = Customer::where('phone', $phone)->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $customer,
        ]);
    }
}
