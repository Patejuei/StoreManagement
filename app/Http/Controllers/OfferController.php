<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProtuctSale;
use App\Models\ProtuctSaleRule;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OfferController extends Controller
{
    public function index()
    {
        return Inertia::render('offers/index', [
            'offers' => ProtuctSale::with('rules.product')
                ->orderBy('priority', 'desc')
                ->orderBy('created_at', 'desc')
                ->get(),
            'products' => Product::where('is_active', true)->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'priority' => 'required|integer|min:0',
            'is_active' => 'boolean',
            'rules' => 'required|array|min:1',
            'rules.*.product_id' => 'required|exists:products,id',
            'rules.*.offer_type' => 'required|in:percentage,fixed',
            'rules.*.minimal_quantity' => 'required|integer|min:1',
            'rules.*.discount_value' => 'required|numeric|min:0',
        ]);

        $offer = ProtuctSale::create([
            'name' => $request->name,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'priority' => $request->priority,
            'is_active' => $request->is_active ?? true,
        ]);

        foreach ($request->rules as $rule) {
            ProtuctSaleRule::create([
                'product_on_sale_id' => $offer->id,
                'product_id' => $rule['product_id'],
                'offer_type' => $rule['offer_type'],
                'minimal_quantity' => $rule['minimal_quantity'],
                'discount_value' => $rule['discount_value'],
            ]);
        }

        return redirect()->back()->with('success', 'Oferta creada exitosamente.');
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'priority' => 'required|integer|min:0',
            'is_active' => 'boolean',
            'rules' => 'required|array|min:1',
            'rules.*.product_id' => 'required|exists:products,id',
            'rules.*.offer_type' => 'required|in:percentage,fixed',
            'rules.*.minimal_quantity' => 'required|integer|min:1',
            'rules.*.discount_value' => 'required|numeric|min:0',
        ]);

        $offer = ProtuctSale::findOrFail($id);
        $offer->update([
            'name' => $request->name,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'priority' => $request->priority,
            'is_active' => $request->is_active ?? true,
        ]);

        // Replace all rules
        $offer->rules()->delete();

        foreach ($request->rules as $rule) {
            ProtuctSaleRule::create([
                'product_on_sale_id' => $offer->id,
                'product_id' => $rule['product_id'],
                'offer_type' => $rule['offer_type'],
                'minimal_quantity' => $rule['minimal_quantity'],
                'discount_value' => $rule['discount_value'],
            ]);
        }

        return redirect()->back()->with('success', 'Oferta actualizada exitosamente.');
    }

    public function destroy($id)
    {
        $offer = ProtuctSale::findOrFail($id);
        $offer->rules()->delete();
        $offer->delete();

        return redirect()->back()->with('success', 'Oferta eliminada exitosamente.');
    }

    public function toggleActive($id)
    {
        $offer = ProtuctSale::findOrFail($id);
        $offer->update(['is_active' => !$offer->is_active]);

        $status = $offer->is_active ? 'activada' : 'desactivada';
        return redirect()->back()->with('success', "Oferta {$status} exitosamente.");
    }
}
