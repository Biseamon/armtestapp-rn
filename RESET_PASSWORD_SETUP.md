# Password Reset Setup Guide

This guide explains how to configure password reset functionality in your Supabase project for the Arm Wrestling Pro app.

## Overview

The password reset flow works as follows:

1. User enters their email on the "Forgot Password" screen
2. Supabase sends an email with a magic link containing a token
3. User clicks the link, which opens the app to the "Reset Password" screen
4. User enters and confirms their new password
5. Password is updated in Supabase

## Important Notes

### OAuth Users

**Users who signed up with Google, Facebook, or Apple cannot reset their password** because they don't have a password in your system. They authenticate through their OAuth provider.

- If an OAuth user tries to reset their password, they should be directed to sign in using their social account
- The forgot password screen includes a note about this
- These users should use their OAuth provider's account recovery if they have issues

### Email/Password Users

Only users who registered with email and password can use the password reset feature.

## Supabase Configuration Steps

### 1. Configure Redirect URLs

You need to add the password reset deep link to your Supabase project's allowed redirect URLs. The configuration differs between **Expo development** and **production builds**.

#### For Expo Development (Testing)

When testing in Expo Go or Expo development builds, you need to use the Expo development URL:

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**
4. In the **Site URL** field, add your Expo development URL:
   ```
   exp://192.168.1.XXX:8081
   ```
   Replace `192.168.1.XXX` with your actual local IP address shown in the Expo terminal

5. In the **Redirect URLs** section, add the following URL:
   ```
   exp://192.168.1.XXX:8081/(auth)/reset-password
   ```
   Again, replace `192.168.1.XXX` with your actual local IP address

6. Click **Save**

**Note**: The app automatically detects when running in Expo development mode and uses `AuthSession.makeRedirectUri()` to generate the correct Expo URL. This is handled in `contexts/AuthContext.tsx`.

#### For Production Builds

When building for production (standalone app or app stores):

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**
4. In the **Site URL** field, add:
   ```
   armwrestlingpro://
   ```
5. In the **Redirect URLs** section, add:
   ```
   armwrestlingpro://(auth)/reset-password
   ```
6. Click **Save**

**Important**: You can have **both** the Expo development URL and the production URL in your Redirect URLs list. Supabase allows multiple redirect URLs, so you don't need to remove the Expo one when deploying to production.

### 2. Configure Deep Linking in Your App

The app is already configured to handle the deep link `armwrestlingpro://`, but you need to ensure it's properly set up in your app configuration.

#### For iOS (app.json/app.config.js)

Your `app.json` should already have the scheme configured:

```json
{
  "expo": {
    "scheme": "armwrestlingpro",
    "ios": {
      "bundleIdentifier": "com.yourcompany.armwrestlingpro"
    }
  }
}
```

#### For Android (app.json/app.config.js)

```json
{
  "expo": {
    "scheme": "armwrestlingpro",
    "android": {
      "package": "com.yourcompany.armwrestlingpro"
    }
  }
}
```

### 3. Customize Email Template (Optional)

By default, Supabase sends a password reset email with a link. You can customize this template:

1. In Supabase Dashboard, go to **Authentication** → **Email Templates**
2. Select **Reset Password** template
3. Customize the email content, but keep the `{{ .ConfirmationURL }}` variable
4. The default template should work fine for mobile apps

Example template:
```html
<h2>Reset Password</h2>
<p>Follow this link to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>If you didn't request a password reset, you can safely ignore this email.</p>
```

### 4. Configure SMTP (For Production)

For production apps, you should configure a custom SMTP server:

1. Go to **Settings** → **Auth** in your Supabase project
2. Scroll to **SMTP Settings**
3. Configure your SMTP server details (e.g., SendGrid, Mailgun, AWS SES)

**Important**: Supabase's default email service has strict rate limits (2 emails per hour) and is not suitable for production use.

### 5. Finding Your Expo Development URL

When running `npm start` or `expo start`, your Expo development URL is displayed in the terminal. Look for output like:

```
› Metro waiting on exp://192.168.1.145:8081
```

The URL format is `exp://YOUR_LOCAL_IP:PORT`. You'll need this for the Supabase configuration.

**Tips:**
- Your IP address may change if you reconnect to WiFi or restart your router
- If the IP changes, you'll need to update the Supabase redirect URLs
- For consistent testing, consider using a static IP for your development machine

### 6. Test the Flow

#### Testing in Expo Development

1. Start your Expo development server (`npm start` or `expo start`)
2. Note your Expo URL from the terminal (e.g., `exp://192.168.1.145:8081`)
3. Add this URL to Supabase as described in step 1
4. Navigate to the Login screen in your app
5. Click "Forgot Password?"
6. Enter an email address that was registered with email/password (not OAuth)
7. Check your email for the reset link
8. Click the link - it should open your app to the reset password screen
9. Enter a new password that meets the requirements
10. Verify you can log in with the new password

#### Testing in Production

1. Build and install your production app
2. Ensure `armwrestlingpro://(auth)/reset-password` is in Supabase redirect URLs
3. Follow the same testing steps as above

## Troubleshooting

### Deep Link Not Working

If clicking the email link doesn't open your app:

**For Expo Development:**
- Ensure your device/simulator is on the same network as your development machine
- Verify the IP address in Supabase matches your current Expo URL (check terminal output)
- The Expo URL changes if your IP address changes - update Supabase accordingly
- Try opening the email on the same device where Expo is running
- Close and reopen the Expo app after making Supabase configuration changes

**For Production:**
- **iOS**: Rebuild the app after configuring the scheme in `app.json`
- **Android**: Make sure you've configured the package name correctly
- **Testing**: Use a real device instead of a simulator for better deep link support
- Check that the redirect URL in Supabase exactly matches your app's scheme (`armwrestlingpro://`)

### Email Not Received

- Check spam folder
- Verify the email address is registered in your Supabase project
- Check Supabase Auth logs: **Authentication** → **Logs**
- If using default SMTP, you may have hit rate limits (2 per hour)
- Configure a custom SMTP provider for reliable email delivery

### "Invalid or Expired Reset Link"

- The reset link expires after 1 hour (Supabase default)
- The link can only be used once
- User needs to request a new reset link
- **Important for testing**: Don't wait too long between requesting the reset and clicking the link
- If you're testing multiple times, request a fresh reset email each time

### Password Requirements

The app enforces these password requirements:
- At least 6 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*(),.?":{}|<>_-+=~`[]\\/`)

## Implementation Files

The password reset functionality is implemented in these files:

- `app/(auth)/forgot-password.tsx` - Screen where user requests password reset
- `app/(auth)/reset-password.tsx` - Screen where user sets new password
- `contexts/AuthContext.tsx` - Contains `resetPassword()` and `updatePassword()` functions
- `app/(auth)/login.tsx` - Updated with "Forgot Password?" link

## Security Considerations

1. **Password Strength**: The app enforces strong password requirements
2. **Token Expiry**: Reset tokens expire after 1 hour
3. **Single Use**: Reset links can only be used once
4. **Email Verification**: Users must have access to their registered email
5. **No Password for OAuth**: OAuth users cannot set a password, preventing security risks

## Additional Resources

- [Supabase Auth Password Reset Docs](https://supabase.com/docs/guides/auth/auth-password-reset)
- [Expo Deep Linking Guide](https://docs.expo.dev/guides/linking/)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
