<?php

namespace App\Http\Controllers;

use App\Models\Song;
use Illuminate\Contracts\View\View;

class HomeController extends Controller
{
    public function __invoke(): View
    {
        $user = auth()->user();
        $songs = Song::query()->latest()->get();
        $favoriteIds = $user?->favorites()->pluck('songs.id')->map(fn ($id): int => (int) $id)->all() ?? [];

        $tracks = $songs->map(fn (Song $song): array => [
            'id' => (string) $song->id,
            'title' => $song->title,
            'artist' => $song->artist,
            'audio' => $song->audioSource(),
            'cover' => $song->coverSource(),
            'mood' => $song->mood,
            'duration' => '',
            'favorite' => in_array($song->id, $favoriteIds, true),
            'lyrics' => $song->lyrics ?? [],
        ])->values();

        return view('home', [
            'tracks' => $tracks,
            'favoriteIds' => $favoriteIds,
            'isAdmin' => $user?->isAdmin() ?? false,
            'isAuthenticated' => $user !== null,
        ]);
    }
}
