<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductHistory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\IOFactory;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query();

        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('brand', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%");
            });
        }

        if ($request->category) {
            $query->where('category', $request->category);
        }

        return Inertia::render('inventory/index', [
            'products' => $query->orderBy('name')->paginate(20)->withQueryString(),
            'categories' => Product::whereNotNull('category')
                ->distinct()
                ->pluck('category')
                ->sort()
                ->values(),
            'filters' => $request->only(['search', 'category']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'brand' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|integer|min:0',
            'stock' => 'required|integer|min:0',
            'critical_stock' => 'required|integer|min:0',
            'sku' => 'nullable|string|max:255|unique:products,sku',
            'is_active' => 'boolean',
        ]);

        $product = Product::create($validated);

        ProductHistory::create([
            'product_id' => $product->id,
            'stock' => $product->stock,
            'movement_type' => 'initial',
            'price' => $product->price,
            'details' => 'Producto creado con stock inicial de ' . $product->stock,
        ]);

        return redirect()->back()->with('success', 'Producto creado exitosamente.');
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'brand' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|integer|min:0',
            'stock' => 'required|integer|min:0',
            'critical_stock' => 'required|integer|min:0',
            'sku' => 'nullable|string|max:255|unique:products,sku,' . $product->id,
            'is_active' => 'boolean',
        ]);

        $oldStock = $product->stock;
        $product->update($validated);

        if ($oldStock !== $product->stock) {
            ProductHistory::create([
                'product_id' => $product->id,
                'stock' => $product->stock,
                'movement_type' => 'adjustment',
                'price' => $product->price,
                'details' => "Ajuste manual de stock: {$oldStock} → {$product->stock}",
            ]);
        }

        return redirect()->back()->with('success', 'Producto actualizado exitosamente.');
    }

    public function destroy(Product $product)
    {
        $product->delete();
        return redirect()->back()->with('success', 'Producto eliminado exitosamente.');
    }

    public function history(Product $product)
    {
        return response()->json(
            $product->history()->orderBy('created_at', 'desc')->get()
        );
    }

    public function importTemplate()
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Plantilla Productos');

        $headers = ['nombre', 'marca', 'modelo', 'categoria', 'descripcion', 'precio', 'stock', 'stock_critico', 'sku'];
        foreach ($headers as $i => $header) {
            $col = chr(65 + $i);
            $sheet->setCellValue("{$col}1", $header);
            $sheet->getColumnDimension($col)->setAutoSize(true);
            $sheet->getStyle("{$col}1")->getFont()->setBold(true);
        }

        // Add example row
        $example = ['Producto Ejemplo', 'Marca X', 'Modelo Y', 'Electrónica', 'Descripción del producto', 10000, 50, 5, 'SKU001'];
        foreach ($example as $i => $value) {
            $col = chr(65 + $i);
            $sheet->setCellValue("{$col}2", $value);
        }

        $filename = 'plantilla_productos.xlsx';
        $path = storage_path("app/{$filename}");
        $writer = new Xlsx($spreadsheet);
        $writer->save($path);

        return response()->download($path, $filename)->deleteFileAfterSend();
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv',
        ]);

        $spreadsheet = IOFactory::load($request->file('file')->getPathname());
        $rows = $spreadsheet->getActiveSheet()->toArray(null, true, true, true);

        $imported = 0;
        $errors = [];

        foreach ($rows as $index => $row) {
            if ($index === 1) continue; // Skip header

            $name = trim($row['A'] ?? '');
            if (empty($name)) continue;

            try {
                $product = Product::create([
                    'name' => $name,
                    'brand' => $row['B'] ?? null,
                    'model' => $row['C'] ?? null,
                    'category' => $row['D'] ?? null,
                    'description' => $row['E'] ?? null,
                    'price' => intval($row['F'] ?? 0),
                    'stock' => intval($row['G'] ?? 0),
                    'critical_stock' => intval($row['H'] ?? 1),
                    'sku' => $row['I'] ?? null,
                    'is_active' => true,
                ]);

                ProductHistory::create([
                    'product_id' => $product->id,
                    'stock' => $product->stock,
                    'movement_type' => 'import',
                    'price' => $product->price,
                    'details' => 'Importación masiva desde Excel',
                ]);

                $imported++;
            } catch (\Exception $e) {
                $errors[] = "Fila {$index}: {$e->getMessage()}";
            }
        }

        $message = "Se importaron {$imported} producto(s) exitosamente.";
        if (count($errors) > 0) {
            $message .= ' Errores: ' . implode('; ', array_slice($errors, 0, 5));
        }

        return redirect()->back()->with('success', $message);
    }
}
