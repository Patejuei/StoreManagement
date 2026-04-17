<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TuuIntegration extends Model
{
    protected $fillable = [
        'api_key',
        'pos_serial',
        'company_id'
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
