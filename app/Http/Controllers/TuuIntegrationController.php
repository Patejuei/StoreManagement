<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use GuzzleHttp\Client;

class TuuIntegrationController extends Controller
{
    protected Client $client;

    public function __construct()
    {
        $this->client = new Client();
    }

    public function payment_request_create(Request $request, string $apiKey)
    {
        $response = $this->client->request('POST', 'https://integrations.payment.haulmer.com/PaymentRequest/Create', [
            'headers' => [
                'X-API-KEY' => $apiKey,
                'accept' => 'application/json',
                'content-type' => 'application/json'
            ],
            'body' => 'body'
        ]);

        return response()->json(json_decode($response->getBody()->getContents()));
    }

    public function get_paymentRequest(string $apiKey, int $paymentId)
    {
        $response = $this->client->request('GET', 'https://integrations.payment.haulmer.com/PaymentRequest/' . $paymentId, [
            'headers' => [
                'X-API-KEY' => $apiKey,
                'accept' => 'application/json',
            ]
        ]);

        return response()->json(json_decode($response->getBody()->getContents()));
    }
}
