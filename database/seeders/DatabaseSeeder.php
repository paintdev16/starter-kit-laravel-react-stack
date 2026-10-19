<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $users = [
            ['name' => 'Paint', 'email' => 'paint@gmail.com'],
            ['name' => 'Juan Pérez', 'email' => 'juan@gmail.com'],
            ['name' => 'María López', 'email' => 'maria@gmail.com'],
            ['name' => 'Carlos Mendoza', 'email' => 'carlos@gmail.com'],
        ];

        foreach ($users as $user) {
            User::query()->firstOrCreate(
                ['email' => $user['email']],
                [
                    'name' => $user['name'],
                    'email_verified_at' => now(),
                    'password' => Hash::make('123456789'),
                ],
            );
        }

        $this->call(RolesAndPermissionsSeeder::class);
    }
}
