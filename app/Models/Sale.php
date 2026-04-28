<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    use BelongsToTenant;
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
        return $this->belongsTo(SaleSession::class, 'session_id');
    }
}
