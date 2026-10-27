<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\ReceivableController;
use App\Http\Controllers\ManagementController;
use App\Http\Controllers\CleanupController;
use App\Http\Controllers\PaymentSettingsController;

// Authentication routes
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::put('/password', [AuthController::class, 'updatePassword']);
    });
});

// Protected API routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('payment-settings/qris', [PaymentSettingsController::class, 'showQris']);
    Route::post('payment-settings/qris', [PaymentSettingsController::class, 'uploadQris']);
    Route::delete('payment-settings/qris', [PaymentSettingsController::class, 'deleteQris']);

    // Products
    Route::apiResource('products', ProductController::class);
    Route::get('products/barcode/{barcode}', [ProductController::class, 'byBarcode']);
    Route::post('products/bulk-update', [ProductController::class, 'bulkUpdate']);

    // Categories
    Route::apiResource('categories', CategoryController::class);
    Route::post('categories/reorder', [CategoryController::class, 'reorder']);

    // Suppliers
    Route::apiResource('suppliers', SupplierController::class);

    // Sales/POS
    Route::apiResource('sales', SaleController::class)->only(['index', 'store', 'show']);
    Route::post('sales/{sale}/cancel', [SaleController::class, 'cancel']);
    Route::post('sales/{sale}/return', [SaleController::class, 'return']);

    // Customers
    Route::get('customers/active-debtors', [CustomerController::class, 'activeDebtors']);
    Route::apiResource('customers', CustomerController::class);
    Route::get('customers/phone/{phone}', [CustomerController::class, 'byPhone']);

    // Memberships
    Route::apiResource('memberships', \App\Http\Controllers\MembershipController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::get('memberships/members', [\App\Http\Controllers\MembershipController::class, 'members']);
    Route::get('memberships/customer/{customer}', [\App\Http\Controllers\MembershipController::class, 'showByCustomer']);
    Route::post('memberships/customer', [\App\Http\Controllers\MembershipController::class, 'storeForCustomer']);
    Route::post('memberships/{membership}/redeem', [\App\Http\Controllers\MembershipController::class, 'redeem']);

    // Stock Management
    Route::prefix('stocks')->group(function () {
        Route::get('/', [StockController::class, 'index']);
        Route::get('low-stock', [StockController::class, 'lowStock']);
        Route::post('adjust', [StockController::class, 'adjust']);
        Route::get('movements', [StockController::class, 'movements']);
    });

    Route::apiResource('receivables', ReceivableController::class);
    Route::post('receivables/{receivable}/payments', [ReceivableController::class, 'storePayment']);

    Route::prefix('management')->group(function () {
        Route::get('stats', [ManagementController::class, 'stats']);
        Route::get('users', [ManagementController::class, 'users']);
        Route::post('users', [ManagementController::class, 'store']);
        Route::put('users/{user}', [ManagementController::class, 'update']);
        Route::delete('users/{user}', [ManagementController::class, 'destroy']);
        Route::post('users/{user}/reset-password', [ManagementController::class, 'resetPassword']);
        Route::get('attendance', [ManagementController::class, 'attendance']);
        Route::put('attendance/{attendance}', [ManagementController::class, 'updateAttendance']);
        Route::get('login-history', [ManagementController::class, 'loginHistory']);
    });

    // Cleanup Management
    Route::prefix('cleanup')->group(function () {
        Route::get('unused', [CleanupController::class, 'getUnused']);
    });
});

