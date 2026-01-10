# Vora - Online Study Rooms App

A modern, real-time study room application built with the MERN stack. Vora provides a clean, industrial design interface for students to collaborate in virtual study rooms.

## 🏗️ Architecture

This is a monorepo containing:

- **`/server`** - Node.js + Express + MongoDB (Mongoose) + Socket.io backend
- **`/client`** - Vite + React + TypeScript + Tailwind CSS + shadcn/ui frontend

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm 8+ (preferred) or npm
- MongoDB (local or remote instance)

### Installation

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment variables:**

   Create a `.env` file in the `server` directory (see `server/.env.example` for reference):
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/vora
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d

   # Google OAuth (required for Google login)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

   # Session Secret (for passport sessions)
   SESSION_SECRET=your-session-secret-key-change-this-in-production
   ```

   **Google OAuth Setup:**
   1. Go to [Google Cloud Console](https://console.cloud.google.com/)
   2. Create a new project or select existing one
   3. Enable Google+ API
   4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
   5. Application type: Web application
   6. Authorized redirect URIs: `http://localhost:5000/auth/google/callback`
   7. Copy Client ID and Client Secret to your `.env` file

3. **Start MongoDB:**
   
   Make sure MongoDB is running on your system. If using a local instance:
   ```bash
   # macOS/Linux
   mongod
   
   # Windows (if installed as service, it should start automatically)
   # Or run: mongod
   ```

### Development

**Run both client and server:**
```bash
pnpm dev
```

**Run client only:**
```bash
pnpm dev:client
```

**Run server only:**
```bash
pnpm dev:server
```

The client will be available at `http://localhost:5173`
The server will be available at `http://localhost:5000`

### Build

Build the client for production:
```bash
pnpm build
```

## 📁 Project Structure

```
vora/
├── client/                 # Frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── ui/        # shadcn/ui components
│   │   │   └── layout/    # Layout components (Header, Sidebar, etc.)
│   │   ├── lib/           # Utilities and design system
│   │   ├── pages/         # Route pages
│   │   └── App.tsx        # Main app component
│   ├── index.html
│   └── package.json
│
├── server/                 # Backend application
│   ├── config/            # Configuration files
│   ├── routes/            # Express routes
│   ├── server.js          # Main server file
│   └── package.json
│
└── package.json           # Root package.json (workspace config)
```

## 🎨 Design System

Vora uses an industrial, clean design system with:

- **Dark mode** as default (toggle available in header)
- **Industrial palette**: Slate/stone/gray color scheme
- **Border radius**: 2xl (1rem) for consistent rounded corners
- **Subtle borders and soft shadows** for depth
- **Typography scale** and **spacing system** defined in `client/src/lib/design-system.tsx`

### Key Design Tokens

- Spacing: xs (8px) to 3xl (64px)
- Typography: xs (12px) to 5xl (48px)
- Border radius: 2xl (1rem) default
- Shadows: sm, md, lg variants

## 🛣️ Routes

### Client Routes

- `/login` - Login page
- `/dashboard` - Main dashboard
- `/rooms` - List of study rooms
- `/rooms/:roomId` - Individual room detail page
- `/profile` - User profile page

### Server Routes

**Public Routes:**
- `GET /health` - Health check endpoint
- `POST /api/auth/register` - Register new user (email, password, name, university?)
- `POST /api/auth/login` - Login user (email, password)
- `GET /auth/google` - Initiate Google OAuth login
- `GET /auth/google/callback` - Google OAuth callback

**Protected Routes (require JWT token):**
- `GET /api/auth/me` - Get current user profile
- `GET /api/users/me` - Get user profile
- `PATCH /api/users/me` - Update user profile (name, university)
- `GET /api/rooms` - List rooms
- `POST /api/rooms` - Create room
- `GET /api/rooms/:id` - Get room details
- `POST /api/rooms/:id/join` - Join room
- `GET /api/rooms/:id/messages` - Get room messages
- `GET /api/tasks/rooms/:roomId/tasks` - Get room tasks
- `POST /api/tasks/rooms/:roomId/tasks` - Create task
- `PATCH /api/tasks/tasks/:taskId` - Update task
- `DELETE /api/tasks/tasks/:taskId` - Delete task
- `POST /api/invites/send` - Send room invite via email

## 🧩 Technology Stack

### Frontend

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Component library
- **React Router** - Routing
- **Socket.io Client** - Real-time communication
- **Lucide React** - Icons

### Backend

- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB + Mongoose** - Database and ODM
- **Socket.io** - Real-time WebSocket server
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

## 📝 Available Scripts

### Root Level

- `pnpm dev` - Run both client and server in development mode
- `pnpm dev:client` - Run only the client
- `pnpm dev:server` - Run only the server
- `pnpm build` - Build the client for production
- `pnpm install:all` - Install all dependencies

### Client (`/client`)

- `pnpm dev` - Start Vite dev server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint

### Server (`/server`)

- `pnpm dev` - Start server with watch mode
- `pnpm start` - Start server (production)

## 🔧 Configuration

### Client Configuration

- **Vite config**: `client/vite.config.ts`
- **Tailwind config**: `client/tailwind.config.js`
- **TypeScript config**: `client/tsconfig.json`

### Server Configuration

- **Environment variables**: `server/.env` (create from `.env.example`)
- **MongoDB connection**: `server/config/db.js`

## 🔐 Authentication

The app supports two authentication methods:

1. **Local Authentication (Email/Password)**
   - Users can register with email, password, name, and optional university
   - Passwords are hashed using bcrypt
   - JWT tokens are issued upon successful login/registration

2. **Google OAuth**
   - Users can sign in with their Google account
   - OAuth flow handled by Passport.js
   - JWT tokens are issued after successful OAuth authentication

**Token Management:**
- Tokens are stored in `localStorage` on the client
- Tokens are automatically attached to API requests via axios interceptors
- Protected routes require valid JWT tokens
- Invalid/expired tokens automatically redirect to login

## 🚧 Development Notes

- The app uses **pnpm workspaces** for monorepo management
- Dark mode is enabled by default (see `client/src/index.css`)
- All UI components use **rounded-2xl** (1rem) border radius
- Socket.io is set up but room functionality needs to be implemented
- MongoDB connection string can be configured via `MONGO_URI` env variable
- JWT tokens expire after 7 days (configurable via `JWT_EXPIRES_IN`)

## 📦 Adding New Dependencies

**Client dependencies:**
```bash
cd client
pnpm add <package-name>
```

**Server dependencies:**
```bash
cd server
pnpm add <package-name>
```

**Root dependencies (rare):**
```bash
pnpm add -w <package-name>
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 🚀 Deployment

For complete deployment instructions, see:
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Full detailed guide
- **[QUICK_START.md](./QUICK_START.md)** - Quick deployment steps

### Quick Deploy

**Backend (Render):**
1. Connect GitHub repo
2. Set Root Directory: `server`
3. Build: `npm install`
4. Start: `npm start`

**Frontend (Vercel):**
1. Connect GitHub repo
2. Set Root Directory: `client`
3. Framework: Vite
4. Build: `cd .. && pnpm install && cd client && pnpm build`
5. Output: `client/dist`

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for environment variables and configuration.

## 📄 License

MIT

