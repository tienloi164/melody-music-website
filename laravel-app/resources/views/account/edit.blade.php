@extends('layouts.auth')

@section('title', 'Quản lý tài khoản')

@section('content')
    <div class="eyebrow">HỒ SƠ CỦA BẠN</div>
    <h1>Quản lý tài khoản</h1>
    <p class="auth-description">Cập nhật thông tin cá nhân hoặc thay đổi mật khẩu.</p>

    @if (session('status'))
        <div class="auth-status" role="status">{{ session('status') }}</div>
    @endif

    <form method="POST" action="{{ route('account.update') }}" class="auth-form">
        @csrf
        @method('PUT')
        <label for="name">Họ và tên</label>
        <input id="name" name="name" type="text" value="{{ old('name', $user->name) }}" autocomplete="name" required maxlength="255">
        @error('name') <p class="field-error">{{ $message }}</p> @enderror

        <label for="email">Địa chỉ email</label>
        <input id="email" name="email" type="email" value="{{ old('email', $user->email) }}" autocomplete="email" required maxlength="255">
        @error('email') <p class="field-error">{{ $message }}</p> @enderror

        <div class="form-divider"><span>Đổi mật khẩu (không bắt buộc)</span></div>
        <label for="current_password">Mật khẩu hiện tại <span>(bắt buộc khi đổi mật khẩu)</span></label>
        <input id="current_password" name="current_password" type="password" autocomplete="current-password">
        @error('current_password') <p class="field-error">{{ $message }}</p> @enderror

        <label for="password">Mật khẩu mới</label>
        <input id="password" name="password" type="password" autocomplete="new-password" minlength="8">
        @error('password') <p class="field-error">{{ $message }}</p> @enderror

        <label for="password_confirmation">Xác nhận mật khẩu mới</label>
        <input id="password_confirmation" name="password_confirmation" type="password" autocomplete="new-password" minlength="8">

        <button class="primary-button auth-submit" type="submit">Lưu thay đổi <span>→</span></button>
    </form>

    <form method="POST" action="{{ route('logout') }}" class="logout-form">
        @csrf
        <button class="outline-button" type="submit">Đăng xuất</button>
    </form>

    <details class="danger-zone">
        <summary>Xóa tài khoản</summary>
        <p>Thao tác này không thể hoàn tác. Nhập mật khẩu hiện tại để xác nhận xóa tài khoản.</p>
        <form method="POST" action="{{ route('account.destroy') }}" class="auth-form" onsubmit="return confirm('Bạn có chắc chắn muốn xóa tài khoản? Thao tác này không thể hoàn tác.');">
            @csrf
            @method('DELETE')
            <label for="delete-password">Mật khẩu hiện tại để xác nhận xóa</label>
            <input id="delete-password" name="password" type="password" autocomplete="current-password" required>
            @error('password') <p class="field-error">{{ $message }}</p> @enderror
            <button class="delete-account-button" type="submit">Xóa tài khoản vĩnh viễn</button>
        </form>
    </details>
@endsection
