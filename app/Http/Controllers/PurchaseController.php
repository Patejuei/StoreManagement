<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductHistory;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PurchaseController extends Controller
{
    public function index()
    {
        return Inertia::render('purchases/index', [
            'purchases' => Purchase::with(['supplier', 'user', 'items.product'])
                ->orderBy('created_at', 'desc')
                ->paginate(15)
                ->withQueryString(),
            'suppliers' => Supplier::where('is_active', true)->orderBy('name')->get(),
            'products' => Product::where('is_active', true)->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|in:frequent,external',
            'supplier_id' => 'required_if:type,frequent|nullable|exists:suppliers,id',
            'invoice_number' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_cost' => 'required|integer|min:0',
        ]);

        DB::transaction(function () use ($request) {
            $total = 0;

            foreach ($request->items as $item) {
                $total += $item['quantity'] * $item['unit_cost'];
            }

            $purchase = Purchase::create([
                'supplier_id' => $request->type === 'frequent' ? $request->supplier_id : null,
                'user_id' => auth()->id(),
                'invoice_number' => $request->invoice_number,
                'total' => $total,
                'purchase_date' => now(),
                'type' => $request->type,
                'notes' => $request->notes,
            ]);

            foreach ($request->items as $item) {
                $subtotal = $item['quantity'] * $item['unit_cost'];

                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'],
                    'subtotal' => $subtotal,
                ]);

                // Update product stock
                $product = Product::find($item['product_id']);
                $product->increment('stock', $item['quantity']);

                // Record in product history
                ProductHistory::create([
                    'product_id' => $item['product_id'],
                    'stock' => $product->fresh()->stock,
                    'movement_type' => 'purchase',
                    'price' => $item['unit_cost'],
                    'details' => "Compra de {$item['quantity']} unidad(es) — Factura: " . ($request->invoice_number ?? 'S/N'),
                ]);

                // Update product-supplier relationship
                if ($request->type === 'frequent' && $request->supplier_id) {
                    DB::table('product_supplier')->updateOrInsert(
                        [
                            'product_id' => $item['product_id'],
                            'supplier_id' => $request->supplier_id,
                        ],
                        [
                            'last_cost' => $item['unit_cost'],
                            'updated_at' => now(),
                            'created_at' => DB::raw('COALESCE(created_at, NOW())'),
                        ]
                    );
                }
            }
        });

        return redirect()->back()->with('success', 'Compra registrada exitosamente.');
    }

    public function show(Purchase $purchase)
    {
        return response()->json(
            $purchase->load(['supplier', 'user', 'items.product'])
        );
    }
}
