<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AccountAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_visitor_can_register_and_is_logged_in(): void
    {
        $response = $this->post('/register', [
            'name' => 'Nguyen An',
            'email' => 'an@example.com',
            'password' => 'melody-password',
            'password_confirmation' => 'melody-password',
        ]);

        $user = User::where('email', 'an@example.com')->firstOrFail();

        $response->assertRedirect('/');
        $this->assertAuthenticatedAs($user);
        $this->assertTrue(Hash::check('melody-password', $user->password));
    }

    public function test_registration_rejects_duplicate_email_and_mismatched_password(): void
    {
        User::factory()->create(['email' => 'an@example.com']);

        $this->from('/register')->post('/register', [
            'name' => 'Nguyen An',
            'email' => 'an@example.com',
            'password' => 'melody-password',
            'password_confirmation' => 'different-password',
        ])->assertSessionHasErrors(['email', 'password']);
    }

    public function test_a_user_can_log_in_and_log_out(): void
    {
        $user = User::factory()->create(['password' => Hash::make('melody-password')]);

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'melody-password',
        ])->assertRedirect('/');

        $this->assertAuthenticatedAs($user);

        $this->post('/logout')->assertRedirect('/');
        $this->assertGuest();
    }

    public function test_invalid_credentials_are_rejected(): void
    {
        User::factory()->create(['email' => 'an@example.com']);

        $this->from('/login')->post('/login', [
            'email' => 'an@example.com',
            'password' => 'not-the-password',
        ])->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_an_authenticated_user_can_update_their_profile_and_password(): void
    {
        $user = User::factory()->create([
            'name' => 'Nguyen An',
            'email' => 'an@example.com',
            'password' => Hash::make('old-password'),
        ]);

        $this->actingAs($user)->put('/account', [
            'name' => 'An Nguyen',
            'email' => 'an.nguyen@example.com',
            'current_password' => 'old-password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])->assertSessionHasNoErrors();

        $user->refresh();
        $this->assertSame('An Nguyen', $user->name);
        $this->assertSame('an.nguyen@example.com', $user->email);
        $this->assertTrue(Hash::check('new-password', $user->password));
    }

    public function test_a_user_must_confirm_their_current_password_to_change_it(): void
    {
        $user = User::factory()->create(['password' => Hash::make('old-password')]);

        $this->actingAs($user)->put('/account', [
            'name' => $user->name,
            'email' => $user->email,
            'current_password' => 'incorrect-password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])->assertSessionHasErrors('current_password');

        $this->assertTrue(Hash::check('old-password', $user->fresh()->password));
    }

    public function test_a_user_can_delete_only_their_own_account_after_password_confirmation(): void
    {
        $user = User::factory()->create(['password' => Hash::make('old-password')]);
        $otherUser = User::factory()->create();

        $this->actingAs($user)->delete('/account', [
            'password' => 'old-password',
        ])->assertRedirect('/');

        $this->assertGuest();
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        $this->assertDatabaseHas('users', ['id' => $otherUser->id]);
    }

    public function test_guests_cannot_access_account_management(): void
    {
        $this->get('/account')->assertRedirect('/login');
    }
}
