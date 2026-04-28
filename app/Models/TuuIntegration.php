<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TuuIntegration extends Model
{
    protected $fillable = [
        'api_key',
        'pos_serial',
        'tenant_id'
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
