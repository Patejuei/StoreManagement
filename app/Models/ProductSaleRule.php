<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductSaleRule extends Model
{
    protected $table = "product_on_sale_rules";

    protected $fillable = [
        'product_on_sale_id',
        'product_id',
        'offer_type',
        'minimal_quantity',
        'discount_value',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'id');
    }

    public function sale()
    {
        return $this->belongsTo(ProductSale::class, 'product_on_sale_id', 'id');
    }
}
