<?php

namespace Tests\Feature;

use Spatie\Permission\Middleware\PermissionMiddleware;
use Tests\TestCase;

class PermissionMiddlewareTest extends TestCase
{
    public function test_permission_middleware_alias_is_registered(): void
    {
        $router = $this->app['router'];

        $this->assertArrayHasKey('permission', $router->getMiddleware());
        $this->assertSame(PermissionMiddleware::class, $router->getMiddleware()['permission']);
    }
}
