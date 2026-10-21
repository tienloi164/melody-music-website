<?php

namespace Database\Seeders;

use App\Models\Song;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        Song::query()->firstOrCreate(
            ['audio_url' => 'https://www.youtube.com/watch?v=rzVP8ix-H9Y'],
            [
                'title' => 'Bông Hoa Đẹp Nhất',
                'artist' => 'Quân A.P',
                'cover_url' => null,
                'mood' => 'Chill',
            ],
        );
    }
}
