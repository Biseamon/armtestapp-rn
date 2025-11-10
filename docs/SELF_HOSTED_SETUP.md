# Self-Hosted Supabase Setup Guide

This guide will help you configure the Arm Wrestling Training App to work with your self-hosted Supabase instance on your dedicated server.

## Overview

The app consists of two main components:
1. **Frontend** - React Native Expo app (mobile/web)
2. **Backend** - .NET 8 Web API (optional alternative to Supabase services)

Both can connect to your self-hosted Supabase instance.

## Prerequisites

- Self-hosted Supabase instance running on your server
- PostgreSQL database accessible from Supabase
- Node.js and npm (for frontend)
- .NET 8 SDK (for backend, optional)
- Docker and Docker Compose (for backend deployment)

## Part 1: Configure Self-Hosted Supabase

### 1. Install Supabase on Your Server

Follow the official Supabase self-hosting guide:
https://supabase.com/docs/guides/self-hosting

### 2. Get Your Supabase Credentials

After installation, you'll need:
- **Supabase URL**: Usually `https://your-server.com:8000` (or your custom port)
- **Anon Key**: Public API key (from Supabase dashboard)
- **Service Role Key**: Admin API key (from Supabase dashboard)
- **c Connection String**: Database connection details

### 3. Run Database Migrations

The database schema is located in `supabase/migrations/`. Apply these to your Supabase PostgreSQL:

```bash
# Connect to your Supabase PostgreSQL
psql "postgresql://postgres:password@your-server.com:5432/postgres"

# Run each migration file in order
\i supabase/migrations/20251009164447_create_armwrestling_schema.sql
\i supabase/migrations/20251009165714_add_profile_insert_policy.sql
\i supabase/migrations/20251009171558_add_training_cycles.sql
\i supabase/migrations/20251010175234_add_cycle_workout_tracking.sql
\i supabase/migrations/20251010181613_add_weight_unit_preference.sql
\i supabase/migrations/20251013181707_add_profile_picture_and_scheduled_trainings.sql
\i supabase/migrations/20251013184943_change_strength_test_result_to_numeric.sql
\i supabase/migrations/20251014170103_add_notification_id_to_scheduled_trainings.sql
\i supabase/migrations/20251014170242_create_body_measurements_table.sql
```

Or use the Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

## Part 2: Configure Frontend

### 1. Create Environment File

Copy the example environment file:

```bash
cp .env.example .env
```

### 2. Update Frontend Configuration

Edit `.env` with your self-hosted Supabase details:

```env
# Self-Hosted Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-server.com:8000
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Important Notes:**
- Replace `your-server.com:8000` with your actual Supabase URL
- Get the anon key from your Supabase dashboard
- For cloud Supabase, use `https://your-project.supabase.co`

### 3. Install Dependencies and Run

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will now connect to your self-hosted Supabase instance!

## Part 3: Configure .NET Backend (Optional)

The .NET backend is an optional alternative to using Supabase services directly. You can use it for:
- Custom business logic
- Additional API endpoints
- Integration with other systems

### 1. Navigate to Backend Directory

```bash
cd backend-dotnet
```

### 2. Create Configuration File

```bash
cp appsettings.example.json appsettings.json
```

### 3. Update Backend Configuration

Edit `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=your-server.com;Port=5432;Database=postgres;Username=postgres;Password=your_password;SSL Mode=Require;Trust Server Certificate=true"
  },
  "Supabase": {
    "Url": "https://your-server.com:8000",
    "AnonKey": "your_supabase_anon_key_here",
    "ServiceRoleKey": "your_supabase_service_role_key_here"
  },
  "Jwt": {
    "Key": "your-super-secret-jwt-key-at-least-32-characters-long",
    "Issuer": "ArmWrestlingApi",
    "Audience": "ArmWrestlingApp",
    "ExpiresInDays": 30
  },
  "Kestrel": {
    "Endpoints": {
      "Http": {
        "Url": "http://0.0.0.0:5000"
      }
    }
  }
}
```

### 4. Run Backend Locally

```bash
# Restore packages
dotnet restore

# Run the API
dotnet run
```

Access Swagger UI at: `http://localhost:5000`

### 5. Deploy Backend with Docker

#### Option A: Docker CLI

```bash
# Build image
docker build -t armwrestling-api .

# Run container
docker run -d \
  -p 5000:5000 \
  -e ConnectionStrings__DefaultConnection="Host=your-server.com;Port=5432;Database=postgres;Username=postgres;Password=your_password" \
  -e Supabase__Url="https://your-server.com:8000" \
  -e Supabase__AnonKey="your_anon_key" \
  -e Supabase__ServiceRoleKey="your_service_role_key" \
  -e Jwt__Key="your_jwt_secret_key" \
  --name armwrestling-api \
  armwrestling-api
```

#### Option B: Docker Compose

```bash
# Create .env file
cp .env.example .env
# Edit .env with your values

# Start container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop container
docker-compose down
```

## Part 4: Verify Configuration

### Frontend Verification

1. Start the app: `npm run dev`
2. Register a new account
3. Try logging in
4. Create a workout to test database connectivity

### Backend Verification (if using)

1. Access Swagger UI: `http://localhost:5000`
2. Test the `/api/auth/register` endpoint
3. Test the `/api/auth/login` endpoint
4. Verify JWT token is returned

## Troubleshooting

### Frontend Connection Issues

**Problem**: Cannot connect to Supabase

**Solutions**:
- Verify `EXPO_PUBLIC_SUPABASE_URL` is correct
- Check if Supabase is accessible from your network
- Verify API keys are correct
- Check CORS settings in Supabase

### Backend Connection Issues

**Problem**: Cannot connect to PostgreSQL

**Solutions**:
- Verify connection string is correct
- Check if PostgreSQL port (5432) is accessible
- Ensure SSL settings match your server configuration
- Check firewall rules

**Problem**: JWT Authentication Failing

**Solutions**:
- Ensure JWT Key is at least 32 characters
- Verify Issuer and Audience match in both configuration and code
- Check token expiration settings

### Docker Issues

**Problem**: Container won't start

**Solutions**:
- Check logs: `docker-compose logs -f`
- Verify environment variables in `.env`
- Ensure ports 5000 is not already in use
- Check Docker has sufficient resources

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use strong JWT secrets** (minimum 256 bits)
3. **Enable SSL/TLS** for PostgreSQL connections in production
4. **Restrict database access** to specific IP addresses
5. **Use environment variables** for all sensitive data
6. **Regular backups** of PostgreSQL database
7. **Keep Supabase updated** to latest version
8. **Monitor logs** for suspicious activity

## Network Configuration

### Opening Ports

Ensure these ports are accessible:

**Supabase:**
- 8000 - API Gateway
- 5432 - PostgreSQL (restrict to internal network)

**.NET Backend:**
- 5000 - HTTP API

**Frontend Development:**
- 8081 - Expo development server (local only)

### Firewall Rules

Example UFW rules:

```bash
# Allow Supabase API
sudo ufw allow 8000/tcp

# Allow .NET API
sudo ufw allow 5000/tcp

# Restrict PostgreSQL (replace with your IP)
sudo ufw allow from YOUR_IP to any port 5432
```

## Production Checklist

Before deploying to production:

- [ ] All environment variables configured correctly
- [ ] SSL/TLS certificates installed
- [ ] Database migrations applied
- [ ] Row Level Security (RLS) policies enabled
- [ ] CORS configured for production domains
- [ ] Backup strategy in place
- [ ] Monitoring and logging configured
- [ ] Firewall rules configured
- [ ] Strong passwords and JWT secrets
- [ ] Test user authentication flow
- [ ] Test database connectivity
- [ ] Verify API endpoints work correctly

## Support

For issues with:
- **Supabase**: Visit https://supabase.com/docs
- **App-specific issues**: Check the main README.md
- **.NET Backend**: See backend-dotnet/README.md

## Additional Resources

- [Supabase Self-Hosting Guide](https://supabase.com/docs/guides/self-hosting)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [.NET Docker Documentation](https://learn.microsoft.com/en-us/dotnet/core/docker/)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
