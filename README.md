# 🏦 Banking Agent ID System

A comprehensive Next.js application for managing banking agent operations with facial recognition, client management, and administrative controls.

## 📋 Table of Contents

- [Quick Start Guide](#-quick-start-guide)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Development](#development)
- [Project Structure](#-project-structure)
- [Key Features](#-key-features)
- [Authentication](#-authentication)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Tech Stack](#-tech-stack)
- [Contributing](#-contributing)

## 🚀 Quick Start Guide

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and npm
- **PostgreSQL** 14+ database
- **Git** for version control
- **Vercel CLI** (optional, for deployment)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd pr-icc

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate
```

### Environment Configuration

Create a `.env` file in the root directory:

```bash
# Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/banking_agent_db?schema=public"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3005"
NEXTAUTH_SECRET="your-secret-key-here"
# Generate secret with: openssl rand -base64 32

# Optional: External Facial Recognition API
NEXT_PUBLIC_FACIAL_API_URL="http://localhost:5001/api"
EXTERNAL_FACIAL_API_URL="http://localhost:5001"

# Node Environment
NODE_ENV="development"
```

### Database Setup

```bash
# Run database migrations
npm run db:migrate

# Seed the database with initial data
npm run db:seed

# (Optional) View database in Prisma Studio
npm run db:studio
```

### Start Development Server

```bash
npm run dev
```

The application will be available at **http://localhost:3005**

## 🏗️ Project Structure

```
pr-icc/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   └── seed.ts               # Seed data
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── admin/            # Admin panel pages
│   │   ├── client/           # Client portal pages
│   │   ├── kiosk/            # Kiosk interface pages
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── clients/      # Client management
│   │   │   ├── branches/     # Branch management
│   │   │   ├── faqs/         # FAQ management
│   │   │   ├── chat/         # Chatbot API
│   │   │   └── kiosk/        # Kiosk endpoints
│   │   ├── auth/             # Auth pages (signin, error)
│   │   ├── chat/             # Chat interface
│   │   └── register/         # Registration page
│   ├── components/           # Reusable React components
│   │   ├── ui/               # Base UI components (shadcn/ui)
│   │   ├── admin/            # Admin-specific components
│   │   ├── client/           # Client-specific components
│   │   ├── chatbot/          # Chatbot components
│   │   ├── kiosk/            # Kiosk-specific components
│   │   └── auth/             # Authentication components
│   ├── lib/                  # Utility libraries
│   │   ├── auth.ts           # NextAuth configuration
│   │   ├── prisma.ts         # Prisma client
│   │   ├── security.ts       # Security utilities
│   │   ├── audit.ts          # Audit logging
│   │   └── mcp.ts            # MCP tools
│   ├── services/             # Business logic services
│   │   ├── client.service.ts
│   │   ├── branch.service.ts
│   │   ├── faq.service.ts
│   │   ├── camera.service.ts
│   │   ├── visit.service.ts
│   │   ├── chatbot.service.ts
│   │   └── index.ts          # Service exports
│   ├── contexts/             # React contexts
│   │   ├── chat-context.tsx
│   │   └── providers/
│   ├── types/                # TypeScript definitions
│   │   └── next-auth.d.ts
│   └── hooks/                # Custom React hooks
│       └── use-auth.ts
├── public/                   # Static assets
├── middleware.ts             # Next.js middleware
├── .env                      # Environment variables
├── .env.example              # Example env file
├── .gitignore                # Git ignore rules
├── next.config.js            # Next.js configuration
├── tailwind.config.ts        # Tailwind configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies
```

## 🎯 Key Features

### Admin Panel (`/admin`)

**Dashboard** - System overview with key metrics
- Active clients count
- Branch statistics
- Camera status monitoring
- Recent audit logs
- Quick access to all modules

**Client Management** (`/admin/clients`)
- View all clients
- Filter by status (Active, Blocked, Deleted)
- Search by name, email, or DNI
- Block/unblock clients
- View client details and activity

**Registration Approvals** (`/admin/registrations`)
- Pending registrations queue
- Approve or reject requests
- Review client documents
- Add approval notes

**Branch Management** (`/admin/branches`)
- Create and manage branches
- Configure modules per branch
- Assign admins to branches
- View branch statistics

**Camera Management** (`/admin/cameras`)
- Monitor camera status
- Configure camera settings
- View detection logs
- Camera health checks

**FAQ Management** (`/admin/faqs`)
- Create and edit FAQs
- Manage Q&A pairs
- Publish/draft status
- Tag management

**Chatbot** (`/admin/chatbot`)
- View conversation logs
- Monitor bot performance
- Configure responses
- Review metrics

**Audit Logs** (`/admin/audit`)
- System activity tracking
- User actions log
- Security events
- Filter by date and user

### Client Portal (`/client`)

**Dashboard** - Personalized client view
- Welcome message
- Recent activity
- Quick actions

**Profile** (`/client/profile`)
- View personal information
- Update contact details
- Change password

**Documents** (`/client/documents`)
- Upload required documents
- View document status
- Download documents

**Visit History** (`/client/visits`)
- View past visits
- Service history
- Queue status

**Help & Support** (`/client/help`)
- FAQ search
- Contact support
- Chat with bot

### Kiosk Interface (`/kiosk`)

**Registration** (`/kiosk/register`)
- Self-service registration
- Photo capture
- Document upload
- Status tracking

**Login** (`/kiosk/login`)
- DNI/Email login
- Secure authentication
- Forgot password

**Welcome** (`/kiosk/welcome`)
- Personalized greeting
- Service selection
- Queue management

**Chat** (`/kiosk/chat`)
- AI-powered assistance
- FAQ integration
- 24/7 availability

## 🔐 Authentication

The system uses **dual authentication**:

### Admin/Agent Users

- **Provider**: NextAuth Credentials
- **Strategy**: JWT
- **Session**: 30 days
- **Default Credentials**:
  - Admin: `admin@banking-agent.com` / `admin123`
  - Agent: `agent1@banking-agent.com` / `admin123`

### Clients

- **Provider**: Custom Credentials (email or DNI)
- **Strategy**: JWT
- **Session**: 30 days
- **Registration**: Self-service through kiosk
- **Approval**: Required from admin

### Security Features

- Rate limiting (5 login attempts per 15 minutes)
- CSRF protection
- Input sanitization
- Password hashing with bcrypt
- Secure HTTP-only cookies
- Audit logging for all auth events

## 📡 API Documentation

### Authentication Endpoints

#### `POST /api/auth/[...nextauth]`
NextAuth endpoint for authentication

#### `POST /api/auth/client/login`
Client login with email or DNI

**Request:**
```json
{
  "email": "string",
  "dni": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "client": {
    "id": "string",
    "name": "string",
    "email": "string",
    "status": "ACTIVE"
  }
}
```

#### `POST /api/auth/client/reset-password`
Request password reset

### Client Management

#### `GET /api/clients`
List all clients with filters

**Query Parameters:**
- `status`: ACTIVE | BLOCKED | DELETED
- `search`: Search term
- `page`: Page number
- `limit`: Items per page

#### `POST /api/clients`
Create new client (admin only)

#### `GET /api/clients/:id`
Get client details

#### `PUT /api/clients/:id`
Update client information

#### `POST /api/clients/:id/block`
Block a client

#### `POST /api/clients/:id/unblock`
Unblock a client

### Branch Management

#### `GET /api/branches`
List all branches

#### `POST /api/branches`
Create new branch

#### `GET /api/branches/:id`
Get branch details

#### `PUT /api/branches/:id`
Update branch

#### `POST /api/branches/:id/modules`
Add module to branch

### Chatbot API

#### `POST /api/chat`
Send chat message

**Request:**
```json
{
  "message": "How do I open an account?",
  "userType": "client"
}
```

**Response:**
```json
{
  "success": true,
  "response": "To open an account...",
  "metadata": {
    "intent": "account_opening",
    "confidence": 0.95,
    "sources": ["FAQ: Account Types"],
    "timestamp": "2024-01-15T10:30:00Z",
    "latency": "150ms",
    "contextUsed": true
  }
}
```

#### `GET /api/chat`
Get chat statistics

### FAQ Management

#### `GET /api/faqs`
List all FAQs

#### `POST /api/faqs`
Create FAQ

#### `GET /api/faqs/:id`
Get FAQ details

#### `PUT /api/faqs/:id`
Update FAQ

#### `POST /api/faqs/:id/publish`
Publish FAQ

## 🗄️ Database Schema

### Core Models

**User** - Admin and agent accounts
```typescript
{
  id: string
  email: string (unique)
  name: string
  role: 'ADMIN' | 'AGENT'
  password: string
  isActive: boolean
}
```

**Client** - Customer profiles
```typescript
{
  id: string
  dni: string (unique)
  email: string (unique)
  name: string
  phone: string
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED'
  hashedPassword: string
}
```

**Branch** - Physical locations
```typescript
{
  id: string
  name: string
  address: string
  modules: AgentModule[]
}
```

**Visit** - Customer interactions
```typescript
{
  id: string
  clientId: string
  branchId: string
  status: 'WAITING' | 'IN_SERVICE' | 'COMPLETED' | 'ABANDONED'
  purpose: string
  startedAt: DateTime
  completedAt: DateTime
}
```

**ChatSession** - Support conversations
```typescript
{
  id: string
  clientId: string
  startedAt: DateTime
  messages: ChatMessage[]
  metrics: ChatMetric[]
}
```

**FAQ** - Knowledge base entries
```typescript
{
  id: string
  title: string
  answer: string
  tags: string[]
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
}
```

## 🚀 Deployment

### Vercel Deployment

1. **Connect Repository**
   ```bash
   vercel login
   vercel link
   ```

2. **Configure Environment Variables**
   - Go to Vercel Dashboard
   - Project Settings > Environment Variables
   - Add all variables from `.env.example`

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Database Setup (Vercel)

Use a managed PostgreSQL service:
- **Neon**: Recommended for Vercel
- **Supabase**: Alternative option
- **AWS RDS**: Production-ready

### Environment Variables (Production)

```bash
DATABASE_URL="postgresql://user:pass@host:5432/db"
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NODE_ENV="production"
```

### Build Process

```bash
# Build for production
npm run build

# Test production build locally
npm run start
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start dev server (port 3005)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed with test data
npm run db:seed:final # Seed with final data
```

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready

# Verify connection string
psql $DATABASE_URL

# Reset Prisma client
npm run db:generate
```

### Authentication Not Working

1. Verify `NEXTAUTH_SECRET` is set
2. Check `NEXTAUTH_URL` matches your domain
3. Clear browser cookies
4. Check server logs for errors

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma client
npm run db:generate
```

### CORS Issues

All API routes should use relative paths:
- ❌ `http://localhost:5001/api/...`
- ✅ `/api/...`

### Module Not Found

```bash
# Clear all caches
rm -rf .next node_modules/.cache

# Rebuild
npm run build
```

## 🛠️ Tech Stack

### Core
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.x
- **Runtime**: Node.js 18+

### Database
- **Database**: PostgreSQL 14+
- **ORM**: Prisma 6.x
- **Migrations**: Prisma Migrate

### Authentication
- **Library**: NextAuth.js v5
- **Strategy**: JWT
- **Hashing**: bcrypt

### UI & Styling
- **Component Library**: shadcn/ui
- **Base Components**: Radix UI
- **Styling**: Tailwind CSS 4.x
- **Icons**: Lucide React

### Utilities
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form
- **Validation**: Zod
- **Date Handling**: date-fns

### Deployment
- **Hosting**: Vercel
- **Database**: Neon/Supabase
- **CI/CD**: GitHub Actions

## 🧪 Testing

### Manual Testing

1. **Authentication Flow**
   - Test admin login
   - Test client login with email
   - Test client login with DNI
   - Test password reset

2. **Admin Panel**
   - Create new client
   - Approve registration
   - Block/unblock client
   - Create FAQ
   - View audit logs

3. **Client Portal**
   - Update profile
   - Upload document
   - View visit history
   - Use chatbot

4. **Kiosk Interface**
   - Complete registration
   - Login with DNI
   - Start visit
   - Chat with bot

### Test Credentials

**Admin**
- Email: `admin@banking-agent.com`
- Password: `admin123`

**Agent**
- Email: `agent1@banking-agent.com`
- Password: `admin123`

**Client** (after seeding)
- Email: `sharon.aiquipa@utec.edu.pe`
- Password: `client123`

## 📚 Additional Documentation

- `TESTING_GUIDE.md` - Detailed testing procedures
- `FINAL_SUMMARY.md` - Project overview
- `CLIENT_AUTH_GUIDE.md` - Authentication flow details
- `API_REFERENCE.md` - Complete API documentation

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards

- Use TypeScript for all new code
- Follow ESLint configuration
- Write self-documenting code
- Add comments for complex logic
- Keep functions small and focused

## 📄 License

This project is private and proprietary.

## 👥 Authors

- **Rodrigo VdeV** - Initial work and development

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Prisma for excellent ORM
- Vercel for seamless deployment
- shadcn/ui for beautiful components

---

**Need help?** Check the documentation files or open an issue in the repository.

**Last Updated**: January 2024
