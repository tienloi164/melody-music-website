<?php

namespace Tests\Feature;

use App\Models\Song;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SongAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_accounts_are_regular_users_and_cannot_assign_themselves_admin(): void
    {
        $this->post('/register', [
            'name' => 'Regular User',
            'email' => 'regular@example.com',
            'password' => 'melody-password',
            'password_confirmation' => 'melody-password',
            'role' => 'admin',
        ])->assertRedirect('/');

        $this->assertDatabaseHas('users', [
            'email' => 'regular@example.com',
            'role' => 'user',
        ]);
    }

    public function test_regular_users_cannot_access_admin_song_management(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/admin/songs')->assertForbidden();
        $this->actingAs($user)->post('/admin/songs', $this->songData())->assertForbidden();
    }

    public function test_guests_must_sign_in_before_accessing_admin_song_management(): void
    {
        $this->get('/admin/songs')->assertRedirect('/login');
    }

    public function test_admin_can_create_update_and_delete_songs(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create();
        $admin->forceFill(['role' => 'admin'])->save();

        $this->actingAs($admin)
            ->post('/admin/songs', $this->songUploadData())
            ->assertRedirect('/admin/songs');

        $song = Song::query()->firstOrFail();
        $this->assertSame('Demo Track', $song->title);

        $this->put("/admin/songs/{$song->id}", [
            ...$this->songData(),
            'title' => 'Updated Demo Track',
        ])->assertRedirect('/admin/songs');
        $this->assertDatabaseHas('songs', ['id' => $song->id, 'title' => 'Updated Demo Track']);

        $audioPath = $song->fresh()->audio_url;
        $coverPath = $song->fresh()->cover_url;
        $this->delete("/admin/songs/{$song->id}")->assertRedirect('/admin/songs');
        $this->assertDatabaseMissing('songs', ['id' => $song->id]);
        Storage::disk('public')->assertMissing($audioPath);
        Storage::disk('public')->assertMissing($coverPath);
    }

    public function test_admin_can_upload_audio_and_cover_files_for_a_song(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create();
        $admin->forceFill(['role' => 'admin'])->save();

        $this->actingAs($admin)->post('/admin/songs', $this->songUploadData([
            'audio_file' => UploadedFile::fake()->create('song.mp3', 10, 'audio/mpeg'),
            'cover_file' => UploadedFile::fake()->create('cover.jpg', 10, 'image/jpeg'),
        ]))->assertRedirect('/admin/songs');

        $song = Song::query()->firstOrFail();
        $this->assertStringStartsWith('songs/', $song->audio_url);
        $this->assertStringStartsWith('covers/', $song->cover_url);
        Storage::disk('public')->assertExists($song->audio_url);
        Storage::disk('public')->assertExists($song->cover_url);
        $this->assertSame('/storage/'.$song->audio_url, $song->audioSource());
        $this->assertSame('/storage/'.$song->cover_url, $song->coverSource());
        $this->get('/')->assertOk();

        $originalAudio = $song->audio_url;
        $this->actingAs($admin)->put("/admin/songs/{$song->id}", [
            ...$this->songData(),
            'title' => 'Updated Demo Track',
        ])->assertRedirect('/admin/songs');
        $this->assertSame($originalAudio, $song->fresh()->audio_url);

        $this->actingAs($admin)->put("/admin/songs/{$song->id}", [
            ...$this->songData(),
            'audio_file' => UploadedFile::fake()->create('replacement.mp3', 10, 'audio/mpeg'),
        ])->assertRedirect('/admin/songs');
        Storage::disk('public')->assertMissing($originalAudio);
    }

    public function test_admin_cannot_upload_unsupported_audio_format(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['role' => 'admin'])->save();

        $this->actingAs($admin)->from('/admin/songs/create')->post('/admin/songs', [
            ...$this->songData(),
            'audio_file' => UploadedFile::fake()->create('track.txt', 10, 'text/plain'),
        ])->assertSessionHasErrors('audio_file');
    }

    public function test_admin_can_save_timestamped_lyrics_with_a_song(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['role' => 'admin'])->save();

        Storage::fake('public');
        $this->actingAs($admin)->post('/admin/songs', [
            ...$this->songData(),
            'audio_file' => UploadedFile::fake()->create('song.mp3', 10, 'audio/mpeg'),
            'lyrics' => "[00:12]Một dòng lời\n[01:05.50]Dòng kế tiếp",
        ])->assertRedirect('/admin/songs');

        $song = Song::query()->firstOrFail();
        $this->assertSame([
            ['time' => 12, 'text' => 'Một dòng lời'],
            ['time' => 65.5, 'text' => 'Dòng kế tiếp'],
        ], $song->lyrics);
        $this->assertSame("[00:12.00]Một dòng lời\n[01:05.50]Dòng kế tiếp", $song->lyricsForEditor());
    }

    public function test_admin_cannot_save_malformed_or_unsorted_timestamped_lyrics(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['role' => 'admin'])->save();

        Storage::fake('public');
        $this->actingAs($admin)->from('/admin/songs/create')->post('/admin/songs', [
            ...$this->songData(),
            'audio_file' => UploadedFile::fake()->create('song.mp3', 10, 'audio/mpeg'),
            'lyrics' => "[00:12]Dòng đầu\nDòng thiếu mốc thời gian",
        ])->assertSessionHasErrors('lyrics');

        $this->actingAs($admin)->from('/admin/songs/create')->post('/admin/songs', [
            ...$this->songData(),
            'audio_file' => UploadedFile::fake()->create('song.mp3', 10, 'audio/mpeg'),
            'lyrics' => "[00:20]Dòng đầu\n[00:12]Dòng đến sớm hơn",
        ])->assertSessionHasErrors('lyrics');

        $this->assertDatabaseCount('songs', 0);
    }

    public function test_saved_lyrics_are_available_to_the_music_player(): void
    {
        Song::query()->create([
            ...$this->songData(),
            'lyrics' => [
                ['time' => 12, 'text' => 'Dòng lời kiểm thử'],
            ],
        ]);

        $this->get('/')->assertOk()->assertSee('Dòng lời kiểm thử');
    }

    public function test_database_seeder_adds_the_requested_youtube_demo_song_idempotently(): void
    {
        $this->seed();
        $this->seed();

        $this->assertDatabaseCount('songs', 1);
        $this->assertDatabaseHas('songs', [
            'title' => 'Bông Hoa Đẹp Nhất',
            'artist' => 'Quân A.P',
            'audio_url' => 'https://www.youtube.com/watch?v=rzVP8ix-H9Y',
        ]);
    }

    public function test_a_user_can_toggle_their_own_song_favorites(): void
    {
        $user = User::factory()->create();
        $song = Song::query()->create($this->songData());

        $this->actingAs($user)->postJson("/songs/{$song->id}/favorite")
            ->assertOk()
            ->assertJson(['favorite' => true]);
        $this->assertDatabaseHas('favorites', ['user_id' => $user->id, 'song_id' => $song->id]);

        $this->actingAs($user)->postJson("/songs/{$song->id}/favorite")
            ->assertOk()
            ->assertJson(['favorite' => false]);
        $this->assertDatabaseMissing('favorites', ['user_id' => $user->id, 'song_id' => $song->id]);
    }

    public function test_favorites_require_authentication(): void
    {
        $song = Song::query()->create($this->songData());

        $this->post("/songs/{$song->id}/favorite")->assertRedirect('/login');
    }

    /**
     * @return array{title: string, artist: string, audio_url: string, cover_url: string, mood: string}
     */
    private function songData(): array
    {
        return [
            'title' => 'Demo Track',
            'artist' => 'Demo Artist',
            'audio_url' => 'https://example.com/song.mp3',
            'cover_url' => 'https://example.com/cover.jpg',
            'mood' => 'Chill',
        ];
    }

    private function songUploadData(array $overrides = []): array
    {
        return [
            ...$this->songData(),
            'audio_file' => UploadedFile::fake()->create('song.mp3', 10, 'audio/mpeg'),
            ...$overrides,
        ];
    }
}
