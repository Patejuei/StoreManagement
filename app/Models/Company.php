<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    protected $fillable = [
        'name',
        'address',
        'phone',
        'email'
    ];

    public function tuu_integrations()
    {
        return $this->hasMany(TuuIntegration::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
