# Quick Start Guide 🚀

Get your app running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your Supabase credentials
# Get them from: https://app.supabase.com/project/_/settings/api
```

Minimum required:
```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

## Step 3: Start Development Server

```bash
npm start
```

## Step 4: Open on Device

- Press `i` for iOS simulator (Mac only)
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## That's It! 🎉

You should now see the login screen.

---

## Next Steps

### Want to set up CI/CD?
📖 See [docs/CI_CD_SETUP.md](docs/CI_CD_SETUP.md)

### Want to secure your secrets?
📖 See [docs/SECRETS_SETUP.md](docs/SECRETS_SETUP.md)

### Want to add premium subscriptions?
📖 See RevenueCat implementation in the conversation history

---

## Common Issues

**"Missing environment variables" error:**
```bash
# Make sure you created .env file
cp .env.example .env
# Then edit it with your actual values
```

**"Module not found" errors:**
```bash
rm -rf node_modules
npm install
```

**App won't start:**
```bash
npx expo start --clear
```

---

## Test Accounts

For testing, create a test user in Supabase:

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user"
3. Use email: `test@example.com`, password: `Test123!@#`
4. Optionally set `is_test_user: true` in profiles table for premium access

---

## Need Help?

- 📖 Full docs in [README.md](README.md)
- 🔒 Security setup in [docs/SECRETS_SETUP.md](docs/SECRETS_SETUP.md)
- 🚀 CI/CD setup in [docs/CI_CD_SETUP.md](docs/CI_CD_SETUP.md)

Happy coding! 💪
