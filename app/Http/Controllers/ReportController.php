<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\SaleSession;
use Illuminate\Http\Request;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

class ReportController extends Controller
{
    public function index()
    {
        return Inertia::render('reports/index');
    }

    public function generate(Request $request)
    {
        $request->validate([
            'type' => 'required|in:sales,cash_flow,inventory,purchases',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'fields' => 'required|array|min:1',
        ]);

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $type = $request->type;
        $startDate = $request->start_date;
        $endDate = $request->end_date . ' 23:59:59';
        $fields = $request->fields;

        match ($type) {
            'sales' => $this->buildSalesReport($sheet, $startDate, $endDate, $fields),
            'cash_flow' => $this->buildCashFlowReport($sheet, $startDate, $endDate, $fields),
            'inventory' => $this->buildInventoryReport($sheet, $fields),
            'purchases' => $this->buildPurchasesReport($sheet, $startDate, $endDate, $fields),
        };

        // Style the header row
        $lastCol = $sheet->getHighestColumn();
        $headerRange = "A1:{$lastCol}1";
        $sheet->getStyle($headerRange)->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'D4930D'],
            ],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        // Auto-size columns
        foreach (range('A', $lastCol) as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $titles = [
            'sales' => 'Reporte_Ventas',
            'cash_flow' => 'Reporte_Flujo_Caja',
            'inventory' => 'Reporte_Inventario',
            'purchases' => 'Reporte_Compras',
        ];

        $tenantSlug = app('tenant')->slug ?? 'default';
        $filename = $titles[$type] . '_' . $tenantSlug . '_' . date('Y-m-d_His') . '.xlsx';
        $path = storage_path("app/{$filename}");
        $writer = new Xlsx($spreadsheet);
        $writer->save($path);

        return response()->download($path, $filename)->deleteFileAfterSend();
    }

    private function buildSalesReport($sheet, $startDate, $endDate, $fields)
    {
        $sheet->setTitle('Ventas');

        $headers = [];
        $fieldMap = [
            'date' => 'Fecha',
            'product' => 'Producto',
            'sku' => 'SKU',
            'quantity' => 'Cantidad',
            'price' => 'Precio Unit.',
            'total' => 'Total',
            'payment_method' => 'Método de Pago',
        ];

        $col = 'A';
        foreach ($fields as $f) {
            if (isset($fieldMap[$f])) {
                $sheet->setCellValue("{$col}1", $fieldMap[$f]);
                $headers[$f] = $col;
                $col++;
            }
        }

        $sales = Sale::with('product')
            ->whereBetween('sale_date', [$startDate, $endDate])
            ->orderBy('sale_date', 'desc')
            ->get();

        $methods = ['cash' => 'Efectivo', 'card' => 'Tarjeta', 'transfer' => 'Transferencia'];
        $row = 2;
        foreach ($sales as $sale) {
            foreach ($headers as $field => $col) {
                $value = match ($field) {
                    'date' => $sale->sale_date,
                    'product' => $sale->product?->name ?? 'N/A',
                    'sku' => $sale->product?->sku ?? '',
                    'quantity' => $sale->quantity,
                    'price' => $sale->price,
                    'total' => $sale->total,
                    'payment_method' => $methods[$sale->payment_method] ?? $sale->payment_method,
                };
                $sheet->setCellValue("{$col}{$row}", $value);
            }
            $row++;
        }
    }

    private function buildCashFlowReport($sheet, $startDate, $endDate, $fields)
    {
        $sheet->setTitle('Flujo de Caja');

        $headers = [];
        $fieldMap = [
            'session_date' => 'Fecha',
            'user' => 'Usuario',
            'start_cash' => 'Efectivo Inicial',
            'end_cash' => 'Efectivo Final',
            'cash_sales' => 'Ventas Efectivo',
            'card_sales' => 'Ventas Tarjeta',
            'transfer_sales' => 'Ventas Transferencia',
            'total_sales' => 'Total Ventas',
        ];

        $col = 'A';
        foreach ($fields as $f) {
            if (isset($fieldMap[$f])) {
                $sheet->setCellValue("{$col}1", $fieldMap[$f]);
                $headers[$f] = $col;
                $col++;
            }
        }

        $sessions = SaleSession::with('user')
            ->whereBetween('start_date', [$startDate, $endDate])
            ->orderBy('start_date', 'desc')
            ->get();

        $row = 2;
        foreach ($sessions as $session) {
            foreach ($headers as $field => $col) {
                $value = match ($field) {
                    'session_date' => $session->start_date?->format('Y-m-d H:i'),
                    'user' => $session->user?->name ?? 'N/A',
                    'start_cash' => $session->start_cash,
                    'end_cash' => $session->end_cash ?? 'Sin cerrar',
                    'cash_sales' => $session->total_cash_sales,
                    'card_sales' => $session->total_card_sales,
                    'transfer_sales' => $session->total_transfer_sales,
                    'total_sales' => $session->total_sales,
                };
                $sheet->setCellValue("{$col}{$row}", $value);
            }
            $row++;
        }
    }

    private function buildInventoryReport($sheet, $fields)
    {
        $sheet->setTitle('Inventario');

        $headers = [];
        $fieldMap = [
            'name' => 'Nombre',
            'sku' => 'SKU',
            'brand' => 'Marca',
            'category' => 'Categoría',
            'price' => 'Precio',
            'stock' => 'Stock',
            'critical_stock' => 'Stock Crítico',
            'status' => 'Estado',
        ];

        $col = 'A';
        foreach ($fields as $f) {
            if (isset($fieldMap[$f])) {
                $sheet->setCellValue("{$col}1", $fieldMap[$f]);
                $headers[$f] = $col;
                $col++;
            }
        }

        $products = Product::orderBy('name')->get();

        $row = 2;
        foreach ($products as $product) {
            foreach ($headers as $field => $col) {
                $value = match ($field) {
                    'name' => $product->name,
                    'sku' => $product->sku ?? '',
                    'brand' => $product->brand ?? '',
                    'category' => $product->category ?? '',
                    'price' => $product->price,
                    'stock' => $product->stock,
                    'critical_stock' => $product->critical_stock,
                    'status' => $product->stock <= $product->critical_stock ? 'CRITICO' : ($product->is_active ? 'Activo' : 'Inactivo'),
                };
                $sheet->setCellValue("{$col}{$row}", $value);
            }
            $row++;
        }
    }

    private function buildPurchasesReport($sheet, $startDate, $endDate, $fields)
    {
        $sheet->setTitle('Compras');

        $headers = [];
        $fieldMap = [
            'date' => 'Fecha',
            'supplier' => 'Proveedor',
            'invoice' => 'N° Factura',
            'type' => 'Tipo',
            'total' => 'Total',
            'items_count' => 'Cant. Items',
        ];

        $col = 'A';
        foreach ($fields as $f) {
            if (isset($fieldMap[$f])) {
                $sheet->setCellValue("{$col}1", $fieldMap[$f]);
                $headers[$f] = $col;
                $col++;
            }
        }

        $purchases = Purchase::with(['supplier', 'items'])
            ->whereBetween('purchase_date', [$startDate, $endDate])
            ->orderBy('purchase_date', 'desc')
            ->get();

        $types = ['frequent' => 'Proveedor Frecuente', 'external' => 'Compra Externa'];
        $row = 2;
        foreach ($purchases as $purchase) {
            foreach ($headers as $field => $col) {
                $value = match ($field) {
                    'date' => $purchase->purchase_date?->format('Y-m-d'),
                    'supplier' => $purchase->supplier?->name ?? 'Externo',
                    'invoice' => $purchase->invoice_number ?? 'S/N',
                    'type' => $types[$purchase->type] ?? $purchase->type,
                    'total' => $purchase->total,
                    'items_count' => $purchase->items->count(),
                };
                $sheet->setCellValue("{$col}{$row}", $value);
            }
            $row++;
        }
    }
}
