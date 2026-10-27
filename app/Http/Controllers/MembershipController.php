<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Membership;
use App\Models\MembershipLevel;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MembershipController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $memberships = MembershipLevel::orderBy('name')->get()->map(function ($m) {
                return [
                    'id' => $m->id,
                    'name' => $m->name,
                    'discount_percent' => (int) ($m->discount_percentage ?? 0),
                    'is_active' => (bool) $m->is_active,
                ];
            });

            return response()->json(['success' => true, 'data' => $memberships]);
        } catch (QueryException $e) {
            // membership_levels table may not exist yet (migrations not run)
            return response()->json(['success' => true, 'data' => [], 'message' => 'membership_levels table missing - run migrations'], 200);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'discount_percent' => 'nullable|integer|min:0|max:100',
        ]);
        try {
            $membership = MembershipLevel::create([
                'name' => $validated['name'],
                'discount_percentage' => $validated['discount_percent'] ?? 0,
                'is_active' => true,
            ]);

            return response()->json(['success' => true, 'data' => [
                'id' => $membership->id,
                'name' => $membership->name,
                'discount_percent' => (int) $membership->discount_percentage,
            ]], 201);
        } catch (QueryException $e) {
            return response()->json(['success' => false, 'message' => 'membership_levels table missing - run migrations'], 500);
        }
    }

    public function update(Request $request, Membership $membership): JsonResponse
    {
        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:50',
        ]);

        $customer = $membership->customer;
        if (!$customer) {
            return response()->json(['success' => false, 'message' => 'Customer tidak ditemukan'], 404);
        }

        $customer->update([
            'name' => $validated['customer_name'],
            'phone' => $validated['customer_phone'],
        ]);

        return response()->json(['success' => true, 'data' => [
            'id' => $membership->id,
            'customer_id' => $membership->customer_id,
            'customer_name' => $customer->name,
            'customer_phone' => $customer->phone,
        ]]);
    }

    public function destroy(\App\Models\Membership $membership): JsonResponse
    {
        try {
            $membership->delete();
            return response()->json(['success' => true]);
        } catch (QueryException $e) {
            return response()->json(['success' => false, 'message' => 'Gagal menghapus membership'], 500);
        }
    }

    // Return membership record for a customer
    public function showByCustomer($customerId): JsonResponse
    {
        $membership = \App\Models\Membership::where('customer_id', $customerId)->first();

        if (!$membership) {
            return response()->json(['success' => false, 'message' => 'Membership not found'], 404);
        }

        return response()->json(['success' => true, 'data' => [
            'id' => $membership->id,
            'customer_id' => $membership->customer_id,
            'loyalty_points' => (int) $membership->loyalty_points,
            'total_spent' => (int) $membership->total_spent,
            'joined_at' => optional($membership->joined_at)->toDateTimeString(),
        ]]);
    }

    // Create membership record for a customer
    public function storeForCustomer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'customer_name' => 'required_without:customer_id|string|max:255',
            'customer_phone' => 'required_without:customer_id|string|max:50',
        ]);

        if (empty($validated['customer_id'])) {
            $customer = Customer::create([
                'name' => $validated['customer_name'],
                'phone' => $validated['customer_phone'] ?? null,
                'is_active' => true,
            ]);
            $validated['customer_id'] = $customer->id;
        }

        // Prevent duplicate membership for same customer
        $existing = \App\Models\Membership::where('customer_id', $validated['customer_id'])->first();
        if ($existing) {
            return response()->json(['success' => false, 'message' => 'Customer already has membership'], 422);
        }

        $membership = \App\Models\Membership::create([
            'customer_id' => $validated['customer_id'],
            'total_spent' => 0,
            'loyalty_points' => 0,
            'is_active' => true,
            'joined_at' => now(),
        ]);

        return response()->json(['success' => true, 'data' => [
            'id' => $membership->id,
            'customer_id' => $membership->customer_id,
            'loyalty_points' => (int) $membership->loyalty_points,
            'total_spent' => (int) $membership->total_spent,
            'joined_at' => optional($membership->joined_at)->toDateTimeString(),
        ]], 201);
    }

    public function members(Request $request): JsonResponse
    {
        try {
            $members = \App\Models\Membership::with('customer')
                ->orderByDesc('joined_at')
                ->get()
                ->map(function ($membership) {
                    return [
                        'id' => $membership->id,
                        'customer_id' => $membership->customer_id,
                        'customer_name' => $membership->customer->name ?? 'Unknown',
                        'customer_phone' => $membership->customer->phone ?? '-',
                        'loyalty_points' => (int) $membership->loyalty_points,
                        'total_spent' => (int) $membership->total_spent,
                        'joined_at' => optional($membership->joined_at)->toDateTimeString(),
                    ];
                });

            return response()->json(['success' => true, 'data' => $members]);
        } catch (QueryException $e) {
            return response()->json(['success' => true, 'data' => [], 'message' => 'memberships table missing - run migrations'], 200);
        }
    }

    // Redeem points from a membership
    public function redeem(Request $request, \App\Models\Membership $membership): JsonResponse
    {
        $validated = $request->validate([
            'points' => 'required|integer|min:1',
        ]);

        $points = (int) $validated['points'];
        if ($membership->loyalty_points < $points) {
            return response()->json(['success' => false, 'message' => 'Insufficient points'], 422);
        }

        $membership->decrement('loyalty_points', $points);
        $discountAmount = $points * config('membership.value_per_point', 0);

        return response()->json(['success' => true, 'data' => [
            'remaining_points' => (int) $membership->loyalty_points,
            'discount_amount' => $discountAmount,
        ]]);
    }
}
