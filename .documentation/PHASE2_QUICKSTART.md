# 🚀 Phase 2 - Quick Start Guide

## Prerequisites

### 1. **Add Environment Variables**

Add these to your `.env` file:

```bash
# Add these lines to .env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="xRb6v7BV0S1xE4i1EEGvyH0dTIvovvwBy2ogOIDAMVQ="
```

### 2. **Clear Old Sessions**

**IMPORTANT**: If you had logged in before, you MUST clear your browser cookies:

1. Open Dev Tools (F12)
2. Go to Application → Cookies
3. Delete all cookies for `localhost:3000`
4. Refresh the page

---

## 🧪 Testing the API

### Step 1: Start the Server

```bash
npm run dev
```

### Step 2: Login to Get Session

1. Go to `http://localhost:3000/auth/signin`
2. Login with test credentials:
   - **Email**: `admin@banking-agent.com`
   - **Password**: `admin123`

### Step 3: Test API Endpoints

Now you can test the APIs! Here are some examples:

#### **Get All Clients**

```bash
# In browser console (while logged in):
fetch('/api/clients')
  .then(res => res.json())
  .then(console.log)
```

#### **Get Client Statistics**

```bash
fetch('/api/clients/stats')
  .then(res => res.json())
  .then(console.log)
```

#### **Get All Branches**

```bash
fetch('/api/branches')
  .then(res => res.json())
  .then(console.log)
```

#### **Get Camera Statistics**

```bash
fetch('/api/cameras/stats')
  .then(res => res.json())
  .then(console.log)
```

#### **Search FAQs**

```bash
fetch('/api/faqs?status=PUBLISHED')
  .then(res => res.json())
  .then(console.log)
```

---

## 📊 Available API Endpoints

### **Clients** (`/api/clients/*`)
- `GET /api/clients` - List all clients
- `GET /api/clients/stats` - Client statistics
- `GET /api/clients/[id]` - Get specific client
- `POST /api/clients` - Create client (Admin only)
- `PATCH /api/clients/[id]` - Update client (Admin only)
- `POST /api/clients/[id]/block` - Block client (Admin only)

### **Branches** (`/api/branches/*`)
- `GET /api/branches` - List all branches
- `GET /api/branches/stats` - Branch statistics
- `GET /api/branches/[id]` - Get specific branch
- `GET /api/branches/[id]/modules` - Get branch modules

### **Cameras** (`/api/cameras/*`)
- `GET /api/cameras` - List all cameras
- `GET /api/cameras/stats` - Camera statistics
- `GET /api/cameras/[id]` - Get specific camera

### **FAQs** (`/api/faqs/*`)
- `GET /api/faqs` - List FAQs (supports filters)
- `GET /api/faqs/stats` - FAQ statistics
- `GET /api/faqs/[id]` - Get specific FAQ
- `POST /api/faqs` - Create FAQ

### **QA Pairs** (`/api/qa/*`)
- `GET /api/qa` - List QA pairs
- `GET /api/qa/[id]` - Get specific QA pair
- `POST /api/qa` - Create QA pair

---

## 🔐 Test Credentials

```
Admin:
  Email: admin@banking-agent.com
  Password: admin123

Agent:
  Email: agent1@banking-agent.com
  Password: admin123

Client:
  Email: juan.perez@email.com
  Password: client123
```

---

## 🎯 Quick Tests

### Test 1: Check If APIs Work

```javascript
// Run in browser console while logged in as admin
async function testAPIs() {
  const tests = [
    '/api/clients/stats',
    '/api/branches/stats',
    '/api/cameras/stats',
    '/api/faqs/stats',
    '/api/clients',
    '/api/branches',
  ]
  
  for (const url of tests) {
    const res = await fetch(url)
    const data = await res.json()
    console.log(`✅ ${url}:`, data)
  }
}

testAPIs()
```

### Test 2: Create a New Client

```javascript
// Run in browser console while logged in as admin
async function createTestClient() {
  const res = await fetch('/api/clients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'newclient@test.com',
      password: 'password123',
      name: 'New Test Client',
      dni: '87654321',
      phone: '+51 999 888 777'
    })
  })
  
  const data = await res.json()
  console.log('✅ Client created:', data)
  return data
}

createTestClient()
```

### Test 3: Search Clients

```javascript
// Run in browser console while logged in
async function searchClients(query) {
  const res = await fetch(`/api/clients?query=${query}`)
  const data = await res.json()
  console.log('🔍 Search results:', data)
  return data
}

searchClients('juan')
```

---

## ⚠️ Troubleshooting

### Issue: "Unauthorized" Error

**Solution**: 
1. Make sure you're logged in
2. Clear browser cookies and login again
3. Check that `NEXTAUTH_SECRET` is in `.env`

### Issue: "JWT Decryption Failed"

**Solution**:
1. Stop the dev server
2. Clear all cookies for `localhost:3000`
3. Restart dev server: `npm run dev`
4. Login again

### Issue: "Client not found" or "Branch not found"

**Solution**: 
Run the seed script again:
```bash
npm run db:seed
```

---

## 🎨 Client-Side Hook

You can use the `useAuth` hook in your React components:

```typescript
'use client'

import { useAuth, useIsAdmin } from '@/hooks/use-auth'

export function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const isAdmin = useIsAdmin()
  
  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Please login</div>
  
  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      {isAdmin && <p>You are an admin!</p>}
    </div>
  )
}
```

---

## ✅ Verification Checklist

- [ ] Environment variables added to `.env`
- [ ] Old cookies cleared
- [ ] Can login successfully
- [ ] `/api/clients/stats` returns data
- [ ] `/api/branches` returns branches
- [ ] `/api/cameras/stats` returns data
- [ ] `/api/faqs` returns FAQs
- [ ] No JWT decryption errors in console

---

## 🚀 Next: Phase 3

Once all APIs are working, you're ready for **Phase 3: Admin Panel UI**!

This will include:
- Beautiful admin dashboard
- Data tables with sorting/filtering
- CRUD forms and dialogs
- Real-time camera monitoring
- FAQ/Dataset editor
- Audit log viewer

---

**Happy Testing! 🎉**

