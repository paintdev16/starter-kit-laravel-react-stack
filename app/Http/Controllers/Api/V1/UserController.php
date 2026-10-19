<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\User;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UserController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return UserResource::collection(User::query()->with('latestAvatar')->latest()->paginate(25));
    }

    public function show(User $user): UserResource
    {
        return new UserResource($user->loadMissing('latestAvatar'));
    }
}
