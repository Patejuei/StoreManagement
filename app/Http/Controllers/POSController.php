<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductHistory;
use App\Models\ProductSale;
use App\Models\Sale;
use App\Models\SaleSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class POSController extends Controller
{
    public function index()
    {
        $activeSession = SaleSession::where('user_id', auth()->id())
            ->whereNull('end_date')
            ->first();

        return Inertia::render('pos/index', [
            'products' => Product::where('is_active', true)->orderBy('name')->get(),
            'activeSession' => $activeSession,
            'activeOffers' => ProductSale::where('is_active', true)
                ->where('start_date', '<=', now())
                ->where(function ($q) {
                    $q->whereNull('end_date')
                        ->orWhere('end_date', '>', now());
                })
                ->with('rules.product')
                ->orderBy('priority', 'desc')
                ->get(),
        ]);
    }

    public function startSession(Request $request)
    {
        $request->validate([
            'start_cash' => 'required|integer|min:0',
        ]);

        // Close any existing open session for this user
        SaleSession::where('user_id', auth()->id())
            ->whereNull('end_date')
            ->update(['end_date' => now()]);

        SaleSession::create([
            'user_id' => auth()->id(),
            'start_cash' => $request->start_cash,
            'start_date' => now(),
        ]);

        return redirect()->back()->with('success', 'Sesión de caja iniciada correctamente.');
    }

    public function endSession(Request $request)
    {
        $request->validate([
            'session_id' => 'required|exists:sale_sessions,id',
            'end_cash' => 'required|integer|min:0',
        ]);

        $session = SaleSession::findOrFail($request->session_id);
        $session->update([
            'end_date' => now(),
            'end_cash' => $request->end_cash,
        ]);

        return redirect()->back()->with('success', 'Sesión de caja cerrada correctamente.');
    }

    public function checkout(Request $request)
    {
        $request->validate([
            'session_id' => 'required|exists:sale_sessions,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|integer|min:0',
            'items.*.discount' => 'nullable|integer|min:0',
            'items.*.total' => 'required|integer|min:0',
            'payment_method' => 'required|in:cash,card,transfer',
            'total' => 'required|integer|min:0',
        ]);

        DB::transaction(function () use ($request) {
            foreach ($request->items as $item) {
                Sale::create([
                    'product_id' => $item['product_id'],
                    'session_id' => $request->session_id,
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'payment_method' => $request->payment_method,
                    'total' => $item['total'],
                    'sale_date' => now(),
                ]);

                $product = Product::find($item['product_id']);
                $product->decrement('stock', $item['quantity']);

                ProductHistory::create([
                    'product_id' => $item['product_id'],
                    'stock' => $product->fresh()->stock,
                    'movement_type' => 'sale',
                    'price' => $item['price'],
                    'details' => "Venta de {$item['quantity']} unidad(es) — " . ucfirst($request->payment_method),
                ]);
            }

            $session = SaleSession::find($request->session_id);
            $method = $request->payment_method;
            $totalField = match ($method) {
                'cash' => 'total_cash_sales',
                'card' => 'total_card_sales',
                'transfer' => 'total_transfer_sales',
            };

            $session->increment($totalField, $request->total);
            $session->increment('total_sales', $request->total);
        });

        return redirect()->back()->with('success', 'Venta registrada exitosamente.');
    }
}
