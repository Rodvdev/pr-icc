# 🏦 Banking Agent ID System

A comprehensive Next.js application for managing banking agent operations with facial recognition, client management, and administrative controls.

## 🚀 Quick Start Guide

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** database
- **Git** for version control

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd pr-icc

# Install dependencies
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/banking_agent_db"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3005"
NEXTAUTH_SECRET="your-secret-key-here"

# Optional: Add your own secret key
# Generate one with: openssl rand -base64 32
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database with initial data
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3005](http://localhost:3005)

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin panel pages
│   ├── client/            # Client portal pages
│   ├── kiosk/             # Kiosk interface
│   ├── api/               # API routes
│   └── auth/              # Authentication pages
├── components/            # Reusable React components
│   ├── ui/                # Base UI components (shadcn/ui)
│   ├── admin/             # Admin-specific components
│   ├── client/            # Client-specific components
│   └── auth/              # Authentication components
├── lib/                   # Utility libraries
│   ├── auth.ts            # NextAuth configuration
│   ├── prisma.ts          # Database client
│   └── utils.ts           # Helper functions
├── services/              # Business logic services
├── types/                 # TypeScript type definitions
└── contexts/              # React contexts
```

## 🔧 Development Workflow

### Making Changes

1. **Frontend Components**: Edit files in `src/components/` or `src/app/`
2. **API Routes**: Modify files in `src/app/api/`
3. **Database Schema**: Update `prisma/schema.prisma` and run migrations
4. **Business Logic**: Update services in `src/services/`

### Database Operations

```bash
# View database in Prisma Studio
npm run db:studio

# Reset database (careful!)
npm run db:push --force-reset

# Create new migration
npm run db:migrate

# Seed with final data
npm run db:seed:final
```

### Available Scripts

- `npm run dev` - Start development server (port 3005)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with test data

## 🎯 Key Features

### Admin Panel (`/admin`)
- **Dashboard**: Overview of system metrics
- **Client Management**: CRUD operations for clients
- **Registration Approvals**: Review and approve client registrations
- **Branch Management**: Manage branch locations and modules
- **Camera Monitoring**: Monitor camera status and detections
- **FAQ Management**: Manage chatbot knowledge base
- **Audit Logs**: View system activity logs

### Client Portal (`/client`)
- **Profile Management**: Update personal information
- **Document Upload**: Manage required documents
- **Visit History**: View past visits and interactions
- **Help & Support**: Access FAQ and support

### Kiosk Interface (`/kiosk`)
- **Public Registration**: Self-service client registration
- **Facial Recognition**: Camera-based client identification
- **Chat Support**: AI-powered assistance

## 🔐 Authentication

The system uses **dual authentication**:

1. **Admin/Agent Users**: NextAuth with credentials
   - Default admin: `admin@example.com` / `admin123`
   - Default agent: `agent@example.com` / `agent123`

2. **Clients**: Custom authentication system
   - Self-registration through kiosk interface
   - Admin approval required for activation

## 🗄️ Database Schema

The application uses PostgreSQL with Prisma ORM. Key models include:

- **User**: Admin and agent accounts
- **Client**: Customer profiles and authentication
- **Branch**: Physical locations
- **Camera**: Surveillance devices
- **Visit**: Customer interactions
- **ChatSession**: Support conversations
- **FAQ**: Knowledge base entries

## 🚀 Deployment

The application is configured for **Vercel deployment**:

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## 🧪 Testing

See `TESTING_GUIDE.md` for comprehensive testing instructions including:
- Authentication flows
- Admin panel functionality
- Client registration process
- API endpoint testing

## 📚 Additional Documentation

- `FINAL_SUMMARY.md` - Project overview and completion status
- `TESTING_GUIDE.md` - Detailed testing procedures
- `PHASE4_API_REFERENCE.md` - API documentation
- `CLIENT_AUTH_GUIDE.md` - Client authentication flow

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is private and proprietary.

---

**Need help?** Check the testing guide or review the API documentation for detailed implementation examples.