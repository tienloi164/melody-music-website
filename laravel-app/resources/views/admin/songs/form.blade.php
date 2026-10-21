@extends('layouts.auth')

@section('title', $isEditing ? 'Chỉnh sửa bài hát' : 'Thêm bài hát')

@section('content')
    <div class="eyebrow">KHU VỰC QUẢN TRỊ</div>
    <h1>{{ $isEditing ? 'Chỉnh sửa bài hát' : 'Thêm bài hát' }}</h1>
    <p class="auth-description">Bài hát sẽ được lưu vào thư viện chung để mọi người có thể nghe.</p>

    <form method="POST" action="{{ $isEditing ? route('admin.songs.update', $song) : route('admin.songs.store') }}" class="auth-form" enctype="multipart/form-data">
        @csrf
        @if ($isEditing)
            @method('PUT')
        @endif

        <label for="title">Tên bài hát</label>
        <input id="title" name="title" type="text" value="{{ old('title', $song->title) }}" required maxlength="100">
        @error('title') <p class="field-error">{{ $message }}</p> @enderror

        <label for="artist">Nghệ sĩ</label>
        <input id="artist" name="artist" type="text" value="{{ old('artist', $song->artist) }}" required maxlength="100">
        @error('artist') <p class="field-error">{{ $message }}</p> @enderror

        <label for="audio_file">Tệp nhạc (MP3, WAV, OGG, M4A hoặc AAC) <span>*</span></label>
        <input id="audio_file" name="audio_file" type="file" accept=".mp3,.wav,.ogg,.m4a,.aac,audio/*" @required(!$isEditing)>
        @error('audio_file') <p class="field-error">{{ $message }}</p> @enderror
        <p class="input-hint">Tệp tối đa 50 MB. @if ($isEditing) Nếu không chọn tệp mới, bài nhạc hiện tại sẽ được giữ nguyên. @endif</p>

        <label for="cover_file">Ảnh bìa (không bắt buộc)</label>
        <input id="cover_file" name="cover_file" type="file" accept=".jpg,.jpeg,.png,.webp,image/*">
        @error('cover_file') <p class="field-error">{{ $message }}</p> @enderror
        <p class="input-hint">Chọn ảnh JPG, PNG hoặc WEBP, tối đa 5 MB. @if ($isEditing && $song->coverSource()) Ảnh hiện tại được giữ nguyên nếu bạn không chọn ảnh mới. @endif</p>
        @if ($isEditing && $song->coverSource())
            <img src="{{ $song->coverSource() }}" alt="Ảnh bìa hiện tại" style="width: 96px; height: 96px; object-fit: cover; border-radius: 12px;">
        @endif

        <label for="lyrics">Lời bài hát đồng bộ (không bắt buộc)</label>
        <textarea id="lyrics" name="lyrics" rows="8" maxlength="20000" placeholder="[00:12]Dòng lời đầu tiên&#10;[00:18]Dòng lời tiếp theo">{{ old('lyrics', $song->lyricsForEditor()) }}</textarea>
        <p class="input-hint">Mỗi dòng ghi một mốc thời gian theo dạng [phút:giây]Lời bài hát, ví dụ [01:05]Một câu hát. Lời sẽ sáng lên khi bài nhạc chạy đến thời điểm đó. Chỉ nhập lời bạn có quyền sử dụng.</p>
        @error('lyrics') <p class="field-error">{{ $message }}</p> @enderror

        <label for="mood">Tâm trạng</label>
        <select id="mood" name="mood" required>
            @foreach (['Chill', 'Tập trung', 'Năng lượng', 'Đêm'] as $mood)
                <option value="{{ $mood }}" @selected(old('mood', $song->mood ?: 'Chill') === $mood)>{{ $mood }}</option>
            @endforeach
        </select>
        @error('mood') <p class="field-error">{{ $message }}</p> @enderror

        <button class="primary-button auth-submit" type="submit">{{ $isEditing ? 'Lưu thay đổi' : 'Thêm vào thư viện' }}</button>
    </form>

    <p class="auth-switch"><a href="{{ route('admin.songs.index') }}">← Quay lại danh sách bài hát</a></p>
@endsection
