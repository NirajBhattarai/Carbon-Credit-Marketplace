# IoT Carbon Credit API - Setup Scripts (Drizzle ORM)

## Quick Start with Docker

### 1. Start the Database Services

```bash
# Start PostgreSQL and Redis with Docker Compose
docker-compose up -d

# Check if services are running
docker-compose ps
```

### 2. Set up Environment Variables

```bash
# Copy environment template
cp frontend/env.example frontend/.env.local

# Edit the environment file with your configuration
nano frontend/.env.local
```

### 3. Install Dependencies and Setup Database

```bash
# Install frontend dependencies
cd frontend
npm install

# Generate Drizzle migrations
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Seed the database with sample data
npm run db:seed
```

### 4. Start the Development Server

```bash
# Start Next.js development server
npm run dev
```

## API Endpoints

Once running, your IoT API will be available at:

- **Base URL**: `http://localhost:3000/api/iot`
- **Health Check**: `GET /api/iot/health`
- **Register Device**: `POST /api/iot/devices`
- **Send Data**: `POST /api/iot/data`
- **Get Devices**: `GET /api/iot/devices`
- **Device Status**: `GET /api/iot/devices/[deviceId]`
- **Update Thresholds**: `PUT /api/iot/devices/[deviceId]/thresholds`
- **Reset Data**: `PUT /api/iot/devices/[deviceId]/reset`

## Database Management

### Accessing the Database

**Via pgAdmin (Web UI)**:

- URL: http://localhost:8080
- Email: admin@carboncredit.com
- Password: admin123

**Via Command Line**:

```bash
# Connect to PostgreSQL
docker exec -it carbon-credit-postgres psql -U postgres -d carbon_credit_iot

# Or use psql from your local machine
psql -h localhost -p 5432 -U postgres -d carbon_credit_iot
```

### Database Operations

```bash
# Generate new migration files
npm run db:generate

# Push schema changes to database
npm run db:push

# View database in Drizzle Studio
npm run db:studio

# Seed database with sample data
npm run db:seed
```

## Testing the API

### 1. Register a Test Device

```bash
curl -X POST http://localhost:3000/api/iot/devices \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "TEST_CREATOR_001",
    "deviceType": "CREATOR",
    "location": "Test Solar Farm",
    "projectName": "Test Renewable Energy Project",
    "description": "Test device for development"
  }'
```

### 2. Send Test Data

```bash
curl -X POST http://localhost:3000/api/iot/data \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "TEST_CREATOR_001",
    "timestamp": 1640995200000,
    "co2Value": 1200,
    "energyValue": 600,
    "temperature": 25.5,
    "humidity": 60.0,
    "deviceType": "CREATOR",
    "location": "Test Solar Farm",
    "projectName": "Test Renewable Energy Project"
  }'
```

### 3. Check Device Status

```bash
curl http://localhost:3000/api/iot/devices/TEST_CREATOR_001
```

## IoT Device Configuration

Update your Arduino code with the correct API endpoint:

```cpp
// In your Arduino code, update these values:
const char* apiBaseUrl = "http://your-computer-ip:3000/api/iot";
const char* deviceId = "YOUR_DEVICE_ID";
const char* deviceType = "CREATOR"; // or "BURNER"
```

## Drizzle ORM Benefits

### Why Drizzle over Prisma?

1. **Performance**: Drizzle is faster and has lower overhead
2. **Type Safety**: Full TypeScript support with better type inference
3. **SQL-like**: More familiar syntax for developers coming from SQL
4. **Bundle Size**: Smaller bundle size for production builds
5. **Flexibility**: More control over queries and migrations

### Key Drizzle Features Used

- **Schema Definition**: Type-safe database schema with TypeScript
- **Query Builder**: Intuitive query building with full type safety
- **Migrations**: Automatic migration generation and management
- **Relations**: Type-safe relations between tables
- **Studio**: Built-in database browser and query tool

## Troubleshooting

### Common Issues

1. **Database Connection Failed**

   ```bash
   # Check if PostgreSQL is running
   docker-compose ps

   # Check logs
   docker-compose logs postgres
   ```

2. **Port Already in Use**

   ```bash
   # Change ports in docker-compose.yml
   # Or stop conflicting services
   sudo lsof -i :5432
   ```

3. **Drizzle Client Not Generated**

   ```bash
   # Regenerate Drizzle client
   npm run db:generate
   ```

4. **API Not Responding**

   ```bash
   # Check if Next.js is running
   curl http://localhost:3000/api/iot/health

   # Check logs
   npm run dev
   ```

### Logs and Monitoring

```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Monitor database performance
docker exec -it carbon-credit-postgres psql -U postgres -d carbon_credit_iot -c "SELECT * FROM pg_stat_activity;"
```

## Production Deployment

For production deployment, consider:

1. **Environment Variables**: Use proper secrets management
2. **Database**: Use managed PostgreSQL service
3. **Security**: Enable SSL/TLS, use proper authentication
4. **Monitoring**: Add logging and metrics collection
5. **Scaling**: Use load balancers and multiple instances

## Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify environment variables
3. Ensure all services are running
4. Check network connectivity
5. Review the API documentation

For additional help, refer to the main documentation or create an issue in the repository.
