# Deploying the backend on Vercel

The API runs as a serverless Express app (`api/index.ts`, routed by `vercel.json`) with Neon Postgres
and Vercel Blob for image uploads. Create a second Vercel project from this repo with
**Root Directory = `backend`**, then:

1. Storage -> create/connect a **Neon** database to the project (injects `DATABASE_URL` and `DATABASE_URL_UNPOOLED`).
2. Storage -> create a **Blob** store and connect it (injects `BLOB_READ_WRITE_TOKEN`).
3. Environment variables: `JWT_SECRET` (same value as the frontend project), `NODE_ENV=production`,
   `FRONTEND_URL` (the frontend's public URL, used for CORS), and optionally `ADMIN_EMAIL` + `ADMIN_PASSWORD`
   to create the first admin on the next build (skipped if the user already exists).
4. Every build runs `prisma migrate deploy`, so the schema is created/updated automatically.
5. In the frontend project set `BACKEND_API_URL` = `https://<backend-domain>/api` and redeploy.

The Prisma schema targets PostgreSQL (it was MySQL before); the old MySQL migrations were replaced by a single baseline.
