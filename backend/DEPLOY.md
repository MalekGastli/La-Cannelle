# Deploying the backend (Railway + MySQL)

The API is a long-running Express server with Prisma and MySQL, and it stores uploaded
images on disk. Railway fits that; Vercel serverless does not (no MySQL, ephemeral disk).

1. **Create a project** at https://railway.com/new -> *Deploy from GitHub repo* -> `MalekGastli/La-Cannelle`.
2. In the created service: **Settings -> Source -> Root Directory** = `backend`.
   Railway then uses `backend/railway.json` and `backend/Dockerfile`.
3. **Add a database**: *New -> Database -> MySQL*.
4. **Service variables** (Variables tab):
   | Name | Value |
   |---|---|
   | `DATABASE_URL` | `${{MySQL.MYSQL_URL}}` (reference to the MySQL service) |
   | `JWT_SECRET` | the same value as the `JWT_SECRET` set on the Vercel project |
   | `NODE_ENV` | `production` |
   | `FRONTEND_URL` | `https://la-cannelle-eight.vercel.app` (CORS allow-list) |
   | `PORT` | leave unset (Railway injects it) |
5. **Volume**: *Settings -> Volumes -> New Volume*, mount path `/data`. Uploaded images land in `/data/uploads`.
6. **Networking**: *Settings -> Networking -> Generate Domain*. Note the URL, e.g. `https://xxx.up.railway.app`.
7. Migrations run automatically on every start (`prisma migrate deploy`). Check `https://xxx.up.railway.app/health`.
8. **Seed the first admin** (once): install the Railway CLI, `railway link`, then from `backend/`:
   `railway run npm run seed`. See `README.md` for the seeded credentials, and change the password afterwards.
9. **Connect the frontend**: in Vercel, set `BACKEND_API_URL` = `https://xxx.up.railway.app/api` and redeploy.
