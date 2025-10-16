# 🧪 Testing Guide - Banking Agent ID System

## ✅ Pre-Flight Checklist

### 1. Environment Variables
Add these to your `.env` file:
```bash
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="xRb6v7BV0S1xE4i1EEGvyH0dTIvovvwBy2ogOIDAMVQ="
```

### 2. Clear Browser Data
- Open DevTools (F12)
- Application → Cookies
- Delete all cookies for `localhost:3000`
- Close DevTools

### 3. Start Server
```bash
npm run dev
```

Wait for: `✓ Ready in XXXXms`

---

## 🔐 Test Authentication

### Login as Admin
1. Go to: `http://localhost:3000/auth/signin`
2. Email: `admin@banking-agent.com`
3. Password: `admin123`
4. Click "Sign in"

**Expected**: Redirect to `/admin` dashboard

---

## 📊 Test Admin Pages

### 1. Dashboard
- URL: `http://localhost:3000/admin`
- **Check**: Stats cards display numbers
- **Check**: Quick action cards are clickable
- **Check**: Sidebar navigation works

### 2. Client Management
- URL: `http://localhost:3000/admin/clients`
- **Check**: Clients table loads
- **Check**: Search works
- **Check**: Status filter works
- **Check**: Can open "New Client" dialog

**Test Actions:**
1. Click "New Client"
2. Fill form:
   - Email: `test@example.com`
   - Password: `password123`
   - Name: `Test Client`
   - DNI: `87654321`
3. Click "Create"
4. **Expected**: Client appears in table

### 3. Branches
- URL: `http://localhost:3000/admin/branches`
- **Check**: Branch cards display
- **Check**: Each shows modules and cameras count

### 4. Cameras
- URL: `http://localhost:3000/admin/cameras`
- **Check**: Camera cards display
- **Check**: Status badges show colors
- **Check**: Stats show online/offline counts

### 5. FAQs
- URL: `http://localhost:3000/admin/faqs`
- **Check**: FAQs tab shows items
- **Check**: QA tab shows items
- **Check**: Search filters both tabs
- **Check**: Publish button works

### 6. Audit Logs
- URL: `http://localhost:3000/admin/audit`
- **Check**: Page loads (may be empty)
- **Check**: Filters are available

---

## 🔌 Test API Endpoints

Open browser console (F12 → Console) and run:

### Client Statistics
```javascript
fetch('/api/clients/stats')
  .then(r => r.json())
  .then(console.log)
```

**Expected Output:**
```json
{
  "success": true,
  "data": {
    "total": 3,
    "active": 2,
    "pending": 1,
    "blocked": 0,
    "inactive": 0
  }
}
```

### List Clients
```javascript
fetch('/api/clients')
  .then(r => r.json())
  .then(console.log)
```

**Expected**: Array of client objects

### Branch Statistics
```javascript
fetch('/api/branches/stats')
  .then(r => r.json())
  .then(console.log)
```

### Camera Statistics
```javascript
fetch('/api/cameras/stats')
  .then(r => r.json())
  .then(console.log)
```

### FAQ Statistics
```javascript
fetch('/api/faqs/stats')
  .then(r => r.json())
  .then(console.log)
```

---

## 🎯 Feature Testing

### Test Client CRUD

#### Create Client
```javascript
fetch('/api/clients', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'newuser@test.com',
    password: 'test123',
    name: 'New Test User',
    dni: '99988877'
  })
}).then(r => r.json()).then(console.log)
```

#### Search Clients
```javascript
fetch('/api/clients?query=juan')
  .then(r => r.json())
  .then(console.log)
```

#### Block Client
```javascript
const clientId = 'your-client-id-here'
fetch(`/api/clients/${clientId}/block`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    reason: 'Test block'
  })
}).then(r => r.json()).then(console.log)
```

---

## 🐛 Troubleshooting

### "Unauthorized" Error
**Solution:**
1. Make sure you're logged in
2. Clear cookies and login again
3. Check that `NEXTAUTH_SECRET` is in `.env`

### "JWT Decryption Failed"
**Solution:**
1. Stop dev server (Ctrl+C)
2. Clear all browser cookies
3. Restart: `npm run dev`
4. Login again

### "Connection Refused"
**Solution:**
1. Check dev server is running
2. Verify port 3000 is not in use
3. Try: `lsof -ti:3000 | xargs kill -9`
4. Restart: `npm run dev`

### "Prisma Client Not Generated"
**Solution:**
```bash
npx prisma generate
npm run dev
```

### Database Connection Error
**Solution:**
1. Check `.env` has valid `DATABASE_URL`
2. Test connection: `npx prisma studio`

---

## ✅ Success Criteria

All tests should pass:

- [ ] Can login as admin
- [ ] Dashboard loads with stats
- [ ] Clients page shows data
- [ ] Can create new client
- [ ] Can search clients
- [ ] Branches page shows cards
- [ ] Cameras page shows cards
- [ ] FAQs page shows items
- [ ] All API endpoints return data
- [ ] No console errors
- [ ] Sidebar navigation works
- [ ] Mobile menu works (test on narrow screen)

---

## 📸 Expected Screenshots

### Admin Dashboard
![Dashboard](should show stats and quick actions)

### Client Management
![Clients](should show table with search and filters)

### Camera Monitoring
![Cameras](should show status cards with badges)

---

## 🚀 Next Steps After Testing

Once all tests pass:

1. ✅ Phase 1-3 verified working
2. 📝 Ready to start Phase 4 (Client Registration)
3. 🎯 Can demonstrate to stakeholders
4. 📊 Can collect initial feedback

---

## 💡 Tips

- **Use incognito mode** for clean testing
- **Check browser console** for errors
- **Test on different browsers** (Chrome, Firefox, Safari)
- **Test on mobile** (responsive design)
- **Document any issues** found

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review `.env` configuration
3. Check server logs in terminal
4. Verify database connection

---

**Happy Testing! 🎉**

