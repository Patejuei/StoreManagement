import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { FileBarChart, Download, Calendar, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const formatCLP = (amount: number) => `$${amount.toLocaleString('es-CL')}`;

const REPORT_TYPES = [
    {
        value: 'sales',
        label: 'Ventas',
        description: 'Reporte detallado de ventas por periodo',
        fields: [
            { value: 'date', label: 'Fecha de Venta' },
            { value: 'product', label: 'Producto' },
            { value: 'sku', label: 'SKU' },
            { value: 'quantity', label: 'Cantidad' },
            { value: 'price', label: 'Precio Unitario' },
            { value: 'total', label: 'Total' },
            { value: 'payment_method', label: 'Método de Pago' },
        ],
    },
    {
        value: 'cash_flow',
        label: 'Flujo de Caja',
        description: 'Resumen de sesiones de caja y movimientos',
        fields: [
            { value: 'session_date', label: 'Fecha Sesión' },
            { value: 'user', label: 'Usuario' },
            { value: 'start_cash', label: 'Efectivo Inicial' },
            { value: 'end_cash', label: 'Efectivo Final' },
            { value: 'cash_sales', label: 'Ventas Efectivo' },
            { value: 'card_sales', label: 'Ventas Tarjeta' },
            { value: 'transfer_sales', label: 'Ventas Transferencia' },
            { value: 'total_sales', label: 'Total Ventas' },
        ],
    },
    {
        value: 'inventory',
        label: 'Inventario',
        description: 'Estado actual del inventario de productos',
        fields: [
            { value: 'name', label: 'Nombre' },
            { value: 'sku', label: 'SKU' },
            { value: 'brand', label: 'Marca' },
            { value: 'category', label: 'Categoría' },
            { value: 'price', label: 'Precio' },
            { value: 'stock', label: 'Stock' },
            { value: 'critical_stock', label: 'Stock Crítico' },
            { value: 'status', label: 'Estado' },
        ],
    },
    {
        value: 'purchases',
        label: 'Compras',
        description: 'Registro de compras y abastecimiento',
        fields: [
            { value: 'date', label: 'Fecha' },
            { value: 'supplier', label: 'Proveedor' },
            { value: 'invoice', label: 'N° Factura' },
            { value: 'type', label: 'Tipo de Compra' },
            { value: 'total', label: 'Total' },
            { value: 'items_count', label: 'Cantidad de Items' },
        ],
    },
];

export default function Reports() {
    const [reportType, setReportType] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedFields, setSelectedFields] = useState<string[]>([]);
    const [processing, setProcessing] = useState(false);

    const currentReport = REPORT_TYPES.find((r) => r.value === reportType);
    const isInventory = reportType === 'inventory';

    const toggleField = (field: string) => {
        setSelectedFields((prev) =>
            prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
        );
    };

    const selectAll = () => {
        if (!currentReport) return;
        const allFields = currentReport.fields.map((f) => f.value);
        setSelectedFields(
            selectedFields.length === allFields.length ? [] : allFields,
        );
    };

    const handleGenerate = () => {
        setProcessing(true);

        // For file download, use a form submission approach
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/reports/generate';

        const csrfMeta = document.querySelector('meta[name="csrf-token"]');
        const csrfToken = csrfMeta?.getAttribute('content') || '';

        const fields = {
            _token: csrfToken,
            type: reportType,
            start_date: startDate || new Date().toISOString().split('T')[0],
            end_date: endDate || new Date().toISOString().split('T')[0],
        };

        Object.entries(fields).forEach(([key, value]) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value;
            form.appendChild(input);
        });

        selectedFields.forEach((f) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'fields[]';
            input.value = f;
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

        setTimeout(() => setProcessing(false), 2000);
    };

    const canGenerate = reportType && selectedFields.length > 0 && (isInventory || (startDate && endDate));

    return (
        <>
            <Head title="Reportes" />

            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-extrabold">Generación de Reportes</h1>
                    <p className="text-sm text-muted-foreground">Genera reportes personalizados descargables en Excel</p>
                </div>

                <div className="mx-auto w-full max-w-2xl">
                    <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
                        {/* Step 1 — Report type */}
                        <div className="mb-6">
                            <div className="mb-3 flex items-center gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">1</span>
                                <h2 className="font-semibold">Tipo de Reporte</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {REPORT_TYPES.map((type) => (
                                    <button
                                        key={type.value}
                                        onClick={() => {
                                            setReportType(type.value);
                                            setSelectedFields(type.fields.map((f) => f.value));
                                        }}
                                        className={cn(
                                            'rounded-xl border-2 p-4 text-left transition-all',
                                            reportType === type.value
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border/50 hover:border-primary/30',
                                        )}
                                    >
                                        <p className="font-semibold text-sm">{type.label}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {reportType && (
                            <>
                                {/* Step 2 — Date range (not for inventory) */}
                                {!isInventory && (
                                    <div className="mb-6">
                                        <div className="mb-3 flex items-center gap-2">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">2</span>
                                            <h2 className="font-semibold">Periodo del Reporte</h2>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label className="text-xs text-muted-foreground">Fecha Inicio</Label>
                                                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1" />
                                            </div>
                                            <div>
                                                <Label className="text-xs text-muted-foreground">Fecha Fin</Label>
                                                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3 — Fields */}
                                <div className="mb-6">
                                    <div className="mb-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                                                {isInventory ? '2' : '3'}
                                            </span>
                                            <h2 className="font-semibold">Datos a Incluir</h2>
                                        </div>
                                        <button
                                            onClick={selectAll}
                                            className="text-xs font-medium text-primary hover:underline"
                                        >
                                            {selectedFields.length === currentReport?.fields.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {currentReport?.fields.map((field) => (
                                            <label
                                                key={field.value}
                                                className={cn(
                                                    'flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm cursor-pointer transition-all',
                                                    selectedFields.includes(field.value)
                                                        ? 'border-primary/40 bg-primary/5'
                                                        : 'border-border/40 hover:border-primary/20',
                                                )}
                                            >
                                                <Checkbox
                                                    checked={selectedFields.includes(field.value)}
                                                    onCheckedChange={() => toggleField(field.value)}
                                                />
                                                <span>{field.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <Separator className="my-5" />

                                {/* Generate */}
                                <Button
                                    onClick={handleGenerate}
                                    disabled={!canGenerate || processing}
                                    className="glow-primary w-full text-base font-bold"
                                    size="lg"
                                >
                                    <Download className="mr-2 h-5 w-5" />
                                    {processing ? 'Generando...' : 'Generar y Descargar Reporte'}
                                </Button>

                                {!canGenerate && reportType && (
                                    <p className="mt-2 text-center text-xs text-muted-foreground">
                                        {selectedFields.length === 0
                                            ? 'Selecciona al menos un campo para incluir en el reporte.'
                                            : !isInventory && (!startDate || !endDate)
                                              ? 'Selecciona el periodo del reporte.'
                                              : ''}
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

Reports.layout = {
    breadcrumbs: [
        { title: 'Reportes', href: '/reports' },
    ],
};
