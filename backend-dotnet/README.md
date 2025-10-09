# .NET Backend for Arm Wrestling Training App

This is a .NET 8 Web API equivalent of the Supabase backend used in the Arm Wrestling Training mobile app.

## Architecture

This backend provides:
- RESTful API endpoints for all app functionality
- JWT-based authentication
- PostgreSQL database with Entity Framework Core
- Role-based authorization (Premium vs Free users)

## Prerequisites

- .NET 8 SDK
- PostgreSQL 14+
- Visual Studio 2022 or VS Code with C# extension

## Project Structure

```
backend-dotnet/
├── ArmWrestlingApi/
│   ├── Controllers/          # API endpoints
│   ├── Models/              # Entity models
│   ├── DTOs/                # Data transfer objects
│   ├── Data/                # DbContext and migrations
│   ├── Services/            # Business logic
│   ├── Middleware/          # Custom middleware
│   └── Program.cs           # App entry point
├── ArmWrestlingApi.sln      # Solution file
└── README.md
```

## Database Schema

The database mirrors the Supabase schema:

- **users** - User profiles with authentication
- **workouts** - Training session records
- **exercises** - Exercise details within workouts
- **cycles** - Training cycle periods
- **strength_tests** - Strength assessment records
- **goals** - User training goals

## Setup Instructions

### 1. Create the Project

```bash
cd backend-dotnet

# Create the solution and project
dotnet new webapi -n ArmWrestlingApi
dotnet new sln -n ArmWrestlingApi
dotnet sln add ArmWrestlingApi/ArmWrestlingApi.csproj

# Add required packages
cd ArmWrestlingApi
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package BCrypt.Net-Next
dotnet add package Swashbuckle.AspNetCore
```

### 2. Configure Database Connection

Update `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=armwrestling;Username=postgres;Password=yourpassword"
  },
  "Jwt": {
    "Key": "your-secret-key-min-32-characters-long",
    "Issuer": "ArmWrestlingApi",
    "Audience": "ArmWrestlingApp",
    "ExpiresInDays": 30
  }
}
```

### 3. Run Migrations

```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### 4. Run the API

```bash
dotnet run
```

The API will be available at `https://localhost:7000` (or the port shown in console).

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Workouts
- `GET /api/workouts` - Get all workouts for current user
- `GET /api/workouts/{id}` - Get specific workout
- `POST /api/workouts` - Create new workout
- `PUT /api/workouts/{id}` - Update workout
- `DELETE /api/workouts/{id}` - Delete workout

### Exercises
- `GET /api/workouts/{workoutId}/exercises` - Get exercises for workout
- `POST /api/workouts/{workoutId}/exercises` - Add exercise to workout
- `PUT /api/exercises/{id}` - Update exercise
- `DELETE /api/exercises/{id}` - Delete exercise

### Cycles
- `GET /api/cycles` - Get all training cycles
- `GET /api/cycles/{id}` - Get specific cycle
- `POST /api/cycles` - Create new cycle
- `PUT /api/cycles/{id}` - Update cycle
- `DELETE /api/cycles/{id}` - Delete cycle
- `POST /api/cycles/{id}/activate` - Set cycle as active

### Strength Tests
- `GET /api/strength-tests` - Get all strength tests
- `POST /api/strength-tests` - Create new test
- `DELETE /api/strength-tests/{id}` - Delete test

### Goals
- `GET /api/goals` - Get all goals
- `POST /api/goals` - Create new goal
- `PUT /api/goals/{id}` - Update goal
- `DELETE /api/goals/{id}` - Delete goal

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Premium Features

Users with `is_premium = true` have access to:
- Unlimited workouts per cycle
- Advanced analytics
- Strength test history
- Custom exercise library

## Testing with Swagger

Navigate to `https://localhost:7000/swagger` to access the interactive API documentation.

## Deployment

### Docker Deployment

1. Create a `Dockerfile` in the project root
2. Build the image: `docker build -t armwrestling-api .`
3. Run the container: `docker run -p 7000:80 armwrestling-api`

### Cloud Deployment Options

- **Azure App Service** - Recommended for .NET apps
- **AWS Elastic Beanstalk** - Good for containerized apps
- **Google Cloud Run** - Serverless option
- **Railway/Render** - Simple deployment platforms

## Differences from Supabase Backend

| Feature | Supabase | .NET Backend |
|---------|----------|--------------|
| Auth | Built-in | Custom JWT implementation |
| Database | PostgreSQL with RLS | PostgreSQL with EF Core |
| API | Auto-generated | Manual controllers |
| Real-time | Built-in subscriptions | SignalR (optional) |
| Storage | Built-in file storage | Custom or cloud storage |
| Edge Functions | Deno runtime | C# methods |

## Migration from Supabase

To migrate the mobile app to use this backend:

1. Update API URLs in the mobile app
2. Replace Supabase auth with JWT token management
3. Update data fetching to use REST endpoints
4. Remove Supabase client library
5. Implement token refresh logic

## Security Considerations

- Use HTTPS in production
- Store JWT secret in environment variables
- Implement rate limiting
- Add CORS configuration for your mobile app
- Use parameterized queries (EF Core handles this)
- Validate all input data
- Implement proper error handling

## License

This backend is part of the Arm Wrestling Training App project.
