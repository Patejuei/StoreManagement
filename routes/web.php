<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\POSController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\OfferController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/', function () {
        return redirect('/dashboard');
    })->name('home');

    // Redirección para cuando un usuario recién inicia sesión o entra a la raíz protegida
    Route::get('dashboard', function () {
        $tenant = \App\Models\Tenant::first();
        return redirect()->route('dashboard', ['tenant' => $tenant ? $tenant->slug : 'default']);
    });

    // Rutas protegidas que requieren un Tenant en la URL
    Route::prefix('{tenant}')->middleware('tenant')->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::get('store', [StoreController::class, 'index'])->name('store.index');

        // POS
        Route::prefix('pos')->group(function () {
            Route::get('/', [POSController::class, 'index'])->name('pos.index');
            Route::post('/start-session', [POSController::class, 'startSession'])->name('pos.start-session');
            Route::post('/end-session', [POSController::class, 'endSession'])->name('pos.end-session');
            Route::post('/checkout', [POSController::class, 'checkout'])->name('pos.checkout');
        });

        // Inventario
        Route::prefix('inventory')->group(function () {
            Route::get('/', [InventoryController::class, 'index'])->name('inventory.index');
            Route::post('/', [InventoryController::class, 'store'])->name('inventory.store');
            Route::put('/{product}', [InventoryController::class, 'update'])->name('inventory.update');
            Route::delete('/{product}', [InventoryController::class, 'destroy'])->name('inventory.destroy');
            Route::get('/{product}/history', [InventoryController::class, 'history'])->name('inventory.history');
            Route::get('/template/download', [InventoryController::class, 'importTemplate'])->name('inventory.template');
            Route::post('/import', [InventoryController::class, 'import'])->name('inventory.import');
        });

        // Compras
        Route::prefix('purchases')->group(function () {
            Route::get('/', [PurchaseController::class, 'index'])->name('purchases.index');
            Route::post('/', [PurchaseController::class, 'store'])->name('purchases.store');
            Route::get('/{purchase}', [PurchaseController::class, 'show'])->name('purchases.show');
        });

        // Proveedores
        Route::prefix('suppliers')->group(function () {
            Route::get('/', [SupplierController::class, 'index'])->name('suppliers.index');
            Route::post('/', [SupplierController::class, 'store'])->name('suppliers.store');
            Route::put('/{supplier}', [SupplierController::class, 'update'])->name('suppliers.update');
            Route::delete('/{supplier}', [SupplierController::class, 'destroy'])->name('suppliers.destroy');
            Route::get('/{supplier}/products', [SupplierController::class, 'products'])->name('suppliers.products');
        });

        // Reportes
        Route::prefix('reports')->group(function () {
            Route::get('/', [ReportController::class, 'index'])->name('reports.index');
            Route::post('/generate', [ReportController::class, 'generate'])->name('reports.generate');
        });

        // Ofertas
        Route::prefix('offers')->group(function () {
            Route::get('/', [OfferController::class, 'index'])->name('offers.index');
            Route::post('/', [OfferController::class, 'store'])->name('offers.store');
            Route::put('/{id}', [OfferController::class, 'update'])->name('offers.update');
            Route::delete('/{id}', [OfferController::class, 'destroy'])->name('offers.destroy');
            Route::patch('/{id}/toggle', [OfferController::class, 'toggleActive'])->name('offers.toggle');
        });
    });
});

require __DIR__ . '/settings.php';

// Rutas de Super Admin (Fuera del prefijo de tenant)
Route::prefix('admin')->name('admin.')->middleware(['auth', 'super-admin'])->group(function () {
    Route::get('/tenants', [\App\Http\Controllers\Admin\TenantController::class, 'index'])->name('tenants.index');
    Route::post('/tenants', [\App\Http\Controllers\Admin\TenantController::class, 'store'])->name('tenants.store');
    Route::put('/tenants/{tenant}', [\App\Http\Controllers\Admin\TenantController::class, 'update'])->name('tenants.update');
    
    Route::get('/users', [\App\Http\Controllers\Admin\UserController::class, 'index'])->name('users.index');
    Route::post('/users', [\App\Http\Controllers\Admin\UserController::class, 'store'])->name('users.store');
    Route::put('/users/{user}', [\App\Http\Controllers\Admin\UserController::class, 'update'])->name('users.update');
    Route::patch('/users/{user}/promote', [\App\Http\Controllers\Admin\UserController::class, 'promote'])->name('users.promote');
    Route::patch('/users/{user}/demote', [\App\Http\Controllers\Admin\UserController::class, 'demote'])->name('users.demote');
});
