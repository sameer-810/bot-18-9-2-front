# WhatsApp AI Agent — Admin dashboard

React admin console for the multi-tenant WhatsApp AI agent SaaS. Platform admins
manage every tenant (business); owners and staff manage their own business —
the WhatsApp connection, the AI agent, conversations and usage.

Built with the same stack, structure and design system as the team's production
CRM frontend: React 19, Vite 5, TypeScript 5.5, Tailwind 3, Redux Toolkit (auth
state), TanStack Query 5, axios, react-router-dom 7, react-hook-form + zod,
sonner, lucide-react, recharts. The only added dependency is `qrcode.react` (QR
rendering for WhatsApp linking).

## Setup

```bash
cd frontend
npm install
cp .env.example .env   # already present with the default below
npm run dev            # http://localhost:5173
```

The backend must be running and must allow CORS from `http://localhost:5173`.

### Environment

| Variable       | Default                     | Purpose                            |
| -------------- | --------------------------- | ---------------------------------- |
| `VITE_API_URL` | `http://localhost:5010/api` | Backend base URL, including `/api` |

## Scripts

| Script              | What it does                              |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Vite dev server on port 5173              |
| `npm run build`     | `tsc -b` typecheck, then production build |
| `npm run typecheck` | `tsc -b` only                             |
| `npm run lint`      | ESLint (typescript-eslint, react-hooks)   |
| `npm run format`    | Prettier                                  |
| `npm run validate`  | lint + format                             |
| `npm run preview`   | Serve the production build                |

`vercel.json` rewrites all paths to `index.html` for SPA hosting.

## Screens and roles

| Screen                         | admin                             | owner                   | staff          |
| ------------------------------ | --------------------------------- | ----------------------- | -------------- |
| Login                          | ✓                                 | ✓                       | ✓              |
| Dashboard (`/dashboard`)       | all tenants, tenant tiles         | own tenant              | own tenant     |
| Tenants list (`/tenants`)      | ✓ create / delete                 | —                       | —              |
| Tenant detail (`/tenants/:id`) | any                               | own ("My business")     | own, read-only |
| · Connection                   | connect / disconnect / unlink     | same                    | view           |
| · Agent                        | edit (+ slug, active)             | edit                    | view           |
| · Conversations                | pause, end takeover, clear memory | same                    | pause AI only  |
| · Channel                      | ✓                                 | ✓                       | hidden         |
| · Usage                        | ✓                                 | ✓                       | ✓              |
| Users (`/users`)               | all users, any role, pick tenant  | own tenant, owner/staff | —              |

`/my-business` redirects owners/staff to `/tenants/<their tenantId>`. Tenant tabs
and the open chat are in the query string (`?tab=conversations&c=<id>`), so the
dashboard deep-links into a conversation.

Polling: WhatsApp connection every 3s while `connecting`/`pairing`, otherwise 30s;
open thread every 5s; conversation list 15s; dashboard 60s.

## Structure

```
src/
  main.tsx, App.tsx, index.css, vite-env.d.ts
  app/
    store.ts, hooks.ts, queryClient.ts, theme.tsx
    layouts/   AppLayout, Sidebar, Topbar, MobileTabBar, Breadcrumbs,
               CommandPalette, menu.ts, pageLabels.ts, sidebarContext.tsx
    router/    RequireAuth, RequireRole, NotFoundPage
  lib/utils.ts                       cn(), date/number formatting
  shared/
    api/http.ts                      axios instance, bearer token, 401 → sign-out,
                                     envelope types, error messages
    components/                      Badge, Callout, ConfirmDialog, ErrorBoundary, Fab,
                                     Field, Logo, PageLoader, RecordCard, Sheet,
                                     StatCard, Switch
    hooks/                           useMediaQuery/useIsMobile, useDebouncedValue
    lib/                             toast, formStyles
  modules/
    common/                          FormDialog, ResourceListPage,
                                     createResourceApi, createResourceHooks
    auth/                            authSlice, api/authApi, hooks/useAuth,
                                     hooks/usePermissions, pages/LoginPage
    dashboard/                       api, hooks, pages/DashboardPage, types
    tenants/                         api (tenant, whatsapp), hooks, constants, lib,
                                     components (ConnectionTab, AgentTab, ChannelTab,
                                     CreateTenantDialog, WhatsappStatusBadge, …),
                                     pages (TenantListPage, TenantDetailPage,
                                     MyBusinessPage), types
    conversations/                   api, hooks (infinite queries), lib/display,
                                     components (ConversationsPanel, ConversationList,
                                     ConversationThread, MessageBubble), types
    usage/                           api, hooks, components (UsageChart, UsageTab), types
    users/                           api, hooks, components/UserDialog, pages/UsersPage, types
```

## API contract notes

The client implements the backend contract as specified (`{ success, data, meta?,
message? }` envelope, `{ page, limit, total }` list meta). Details worth knowing:

- List responses without `meta` are treated as one complete page.
- Error toasts use `error.details[0]` (`field` or `path`) when present, else
  `error.message`.
- Tenant `PATCH` bodies contain only changed fields; `agent` is sent as a partial
  object; blank history limit / takeover minutes are sent as `null`; the Cloud API
  `accessToken` is only sent when a new one is typed.
- `POST …/whatsapp/connect` sends `phoneNumber` only when it differs from the saved
  number; the response `message` is shown as a toast.
- There is no single-conversation `GET`, so the thread header reads the
  conversation from the list cache (or from the last `PATCH` response).
- Usage tab offers 7 or 30 days (`?days=7|30`).

Design rules are in [DESIGN.md](./DESIGN.md).
