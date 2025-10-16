# 🌱 Seed Scripts Guide

This guide explains how to use the seed scripts for the Banking Agent ID System.

## 📋 Overview

We have two seed scripts:

1. **`seed.ts`** - For Phase 1-2 development (current phase)
2. **`seed-final.ts`** - For Phase 8 complete system simulation

## 🚀 Quick Start

### Prerequisites

1. Ensure PostgreSQL is running
2. Configure your `.env` file with `DATABASE_URL`
3. Run Prisma migrations

### Running the Development Seed (Phase 1-2)

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Run the seed
npm run db:seed
```

### Running the Final Seed (Phase 8)

```bash
# Run the comprehensive seed
npm run db:seed:final
```

## 📊 What Each Seed Creates

### `seed.ts` - Development Seed (Phase 1-2)

Creates a minimal but complete dataset for development:

- **Users**: 3 (1 admin, 2 agents)
- **Branches**: 3 branches in Lima
- **Modules**: 5 agent modules + kiosks
- **Cameras**: 4 cameras with different statuses
- **Clients**: 3 test clients
- **Facial Profiles**: 2 profiles
- **Registration Requests**: 2 (1 approved, 1 pending)
- **FAQs**: 7 questions
- **QA Pairs**: 4 pairs
- **Chat Sessions**: 1 sample conversation
- **Visits**: 3 visits
- **Detection Events**: 3 facial recognition events
- **Audit Logs**: 3 logs
- **Camera Logs**: 3 logs

**Test Credentials:**
```
Admin:  admin@banking-agent.com / admin123
Agent:  agent1@banking-agent.com / agent123
Client: juan.perez@email.com / client123
```

### `seed-final.ts` - Production Simulation (Phase 8)

Creates a comprehensive dataset simulating a real production environment:

- **Users**: 7 (2 admins, 5 agents)
- **Branches**: 5 branches across Lima
- **Modules**: 14+ agent modules and kiosks
- **Cameras**: 14+ cameras with realistic statuses
- **Clients**: 50 clients with various statuses
- **Facial Profiles**: 35 profiles
- **Registration Requests**: 20 with different statuses
- **FAQs**: 20+ comprehensive questions
- **QA Pairs**: 8+ knowledge base entries
- **Chat Sessions**: 30 realistic conversations
- **Visits**: 100 visits across all branches
- **Detection Events**: 200 facial recognition events
- **Audit Logs**: 150 comprehensive logs
- **Camera Logs**: 500+ system logs

**Test Credentials:**
```
Admin:  rodrigo.admin@banking-agent.com / admin123
Agent:  maria.garcia@banking-agent.com / agent123
Client: (any of the 50 generated) / client123
```

## 🔄 Database Reset

If you need to reset your database and reseed:

```bash
# Option 1: Reset and reseed
npx prisma migrate reset

# Option 2: Push schema and seed manually
npm run db:push
npm run db:seed
```

## 📝 Data Structure

### Users & Authentication

Both seeds create users with hashed passwords (bcrypt with 12 rounds). All users have proper roles (ADMIN/AGENT) configured for NextAuth.js.

### Branches & Modules

Branches represent physical locations with:
- Unique codes (e.g., `SI-001`, `MFL-002`)
- Full addresses in Peru
- Multiple agent modules and kiosks

### Cameras

Cameras are distributed across modules with realistic statuses:
- **ONLINE**: Active and functioning
- **OFFLINE**: Disconnected
- **ERROR**: Malfunctioning

### Clients

Clients have:
- DNI (Peruvian ID)
- Email/phone
- Status (ACTIVE/BLOCKED/DELETED)
- Hashed passwords for authentication
- Optional facial profiles

### Knowledge Base (FAQ & QA)

Both seeds create comprehensive knowledge bases in Spanish (Peru):
- Banking operations
- Account management
- Security procedures
- Service hours and locations
- Fees and charges

### Chat History

Sample conversations demonstrate:
- Client questions
- Bot responses with confidence scores
- Intent classification
- Metadata tracking

### Visits

Visit records show:
- Client identification
- Branch/module assignment
- Visit purpose
- Status tracking (WAITING/IN_SERVICE/COMPLETED/ABANDONED)
- Timestamps for analytics

## 🎯 Use Cases

### Development (seed.ts)
- Quick setup for feature development
- Testing authentication flows
- UI component development
- API endpoint testing

### Testing (seed-final.ts)
- Performance testing with realistic data
- Dashboard metrics validation
- Search functionality testing
- Analytics and reporting
- End-to-end testing

## 🔒 Security Notes

1. **Passwords**: All passwords in seeds are hashed with bcrypt
2. **Production**: NEVER use these seeds in production
3. **Credentials**: Change default credentials immediately
4. **Data**: Seeds create mock data for testing only

## 🛠️ Customization

### Modifying the Development Seed

Edit `/prisma/seed.ts` to:
- Add more test users
- Create specific test scenarios
- Add custom FAQ/QA content
- Adjust branch locations

### Modifying the Final Seed

Edit `/prisma/seed-final.ts` to:
- Increase data volume
- Add more branches
- Create specific test patterns
- Adjust distribution ratios

## 📈 Next Steps

After seeding:

1. **Verify data**: `npm run db:studio`
2. **Test authentication**: Try logging in with test credentials
3. **Check API**: Test `/api/branches` or other endpoints
4. **Start development**: `npm run dev`

## 🐛 Troubleshooting

### "Can't reach database server"
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify port is correct

### "Unique constraint violation"
- Database already has data
- Run `npx prisma migrate reset` to reset

### "bcryptjs not found"
- Run `npm install`
- Check that bcryptjs is in dependencies

### "Prisma Client not generated"
- Run `npm run db:generate`

## 📚 Related Documentation

- [Prisma Schema](/prisma/schema.prisma)
- [Complete Roadmap](/ROADMAP_COMPLETO.md)
- [Prisma Setup Guide](/PRISMA_SETUP.md)
- [Development Roadmap](/DEVELOPMENT_ROADMAP.md)

---

**Ready to start?** Run `npm run db:seed` and begin developing! 🚀

