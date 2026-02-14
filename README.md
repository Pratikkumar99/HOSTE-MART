# Hostel Marketplace

A modern, hostel-centric web application that enables residents to **buy, sell, and request items** within their hostel community.  
Built with **Next.js**, **Supabase**, and **Tailwind CSS**, the platform replaces unorganized buy/sell interactions with a **secure, structured, and student-friendly marketplace**.

## Features

### Authentication & Access Control
- Secure sign-up and login using email/password
- Hostel-based user registration
- **Gender-based access control (Girls/Boys hostel segregation)**
- Marketplace visibility restricted to the same hostel group

---

### Item Listings
- Post items for sale with images, descriptions, price, and condition
- Edit or remove listings from the dashboard
- View seller details within the hostel ecosystem

---

### Item Requests
- Post requests for items you want to buy
- Sellers can directly accept requests
- Reduces unnecessary listings and improves discovery

---

### Real-Time Chat
- One-to-one chat between buyer and seller
- Chat enabled only after interest or request acceptance
- Item context shown within conversations
- Powered by Supabase Realtime

---

### Notifications
- Updates for:
  - New messages
  - Request acceptance
  - Listing interactions

---

### Responsive Design
- Fully responsive layout
- Optimized for both desktop and mobile devices
- Clean, minimal UI using shadcn/ui components

---

## Tech Stack

### Frontend
- **Next.js 14 (App Router)**
- **React 19**
- **TypeScript**

### Styling & UI
- **Tailwind CSS**
- **shadcn/ui (Radix UI primitives)**
- **Lucide Icons**

### Backend & Services
- **Supabase**
  - PostgreSQL database
  - Authentication
  - Realtime subscriptions
  - Storage for images

### Forms & State
- React Hook Form
- Zod validation
- React Context + Local Storage

### Deployment
- Vercel

---

## Prerequisites

Ensure the following are installed:

- Node.js 18+
- npm / yarn / pnpm
- Supabase account

---

## Getting Started

### Clone the repository
```bash
git clone https://github.com/yourusername/hostel-marketplace.git
cd hostel-marketplace
````

### Install dependencies

```bash
npm install
# or
yarn
# or
pnpm install
```

### Configure environment variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open 👉 **[http://localhost:3000](http://localhost:3000)**

---

## Project Structure

```
hostel-marketplace/
├── app/
│   ├── (auth)/             # Login & signup
│   ├── dashboard/          # Protected routes
│   ├── marketplace/        # Listings & requests
│   ├── messages/           # Real-time chat
│   ├── api/                # API routes
│   └── layout.tsx
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── auth/
│   ├── items/
│   └── requests/
├── lib/
│   ├── supabase/           # Supabase client & helpers
│   └── utils.ts
├── public/
├── types/
└── README.md
```

---

## Access Control Logic

* Users are tagged with hostel type at signup
* Marketplace data is filtered at the backend level
* **Girls hostel users cannot view boys hostel listings and vice versa**
* Prevents unnecessary interaction and improves trust and safety

---

## Problem It Solves

* Eliminates cluttered buy/sell messages in common chat groups
* Improves safety using hostel and gender-based segregation
* Enables faster, local, and reliable transactions
* Encourages reuse and sustainability within hostels

---

## Future Enhancements

* Seller ratings and reviews
* Admin moderation panel (optional)
* Push notifications
* Payment integration (UPI / wallet)
* Controlled cross-hostel trading

---

## License

This project is licensed under the **MIT License**.
See the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

* [Next.js Documentation](https://nextjs.org/docs)
* [Supabase Documentation](https://supabase.com/docs)
* [Tailwind CSS](https://tailwindcss.com/docs)
* [shadcn/ui](https://ui.shadcn.com/)