<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProtuctSale extends Model
{
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
        return $this->hasMany(ProtuctSaleRule::class);
    }
}
