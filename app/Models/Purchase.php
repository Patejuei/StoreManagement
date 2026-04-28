<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class Purchase extends Model
{
    use BelongsToTenant;
    protected $fillable = [
        'supplier_id',
        'user_id',
        'invoice_number',
        'total',
        'purchase_date',
        'type',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'purchase_date' => 'datetime',
        ];
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(PurchaseItem::class);
    }
}
