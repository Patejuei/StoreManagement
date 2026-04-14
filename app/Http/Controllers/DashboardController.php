<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductHistory;
use App\Models\Sale;
use App\Models\Purchase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $monthParam = $request->query('month'); // format: YYYY-MM
        if ($monthParam) {
            $startOfMonth = Carbon::createFromFormat('Y-m', $monthParam)->startOfMonth();
        } else {
            $startOfMonth = Carbon::now()->startOfMonth();
        }
        $endOfMonth = $startOfMonth->copy()->endOfMonth();

        // ═══════ DAILY SALES ═══════
        $dailySales = Sale::select(
                DB::raw('DATE(sale_date) as date'),
                DB::raw('SUM(total) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->whereBetween('sale_date', [$startOfMonth, $endOfMonth])
            ->groupBy(DB::raw('DATE(sale_date)'))
            ->orderBy('date')
            ->get()
            ->map(fn ($row) => [
                'date' => $row->date,
                'total' => (int) $row->total,
                'count' => (int) $row->count,
            ]);

        // ═══════ SALES BY PAYMENT METHOD ═══════
        $salesByMethod = Sale::select(
                'payment_method',
                DB::raw('SUM(total) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->whereBetween('sale_date', [$startOfMonth, $endOfMonth])
            ->groupBy('payment_method')
            ->get()
            ->map(fn ($row) => [
                'method' => $row->payment_method,
                'total' => (int) $row->total,
                'count' => (int) $row->count,
            ]);

        // ═══════ MONTHLY TOTALS ═══════
        $totalSales = Sale::whereBetween('sale_date', [$startOfMonth, $endOfMonth])->sum('total');
        $totalSalesCount = Sale::whereBetween('sale_date', [$startOfMonth, $endOfMonth])->count();
        $totalPurchases = Purchase::whereBetween('purchase_date', [$startOfMonth, $endOfMonth])->sum('total');

        // ═══════ PRODUCT RANKINGS (by quantity sold) ═══════
        $topProducts = Sale::select(
                'product_id',
                DB::raw('SUM(quantity) as total_quantity'),
                DB::raw('SUM(total) as total_revenue')
            )
            ->whereBetween('sale_date', [$startOfMonth, $endOfMonth])
            ->groupBy('product_id')
            ->orderByDesc('total_quantity')
            ->limit(5)
            ->with('product:id,name,sku,image')
            ->get()
            ->map(fn ($row) => [
                'product_id' => $row->product_id,
                'name' => $row->product?->name ?? 'N/A',
                'sku' => $row->product?->sku,
                'total_quantity' => (int) $row->total_quantity,
                'total_revenue' => (int) $row->total_revenue,
            ]);

        $bottomProducts = Sale::select(
                'product_id',
                DB::raw('SUM(quantity) as total_quantity'),
                DB::raw('SUM(total) as total_revenue')
            )
            ->whereBetween('sale_date', [$startOfMonth, $endOfMonth])
            ->groupBy('product_id')
            ->orderBy('total_quantity')
            ->limit(5)
            ->with('product:id,name,sku,image')
            ->get()
            ->map(fn ($row) => [
                'product_id' => $row->product_id,
                'name' => $row->product?->name ?? 'N/A',
                'sku' => $row->product?->sku,
                'total_quantity' => (int) $row->total_quantity,
                'total_revenue' => (int) $row->total_revenue,
            ]);

        // ═══════ CRITICAL STOCK ═══════
        $criticalStock = Product::whereColumn('stock', '<=', 'critical_stock')
            ->where('is_active', true)
            ->orderBy('stock')
            ->limit(10)
            ->get(['id', 'name', 'sku', 'stock', 'critical_stock', 'price']);

        // ═══════ INVENTORY MOVEMENTS ═══════
        $movements = ProductHistory::select(
                'movement_type',
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(ABS(stock)) as total_units')
            )
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->groupBy('movement_type')
            ->get()
            ->map(fn ($row) => [
                'type' => $row->movement_type,
                'count' => (int) $row->count,
                'total_units' => (int) $row->total_units,
            ]);

        // ═══════ DAILY MOVEMENTS ═══════
        $dailyMovements = ProductHistory::select(
                DB::raw('DATE(created_at) as date'),
                'movement_type',
                DB::raw('COUNT(*) as count')
            )
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->groupBy(DB::raw('DATE(created_at)'), 'movement_type')
            ->orderBy('date')
            ->get()
            ->groupBy('date')
            ->map(fn ($group, $date) => [
                'date' => $date,
                ...collect($group)->mapWithKeys(fn ($row) => [$row->movement_type => (int) $row->count])->toArray(),
            ])
            ->values();

        return Inertia::render('dashboard', [
            'currentMonth' => $startOfMonth->format('Y-m'),
            'dailySales' => $dailySales,
            'salesByMethod' => $salesByMethod,
            'totalSales' => (int) $totalSales,
            'totalSalesCount' => (int) $totalSalesCount,
            'totalPurchases' => (int) $totalPurchases,
            'topProducts' => $topProducts,
            'bottomProducts' => $bottomProducts,
            'criticalStock' => $criticalStock,
            'movements' => $movements,
            'dailyMovements' => $dailyMovements,
        ]);
    }
}
