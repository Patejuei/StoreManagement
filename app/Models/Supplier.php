<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $fillable = [
        'name',
        'rut',
        'phone',
        'email',
        'address',
        'contact_person',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'product_supplier')
            ->withPivot('last_cost')
            ->withTimestamps();
    }

    public function purchases()
    {
        return $this->hasMany(Purchase::class);
    }
}
