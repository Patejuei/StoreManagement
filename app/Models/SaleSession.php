<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaleSession extends Model
{
    protected $table = "sale_sessions";

    protected $fillable = [
        'product_id',
        'session_id',
        'quantity',
        'price',
        'payment_method',
        'total',
        'sale_date',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function session()
    {
        return $this->belongsTo(SaleSession::class);
    }
}
