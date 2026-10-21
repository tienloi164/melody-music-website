<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class MakeUserAdmin extends Command
{
    protected $signature = 'melody:make-admin {email : Email tài khoản đã đăng ký}';

    protected $description = 'Cấp quyền quản trị bài hát cho tài khoản';

    public function handle(): int
    {
        $user = User::query()->where('email', $this->argument('email'))->first();

        if (! $user) {
            $this->components->error('Không tìm thấy tài khoản. Hãy đăng ký tài khoản trước.');

            return self::FAILURE;
        }

        if ($user->isAdmin()) {
            $this->components->info('Tài khoản này đã là admin.');

            return self::SUCCESS;
        }

        if (! $this->confirm("Cấp quyền admin cho {$user->email}?")) {
            $this->components->info('Đã hủy, không thay đổi quyền.');

            return self::SUCCESS;
        }

        $user->forceFill(['role' => 'admin'])->save();
        $this->components->info("Đã cấp quyền admin cho {$user->email}.");

        return self::SUCCESS;
    }
}
