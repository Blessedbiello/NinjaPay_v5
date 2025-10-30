# NinjaPay - 1 Minute Demo Script
**Cypherpunk Hackathon - Week 1 Progress**

---

## 🎬 Demo Flow (60 seconds)

### Scene 1: Landing Page (0:00 - 0:15)
**URL:** http://localhost:3000

**Script:**
> "NinjaPay - Privacy-first payments infrastructure built on Solana with Arcium MPC encryption. This week, we built a complete payment platform from scratch."

**Show:**
- Hero section with gradient design
- Features grid (MPC security, privacy features)
- Developer-focused code examples
- Pricing tiers
- Smooth scroll through the page

---

### Scene 2: Admin Portal - Command Center (0:15 - 0:35)
**URL:** http://localhost:3002/dashboard

**Script:**
> "Our operations dashboard gives platform admins real-time visibility. We're tracking merchants, processing payments, and managing KYC - all connected to PostgreSQL."

**Show:**
1. **Dashboard** (5 sec)
   - Live metrics cards (merchants, payments, KYC status)
   - Platform statistics
   - Recent activity

2. **Merchants Page** (5 sec)
   - Navigate to http://localhost:3002/merchants
   - Merchant directory with filters
   - KYC status badges (Approved, Pending, Rejected)
   - Click "View details" on a merchant

3. **Risk/Payments Page** (5 sec)
   - Navigate to http://localhost:3002/risk
   - Payment transaction monitoring
   - Status filters (All, Pending, Confirmed, Failed)
   - Real-time payment tracking

---

### Scene 3: Merchant Dashboard - Payment Links (0:35 - 0:55)
**URL:** http://localhost:3001/dashboard

**Script:**
> "Merchants can create encrypted payment links in seconds. Each link supports multiple currencies, custom amounts, and automatic wallet connection."

**Show:**
1. **Dashboard Overview** (3 sec)
   - Revenue metrics
   - Payment statistics

2. **Payment Links** (7 sec)
   - Navigate to "Payment Links" tab
   - Show existing payment links with:
     - Product names
     - Amounts in USDC/SOL
     - Views and conversion stats
   - Click on a link to see details/QR code

3. **Create New Link** (Quick preview - 5 sec)
   - Click "Create Link" button
   - Show form fields (product, amount, currency)
   - Mention: "Generates encrypted links with built-in privacy"

---

### Scene 4: Closing (0:55 - 1:00)
**Script:**
> "Week 1: Landing page, admin ops portal, and functional payment links - all integrated with Solana and ready for Arcium MPC encryption."

**Show:**
- Quick flash of all three pages side by side (if possible)
- GitHub repo link or project logo

---

## 🎯 Key Talking Points

1. **Privacy-First**: Arcium MPC encryption for confidential payments
2. **Production-Ready**: PostgreSQL integration, real-time metrics
3. **Developer-Friendly**: Clean APIs, payment link generation
4. **Full Stack**: Landing → Admin Ops → Merchant Portal

---

## 📋 Pre-Demo Checklist

- [ ] All servers running (3000, 3001, 3002, 8001)
- [ ] Database has merchant data
- [ ] Payment links are visible in dashboard
- [ ] Admin portal showing real metrics
- [ ] Wallet connected (for payment link demo)

---

## 🚀 Quick Start Commands

```bash
# Terminal 1: Landing Page
cd apps/landing && pnpm dev

# Terminal 2: Merchant Dashboard
cd apps/merchant-dashboard && pnpm dev

# Terminal 3: Admin Portal
cd apps/admin-portal && pnpm dev

# Terminal 4: API Gateway
cd services/api-gateway && PORT=8001 API_PORT=8001 pnpm dev
```

---

## 💡 Demo Tips

1. **Rehearse transitions** - Practice switching between tabs smoothly
2. **Zoom browser** - Set to 110-125% for better visibility
3. **Hide bookmarks bar** - Clean browser UI
4. **Close unnecessary tabs** - Keep only demo tabs open
5. **Test on camera** - Ensure text is readable in recording
6. **Have backup** - Screen recording ready if live demo fails
7. **Mute notifications** - Turn off system notifications

---

## 🎨 Visual Highlights

### Landing Page
- Ninja purple gradient (#7C3AED → #2563EB)
- Animated code preview
- Modern, clean design

### Admin Portal
- Real-time dashboard metrics
- Status badges with colors
- Professional data tables
- Filter functionality

### Merchant Dashboard
- Payment link cards
- QR code generation
- Revenue tracking
- Wallet integration

---

## 📱 URLs Quick Reference

| Page | URL | Purpose |
|------|-----|---------|
| Landing | http://localhost:3000 | Marketing site |
| Merchant | http://localhost:3001/dashboard | Payment management |
| Admin | http://localhost:3002/dashboard | Platform operations |
| API | http://localhost:8001/health | Backend services |

---

## 🎥 Recording Setup

**Recommended Settings:**
- Resolution: 1920x1080 (1080p)
- Frame Rate: 30 fps
- Browser: Chrome/Brave (best rendering)
- Window Size: Maximized
- Recording Tool: OBS Studio / QuickTime / Loom

**Browser Extensions to Disable:**
- Ad blockers
- Dev tools extensions
- Password managers (auto-pop-ups)

---

Good luck with your demo! 🚀
