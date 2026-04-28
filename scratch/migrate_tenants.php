<?php

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    $tenant = Tenant::firstOrCreate(['slug' => 'default'], ['name' => 'Tienda Principal']);
    echo "Tenant creado/encontrado: {$tenant->name} ({$tenant->slug})\n";

    $tables = [
        'users',
        'products',
        'sales',
        'sale_sessions',
        'product_history',
        'product_on_sale',
        'suppliers',
        'purchases'
    ];

    foreach ($tables as $table) {
        $affected = DB::table($table)->whereNull('tenant_id')->update(['tenant_id' => $tenant->id]);
        echo "Tabla {$table}: {$affected} registros actualizados.\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
