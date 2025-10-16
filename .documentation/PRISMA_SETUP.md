# Prisma Setup - Banking Agent ID System

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env` file in the root directory:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/banking_agent_db?schema=public"

# NextAuth.js (if you plan to use it)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

### 2. Database Setup

#### Option A: Local PostgreSQL
1. Install PostgreSQL locally
2. Create a database named `banking_agent_db`
3. Update the `DATABASE_URL` in your `.env` file

#### Option B: Cloud Database (Recommended for Production)
- **Vercel Postgres**: Perfect for Vercel deployments
- **Supabase**: Free tier available
- **Railway**: Simple setup
- **Neon**: Serverless PostgreSQL

### 3. Run Database Migrations

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# Or create and run migrations (for production)
npm run db:migrate
```

### 4. Seed the Database

```bash
npm run db:seed
```

### 5. Open Prisma Studio (Optional)

```bash
npm run db:studio
```

## 📁 Project Structure

```
src/
├── lib/
│   └── prisma.ts          # Prisma client instance
├── app/
│   └── api/
│       └── branches/
│           └── route.ts   # Example API route
prisma/
├── schema.prisma          # Database schema
└── seed.ts               # Database seeding script
```

## 🗄️ Database Schema Overview

### Core Entities

- **User**: System administrators and agents
- **Client**: Banking customers/visitors
- **Branch**: Physical locations (multi-site support)
- **AgentModule**: Service counters within branches
- **Camera**: Surveillance devices
- **FacialProfile**: Face recognition data
- **DetectionEvent**: Face detection events
- **Visit**: Customer visits and service sessions

### Chatbot System

- **FAQ**: Frequently asked questions
- **QAPair**: Question-answer pairs
- **ChatSession**: Chat conversations
- **ChatMessage**: Individual chat messages

### Registration & Security

- **RegistrationRequest**: Client registration approvals
- **PasswordResetToken**: Password reset functionality
- **AuditLog**: System audit trail

## 🔧 Available Scripts

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with initial data

## 🚀 Deployment (Vercel)

1. **Set up Vercel Postgres**:
   - Go to your Vercel dashboard
   - Add a Postgres database
   - Copy the connection string to your environment variables

2. **Configure Environment Variables**:
   ```bash
   DATABASE_URL="postgresql://..."
   NEXTAUTH_SECRET="your-production-secret"
   ```

3. **Run Migrations**:
   ```bash
   npx prisma migrate deploy
   ```

4. **Deploy**:
   ```bash
   vercel --prod
   ```

## 🔐 Authentication Notes

The schema is prepared for:
- **Admin/Agent Authentication**: Using NextAuth.js with the `User` model
- **Client Authentication**: Simple password-based auth with `Client.hashedPassword`
- **Registration Flow**: Approval-based registration with `RegistrationRequest`

## 📊 Face Recognition Integration

The schema supports multiple face recognition providers:
- Azure Face API
- AWS Rekognition
- OpenCV
- Custom solutions

Store embeddings in `FacialProfile.embedding` as JSON and provider IDs in `providerFaceId`.

## 🤖 Chatbot Integration

Ready for:
- FAQ-based responses
- Intent classification
- Multi-actor conversations (Client/Bot/Agent)
- Session management
- Analytics and reporting

## 📝 Next Steps

1. Set up your database connection
2. Run the seed script to populate initial data
3. Start building your API routes using the Prisma client
4. Implement authentication with NextAuth.js
5. Integrate face recognition services
6. Build the chatbot functionality

## 🆘 Troubleshooting

### Common Issues

1. **Connection Error**: Check your `DATABASE_URL` format
2. **Migration Errors**: Ensure your database is empty or use `db:push` for development
3. **Type Errors**: Run `npm run db:generate` after schema changes

### Getting Help

- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Postgres Guide](https://vercel.com/docs/storage/vercel-postgres)
