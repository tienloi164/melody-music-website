@extends('layouts.auth')

@section('title', 'Tạo tài khoản')

@section('content')
    <div class="eyebrow">BẮT ĐẦU HÀNH TRÌNH ÂM NHẠC</div>
    <h1>Tạo tài khoản</h1>
    <p class="auth-description">Tham gia Melody để quản lý hồ sơ và tận hưởng không gian âm nhạc của bạn.</p>

    <form method="POST" action="{{ route('register') }}" class="auth-form">
        @csrf
        <label for="name">Họ và tên</label>
        <input id="name" name="name" type="text" value="{{ old('name') }}" autocomplete="name" required maxlength="255" autofocus>
        @error('name') <p class="field-error">{{ $message }}</p> @enderror

        <label for="email">Địa chỉ email</label>
        <input id="email" name="email" type="email" value="{{ old('email') }}" autocomplete="email" required maxlength="255">
        @error('email') <p class="field-error">{{ $message }}</p> @enderror

        <label for="password">Mật khẩu <span>(ít nhất 8 ký tự)</span></label>
        <input id="password" name="password" type="password" autocomplete="new-password" required minlength="8">
        @error('password') <p class="field-error">{{ $message }}</p> @enderror

        <label for="password_confirmation">Xác nhận mật khẩu</label>
        <input id="password_confirmation" name="password_confirmation" type="password" autocomplete="new-password" required minlength="8">

        <button class="primary-button auth-submit" type="submit">Tạo tài khoản <span>→</span></button>
    </form>

    <p class="auth-switch">Đã có tài khoản? <a href="{{ route('login') }}">Đăng nhập</a></p>
@endsection
