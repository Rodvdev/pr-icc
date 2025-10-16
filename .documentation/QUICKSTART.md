# 🚀 Banking Agent ID System - Quick Start Guide

Get up and running in 5 minutes!

---

## ✅ What's Already Done

- ✅ Next.js 15 + TypeScript configured
- ✅ Database schema (15+ models)
- ✅ Authentication system (NextAuth.js)
- ✅ Seed data ready
- ✅ MCP tools framework
- ✅ Audit logging system

---

## 🏃 Quick Start (3 Commands)

```bash
# 1. Generate Prisma Client
npm run db:generate

# 2. Run migrations (if needed)
npm run db:migrate

# 3. Seed the database
npm run db:seed

# 4. Start dev server
npm run dev
```

Done! Go to http://localhost:3000

---

## 🔐 Login

### Admin/Agent Login
1. Go to http://localhost:3000/auth/signin
2. Use these credentials:

```
Email: admin@banking-agent.com
Password: admin123
```

or

```
Email: agent1@banking-agent.com
Password: admin123
```

### Client Login (Phase 4)
```
Email: juan.perez@email.com
Password: client123
```

---

## 📊 Explore Database

```bash
npm run db:studio
```

Opens Prisma Studio at http://localhost:5555

Browse all tables, edit data, run queries!

---

## 🎯 What You Can Do Now

### ✅ Available Features (Phase 1)
- Login as admin or agent
- Navigate to `/admin` (protected route)
- View role-based access control
- Check audit logs in database

### 🔜 Coming Soon (Phase 2-3)
- Client management CRUD
- Branch and camera management
- FAQ management
- Real-time dashboard

---

## 📁 Key Files

```
src/
├── app/
│   ├── admin/                # Admin panel
│   ├── api/auth/            # NextAuth routes
│   └── auth/signin/         # Login page
├── components/
│   └── auth/role-gate.tsx   # RBAC component
├── lib/
│   ├── auth.ts             # NextAuth config
│   ├── mcp.ts              # MCP tools ⭐
│   ├── audit.ts            # Audit system ⭐
│   └── prisma.ts           # DB client
└── types/
    └── next-auth.d.ts      # Auth types

prisma/
├── schema.prisma           # Database schema
├── seed.ts                 # Dev seed ⭐
└── seed-final.ts           # Production seed
```

---

## 🛠️ Useful Commands

### Development
```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run lint             # Run linter
```

### Database
```bash
npm run db:generate      # Generate Prisma Client
npm run db:push          # Push schema (dev only)
npm run db:migrate       # Create migration
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed with test data
npm run db:seed:final    # Seed with production-like data
```

---

## 📝 Environment Variables

Your `.env` should have:

```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

That's it for Phase 1! More variables needed for later phases.

---

## 🎨 UI Components

ShadCN UI is fully configured. Import any component:

```tsx
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
// ... 50+ more components available
```

---

## 🧪 Test the System

### 1. Test Authentication
```bash
# Navigate to login page
open http://localhost:3000/auth/signin

# Login with: admin@banking-agent.com / admin123
# Should redirect to /admin
```

### 2. Test MCP Tools
```typescript
// In any API route or server component
import { faqSearch } from '@/lib/mcp'

const results = await faqSearch('horarios')
// Returns FAQs about schedules
```

### 3. Test Audit Logging
```typescript
// In any API route
import { audit } from '@/lib/audit'

await audit({
  action: 'CLIENT_BLOCKED',
  actorUserId: session.user.id,
  targetClientId: clientId,
  details: { reason: 'Fraud detected' }
})

// Check logs in Prisma Studio → AuditLog table
```

---

## 📚 Documentation

- **Complete Roadmap**: `ROADMAP_COMPLETO.md`
- **Seed Guide**: `SEED_GUIDE.md`
- **Phase 1 Summary**: `PHASE1_COMPLETE.md`
- **Current Status**: `STATUS.md`
- **This Guide**: `QUICKSTART.md`

---

## 🐛 Troubleshooting

### "Can't reach database"
```bash
# Check your DATABASE_URL in .env
# Ensure PostgreSQL is running
```

### "Prisma Client not generated"
```bash
npm run db:generate
```

### "Migration failed"
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### "Seed failed"
```bash
# Check error message
# Usually means database schema is out of sync
npm run db:push
npm run db:seed
```

---

## 🎯 Next Steps

### For Development (Phase 2)
1. Create service layer (`src/services/`)
2. Build API routes (`src/app/api/`)
3. Add request validation (Zod)
4. Implement error handling

### For Admin Panel (Phase 3)
1. Create dashboard layout
2. Build client management UI
3. Add branch management
4. Create FAQ editor

### For Chatbot (Phase 5)
1. Setup Anthropic API
2. Integrate MCP tools
3. Build chat interface
4. Add hand-off system

---

## 💡 Pro Tips

1. **Hot Reload**: Changes to `.tsx`/`.ts` files reload automatically
2. **Database GUI**: Keep Prisma Studio open for quick data inspection
3. **Type Safety**: TypeScript will catch errors - trust the red squiggles!
4. **Seed Often**: Reset data anytime with `npm run db:seed`
5. **Check Logs**: Watch terminal for helpful error messages

---

## 🎉 You're Ready!

**Phase 1 is complete!** You have:
- ✅ Working authentication
- ✅ Complete database
- ✅ Test data
- ✅ Core infrastructure

**Start building** by adding API routes and admin UI in Phase 2-3!

---

## 📞 Common URLs

- **Dev Server**: http://localhost:3000
- **Login**: http://localhost:3000/auth/signin
- **Admin Panel**: http://localhost:3000/admin
- **Prisma Studio**: http://localhost:5555
- **API**: http://localhost:3000/api/*

---

## 🔥 Quick Test Script

Want to verify everything works? Run this:

```bash
# Test complete system
npm run db:seed && npm run dev
```

Then login at http://localhost:3000/auth/signin with `admin@banking-agent.com` / `admin123`

✅ If you see the admin panel, **you're all set!**

---

*Need help? Check `STATUS.md` for detailed information or `ROADMAP_COMPLETO.md` for the full development plan.*

**Happy Coding! 🚀**

