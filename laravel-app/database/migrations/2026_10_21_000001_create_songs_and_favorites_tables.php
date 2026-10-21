<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('songs', function (Blueprint $table): void {
            $table->id();
            $table->string('title', 100);
            $table->string('artist', 100);
            $table->text('audio_url');
            $table->text('cover_url')->nullable();
            $table->string('mood', 30)->default('Chill');
            $table->timestamps();
        });

        Schema::create('favorites', function (Blueprint $table): void {
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('song_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->primary(['user_id', 'song_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('favorites');
        Schema::dropIfExists('songs');
    }
};
