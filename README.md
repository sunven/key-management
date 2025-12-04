# Key Management System

A modern, secure key management application built with Next.js 16, React 19, and TypeScript for managing API providers and tokens.

## Features

- **Multi-user Support**: Each user has isolated access to their own providers and tokens
- **Google OAuth Authentication**: Secure login with NextAuth.js v5
- **Provider Management**: CRUD operations for API providers
- **Token Management**: Secure storage with masked display (click to reveal)
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS v4
- **Database**: Supabase PostgreSQL with Prisma ORM
- **Type-safe**: Full TypeScript support with strict mode

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **React**: Version 19.2.0
- **Database**: Supabase PostgreSQL
- **ORM**: Prisma ORM
- **Authentication**: NextAuth.js v5
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS v4
- **Validation**: Zod
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- Supabase account
- Google OAuth credentials

### 1. Clone and Install

\`\`\`bash
git clone <your-repo>
cd key-management
pnpm install
\`\`\`

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your connection details from **Settings > Database**
3. Copy the connection string (Transaction mode)

### 3. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - **Authorized redirect URIs**:
     - `http://localhost:3100/api/auth/callback/google` (dev)
     - `https://yourdomain.com/api/auth/callback/google` (prod)
5. Copy your **Client ID** and **Client Secret**

### 4. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

\`\`\`bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database URL (from Supabase Settings > Database > Connection string > Transaction mode)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# NextAuth.js Configuration
AUTH_SECRET=your_auth_secret_here_generate_with_openssl_rand_base64_32
AUTH_GOOGLE_ID=your_google_oauth_client_id
AUTH_GOOGLE_SECRET=your_google_oauth_client_secret

# App URL
NEXTAUTH_URL=http://localhost:3100
\`\`\`

**Generate AUTH_SECRET:**
\`\`\`bash
openssl rand -base64 32
\`\`\`

### 5. Set Up Database

Generate and push the database schema to Supabase:

\`\`\`bash
# Generate Prisma Client
pnpm db:generate

# Push to Supabase
pnpm db:push
\`\`\`

### 6. Run Development Server

\`\`\`bash
pnpm dev
\`\`\`

Open [http://localhost:3100](http://localhost:3100) and sign in with Google.

## Available Scripts

\`\`\`bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm db:generate  # Generate Prisma Client
pnpm db:push      # Push schema to database
pnpm db:migrate   # Create and apply migrations
pnpm db:studio    # Open Prisma Studio (database GUI)
\`\`\`

## Database Schema

### users
- `id`: Serial primary key
- `email`: Unique email address
- `name`: User's display name
- `image`: Profile image URL
- `createdAt`: Timestamp

### providers
- `id`: Serial primary key
- `userId`: Foreign key to users
- `baseUrl`: API base URL
- `name`: Provider name
- `description`: Optional description
- `active`: Boolean status
- `createdAt`, `updatedAt`: Timestamps

### tokens
- `id`: Serial primary key
- `providerId`: Foreign key to providers (cascade delete)
- `token`: API token value
- `createdAt`, `updatedAt`: Timestamps

## Project Structure

\`\`\`
key-management/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── auth/            # NextAuth endpoints
│   │   ├── providers/       # Provider CRUD
│   │   └── tokens/          # Token CRUD
│   ├── auth/                # Authentication pages
│   ├── providers/           # Providers page
│   ├── tokens/              # Tokens page
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Dashboard
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── layout/             # Layout components
│   ├── providers/          # Provider components
│   ├── tokens/             # Token components
│   └── ui/                 # shadcn/ui components
├── lib/                    # Utilities
│   ├── db/                 # Database
│   │   └── prisma.ts       # Prisma client
│   └── utils.ts            # Utility functions
├── prisma/
│   └── schema.prisma       # Prisma schema
├── auth.ts                 # NextAuth configuration
└── middleware.ts           # Auth middleware
\`\`\`

## Features in Detail

### Authentication
- Google OAuth login
- Protected routes with middleware
- Session management with NextAuth.js v5

### Provider Management
- Create, read, update, delete providers
- Toggle active/inactive status
- Track token count per provider
- User isolation (users only see their own providers)

### Token Management
- Secure token storage
- Masked display (shows last 4 characters)
- Click to reveal full token
- Associated with providers
- Cascade delete (deleting provider removes tokens)

### Security
- User isolation at database level
- Authentication required for all routes
- Token masking in UI
- Secure session management
- HTTPS enforcement for OAuth

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

Update these in your deployment platform:
- Set `NEXTAUTH_URL` to your production domain
- Update Google OAuth redirect URIs
- Use secure `AUTH_SECRET`

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check Supabase project is active
- Ensure IP is whitelisted in Supabase (or disable IP restrictions)

### OAuth Issues
- Verify redirect URIs match exactly
- Check Google OAuth credentials are correct
- Ensure Google+ API is enabled

### Build Errors
- Clear `.next` folder and rebuild
- Verify all environment variables are set
- Check TypeScript errors with `tsc --noEmit`

## License

MIT

## Contributing

Pull requests are welcome! For major changes, please open an issue first.
