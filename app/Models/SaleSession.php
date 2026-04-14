<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaleSession extends Model
{
    protected $table = "sale_sessions";

    protected $fillable = [
        'user_id',
        'start_date',
        'end_date',
        'start_cash',
        'end_cash',
        'total_cash_sales',
        'total_card_sales',
        'total_transfer_sales',
        'total_sales',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'datetime',
            'end_date' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function sales()
    {
        return $this->hasMany(Sale::class, 'session_id');
    }
}
