<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'name',
        'brand',
        'model',
        'category',
        'description',
        'price',
        'stock',
        'critical_stock',
        'sku',
        'image',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function history()
    {
        return $this->hasMany(ProductHistory::class);
    }

    public function saleRules()
    {
        return $this->hasMany(ProtuctSaleRule::class);
    }

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }

    public function suppliers()
    {
        return $this->belongsToMany(Supplier::class, 'product_supplier')
            ->withPivot('last_cost')
            ->withTimestamps();
    }

    public function purchaseItems()
    {
        return $this->hasMany(PurchaseItem::class);
    }
}
