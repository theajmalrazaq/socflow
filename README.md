# Socflow

Socflow is an open-source, database-driven society management and email operations platform designed for student chapters, clubs, and community organizations.

## ✨ Key Features
- **BYO SMTP Engine**: Send emails directly using your own Gmail App Passwords or custom SMTP configurations.
- **Dynamic Email Suite**: 8 fully customizable email templates (Announcements, Inductions, Interviews, Certificates, Selections, Rejections, Events, and Contact Responses) synchronized with Supabase DB.
- **Member & Induction Management**: Organize leads, applicants, recruitment stages, and event attendees.
- **Role-Based Access Control**: Secure permission levels for admins, leads, and event managers.
- **Modern Tech Stack**: React, Vite, Tailwind CSS, Framer Motion, Radix UI, and React Email.

## 🚀 Getting Started

### 1. Install Dependencies
```bash
bun install
# or
npm install
```

### 2. Environment Variables
Configure `.env` with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Start Development Server
```bash
bun run dev
# or
npm run dev
```

### 4. Build for Production
```bash
bun run build
# or
npm run build
```

## 📄 License
MIT
