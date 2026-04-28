<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class ProductHistory extends Model
{
    use BelongsToTenant;
    protected $table = "product_history";

    protected $fillable = [
        'product_id',
        'stock',
        'movement_type',
        'price',
        'details',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
