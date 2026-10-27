<?php

namespace Tests\Unit;

use App\Http\Controllers\ProductController;
use Illuminate\Routing\Controller as BaseController;
use Tests\TestCase;

class ProductControllerMiddlewareTest extends TestCase
{
    public function test_product_controller_inherits_laravel_controller_and_supports_middleware()
    {
        $controller = new ProductController();

        $this->assertInstanceOf(BaseController::class, $controller);

        $result = $controller->middleware('auth:sanctum');

        $this->assertNotEmpty($controller->getMiddleware());
        $this->assertSame('auth:sanctum', $controller->getMiddleware()[0]['middleware']);
        $this->assertNotNull($result);
    }
}
