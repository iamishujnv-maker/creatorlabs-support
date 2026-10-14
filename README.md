# Creator Labs Support & Attendee Portal 🚀

A full-stack, high-performance customer support and self-service platform designed specifically for **Creator Labs** monetization funnels.

When creators run Meta & Facebook ads driving traffic to weekly workshops and webinars, attendees frequently query:
1. *"I didn't receive the WhatsApp community link"*
2. *"Where is my Zoom link and meeting passcode?"*
3. *"I paid for the course and need direct contact details for the creator's team"*
4. *"My payment went through but I need confirmation"*

This platform eliminates manual support overhead with **instant self-service lookup**, **dynamic link gating**, **admin link overrides**, and **escalation workflows (Tawk.to Live Chat & Support Ticketing)**.

---

## 🌟 Key Features

### 1. Attendee Self-Service Portal (`/`)
- **Smart Phone & Email Lookup**: Normalizes phone numbers (strips `+91`, spaces, dashes) so users always find their ticket.
- **Immediate WhatsApp Access**: 1-click verified community invite button with copy-to-clipboard feedback.
- **Time-Locked Zoom Room**: Unlocks Zoom access and passcode automatically 24 hours prior to the workshop to prevent unauthorized link sharing.
- **Direct Creator Support**: Displays official team email, phone number, and operating hours for each creator.
- **Resend Access Details**: 1-click button to re-dispatch links to the attendee's phone & email.
- **FAQ Accordion**: Instant answers to the 4 most common participant questions.

### 2. Live Chat & Escalation
- **Tawk.to Integration**: Ready to connect your official Tawk.to property by specifying `NEXT_PUBLIC_TAWKTO_PROPERTY_ID`.
- **Built-In Live Assistant**: Interactive instant chat drawer with query auto-responses when Tawk.to is not active.
- **Support Ticket Escalation**: If self-serve doesn't resolve the query, users can submit a ticket stored directly in Supabase.

### 3. Creator Labs Operations Desk (`/admin`)
- **Workshop Link Management**: Update WhatsApp community links, Zoom URLs, and passcodes on the fly. Link changes propagate instantly to attendees.
- **Attendee Roster**: Live search and filter attendees by phone, email, name, or payment ID.
- **Ticket Queue**: View incoming tickets, add resolution notes, and resolve issues.
- **Live Metrics**: Total registrations, webinars count, Meta ad gross revenue, and pending escalations.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Actions, Route Handlers)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security)
- **Styling**: Modern Vanilla CSS Design System (Glassmorphism, CSS variables, Google Fonts Plus Jakarta Sans)
- **Live Chat**: Tawk.to integration + fallback interactive chat drawer
- **Deployment**: Vercel-ready with `vercel.json`

---

## 🚀 Quickstart Guide

### 1. Run Locally
```bash
# Clone or navigate to the directory
cd /Users/ishu/.gemini/antigravity-ide/scratch/creatorlabs-support

# Install dependencies (already installed)
npm install

# Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portal.
Open [http://localhost:3000/admin](http://localhost:3000/admin) to view the operations desk.

### 2. Test Phone Numbers & Emails (Out of the box)
The application includes pre-seeded demo records for immediate verification:
- `9876543210` or `rahul.sharma@example.com` (Rahul Sharma — 2 Masterclasses)
- `9811223344` or `priya.patel@example.com` (Priya Patel — Imminent Workshop with Zoom Active)
- `arjun.v@example.com` (Arjun Verma — Reels Growth Masterclass)

---

## 🗄️ Setting Up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase Dashboard.
3. Open [`supabase_schema.sql`](file:///Users/ishu/.gemini/antigravity-ide/scratch/creatorlabs-support/supabase_schema.sql) from this repository, copy its contents, paste them into the SQL Editor, and click **Run**.
4. Go to **Project Settings** -> **API** to copy:
   - `Project URL`
   - `anon public` key
   - `service_role` key
5. Create a file named `.env.local` in this project directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Optional Tawk.to Live Chat (from Tawk.to Dashboard)
   NEXT_PUBLIC_TAWKTO_PROPERTY_ID=
   NEXT_PUBLIC_TAWKTO_WIDGET_ID=default
   ```

*(Note: If you run without `.env.local`, the application automatically uses the interactive in-memory store so you can test features and demos without setting up Supabase upfront).*

---

## 🌐 Deploying to Vercel & Git

### Step A: Push to GitHub / Git
```bash
git init
git add .
git commit -m "feat: complete creator labs support platform"
git branch -M main
git remote add origin https://github.com/your-username/creatorlabs-support.git
git push -u origin main
```

### Step B: Deploy to Vercel
1. Go to [vercel.com/new](https://vercel.com/new) and import your Git repository.
2. In the **Environment Variables** section, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_TAWKTO_PROPERTY_ID` (optional)
3. Click **Deploy**. Vercel will automatically build and deploy your application worldwide.
