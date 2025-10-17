# Drizzle ORM Database Setup Guide

This guide explains how to set up and manage the database for the Carbon Credit Marketplace using Drizzle ORM.

## Prerequisites

- PostgreSQL database running locally or remotely
- Node.js and npm installed
- Environment variables configured

## Environment Setup

1. Copy the environment example file:

```bash
cp .env.example .env
```

2. Update the `.env` file with your database credentials:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/carbon_credit_iot"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
```

## Database Schema

The database includes the following tables:

### Core Tables

- **users** - User accounts with wallet addresses and roles
- **applications** - Developer applications for API access
- **apiKeys** - API keys for application authentication
- **iotDevices** - IoT devices registered by applications
- **deviceData** - Data collected from IoT devices
- **carbonCreditTransactions** - Carbon credit minting/burning transactions

### Enums

- **user_role** - USER, DEVELOPER, ADMIN
- **application_status** - ACTIVE, INACTIVE, SUSPENDED
- **api_key_status** - ACTIVE, INACTIVE, REVOKED
- **device_type** - CREATOR, BURNER
- **transaction_type** - MINT, BURN
- **transaction_status** - PENDING, CONFIRMED, FAILED

## Available Commands

### Generate Migration Files

```bash
npm run db:generate
```

This creates migration files based on schema changes in `lib/db/schema.ts`.

### Push Schema to Database

```bash
npm run db:push
```

This pushes the schema directly to the database without creating migration files.

### Run Migrations

```bash
npm run db:migrate
```

This runs pending migrations against the database.

### Open Drizzle Studio

```bash
npm run db:studio
```

This opens a web interface to view and manage your database.

### Seed Database

```bash
npm run db:seed
```

This populates the database with sample data.

## Database Setup Steps

### 1. Initial Setup

```bash
# Install dependencies
npm install

# Generate initial migration
npm run db:generate

# Push schema to database
npm run db:push
```

### 2. Seed Sample Data

```bash
npm run db:seed
```

### 3. Verify Setup

```bash
# Open Drizzle Studio to verify tables
npm run db:studio
```

## Schema Changes

When you modify the schema in `lib/db/schema.ts`:

1. **Generate migration**:

   ```bash
   npm run db:generate
   ```

2. **Review the generated migration** in the `drizzle/` directory

3. **Apply the migration**:
   ```bash
   npm run db:migrate
   ```

## Troubleshooting

### Common Issues

1. **"relation does not exist" error**:
   - Run `npm run db:push` to create tables
   - Or run `npm run db:migrate` if migrations exist

2. **Connection refused**:
   - Check PostgreSQL is running
   - Verify DATABASE_URL in `.env`

3. **Permission denied**:
   - Ensure database user has proper permissions
   - Check database exists

### Reset Database

```bash
# Drop and recreate database
dropdb carbon_credit_iot
createdb carbon_credit_iot

# Push schema
npm run db:push

# Seed data
npm run db:seed
```

## Production Considerations

1. **Use migrations in production** instead of `db:push`
2. **Set strong JWT_SECRET** in production
3. **Use connection pooling** for high-traffic applications
4. **Backup database** regularly
5. **Monitor database performance**

## API Integration

The database is integrated with the following API endpoints:

- `/api/auth/login` - User authentication
- `/api/auth/me` - User profile
- `/api/developer/applications` - Application management
- `/api/developer/applications/[id]/api-keys` - API key management
- `/api/iot/devices` - IoT device management
- `/api/nft/mint` - NFT minting

## Support

For issues related to:

- **Drizzle ORM**: Check [Drizzle Documentation](https://orm.drizzle.team/)
- **PostgreSQL**: Check [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- **This Project**: Check the main README.md file
