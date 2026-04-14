<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index()
    {
        return response()->json(
            Supplier::where('is_active', true)->orderBy('name')->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'rut' => 'nullable|string|max:20',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
            'contact_person' => 'nullable|string|max:255',
        ]);

        $supplier = Supplier::create($validated);

        return redirect()->back()->with('success', 'Proveedor creado exitosamente.');
    }

    public function update(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'rut' => 'nullable|string|max:20',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
            'contact_person' => 'nullable|string|max:255',
        ]);

        $supplier->update($validated);

        return redirect()->back()->with('success', 'Proveedor actualizado exitosamente.');
    }

    public function destroy(Supplier $supplier)
    {
        $supplier->update(['is_active' => false]);
        return redirect()->back()->with('success', 'Proveedor desactivado exitosamente.');
    }

    public function products(Supplier $supplier)
    {
        return response()->json(
            $supplier->products()->get()
        );
    }
}
