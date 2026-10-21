<?php

namespace App\Http\Controllers;

use App\Models\Song;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function toggle(Request $request, Song $song): JsonResponse|RedirectResponse
    {
        $user = $request->user();

        if ($user->favorites()->whereKey($song->id)->exists()) {
            $user->favorites()->detach($song->id);
            $favorite = false;
        } else {
            $user->favorites()->syncWithoutDetaching([$song->id]);
            $favorite = true;
        }

        if ($request->expectsJson()) {
            return response()->json(['favorite' => $favorite]);
        }

        return back()->with('status', $favorite ? 'Đã thêm vào bài hát yêu thích.' : 'Đã bỏ khỏi bài hát yêu thích.');
    }
}
