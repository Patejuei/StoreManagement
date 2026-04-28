<?php
namespace App\Http\Controllers;

require_once('vendor/autoload.php');

use Illuminate\Http\Request;

class TuuIntegrationController extends Controller
{
    protected $client = new \GuzzleHttp\Client();
    function payment_request_create(Request $request, string $apiKey)
    {

        $response = $this->client->request('POST', 'https://integrations.payment.haulmer.com/PaymentRequest/Create', [
            'headers' => [
                'X-API-KEY' => $apiKey,
                'accept' => 'application/json',
                'content-type' => 'application/json'
            ],
            'body' => 'body'
        ]);

        return response()->json($response);
    }

    function get_paymentRequest(string $apiKey, int $paymentId)
    {

        $response = $this->client->request('GET', 'https://integrations.payment.haulmer.com/PaymentRequest/' . $paymentId, [
            'headers' => [
                'X-API-KEY' => $apiKey,
                'accept' => 'application/json',
            ]
        ]);

        return response()->json($response);
    }
}
