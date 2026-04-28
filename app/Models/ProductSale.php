<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class ProductSale extends Model
{
    use BelongsToTenant;
    protected $table = "product_on_sale";

    protected $fillable = [
        'name',
        'start_date',
        'end_date',
        'priority',
        'is_active',
    ];

    public function rules()
    {
        return $this->hasMany(ProductSaleRule::class, 'product_on_sale_id', 'id');
    }
}
