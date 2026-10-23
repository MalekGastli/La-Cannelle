# WAMP Database Setup Guide

This guide will help you set up the MySQL database using WAMP Server.

## Step 1: Start WAMP Server

1. Open WAMP Server from your Windows Start menu
2. Wait until the WAMP icon in the system tray turns **green** (it starts as orange/yellow)
3. If it's red, right-click the icon and click "Start All Services"

## Step 2: Access phpMyAdmin

1. Right-click the WAMP icon in the system tray
2. Click **"phpMyAdmin"** (or open your browser and go to `http://localhost/phpmyadmin`)
3. You'll see the phpMyAdmin interface

## Step 3: Create the Database

### Option A: Using phpMyAdmin (GUI)

1. In phpMyAdmin, click on the **"New"** button in the left sidebar (or click "Databases" tab)
2. In the "Create database" section:
   - **Database name**: `catering_db`
   - **Collation**: Select `utf8mb4_unicode_ci` (or `utf8mb4_general_ci`)
3. Click **"Create"** button
4. Your database is now created! ✅

### Option B: Using SQL Command

1. In phpMyAdmin, click on the **"SQL"** tab at the top
2. Paste this command:
   ```sql
   CREATE DATABASE catering_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Click **"Go"** button
4. You should see a success message

## Step 4: Get Database Credentials

By default, WAMP MySQL uses:
- **Host**: `localhost` (or `127.0.0.1`)
- **Port**: `3306`
- **Username**: `root` (default)
- **Password**: (usually empty/blank by default)

**To check or change the root password:**
1. In phpMyAdmin, click on **"User accounts"** tab
2. Find the user `root` and `localhost`
3. You can see the current password (or set a new one)

## Step 5: Create .env File

1. In the `backend` folder, copy `env.example` and rename it to `.env`:
   - Copy `env.example`
   - Rename the copy to `.env` (with the dot at the beginning)

2. Open `.env` file and update the `DATABASE_URL`:

   **If MySQL root password is empty (default):**
   ```env
   DATABASE_URL="mysql://root@localhost:3306/catering_db"
   ```

   **If MySQL root has a password:**
   ```env
   DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/catering_db"
   ```

   **Example with password "mypassword123":**
   ```env
   DATABASE_URL="mysql://root:mypassword123@localhost:3306/catering_db"
   ```

3. Update other values in `.env`:
   ```env
   JWT_SECRET="change-this-to-a-random-secret-key-in-production"
   JWT_EXPIRES_IN="7d"
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL="http://localhost:3000"
   ```

## Step 6: Test Database Connection

After setting up your `.env` file, test the connection:

1. Open terminal in the `backend` folder
2. Run:
   ```bash
   npm run prisma:generate
   ```
3. If successful, run:
   ```bash
   npm run prisma:migrate
   ```
4. If migration succeeds, your database is connected! ✅

## Troubleshooting

### Problem: "Access denied for user 'root'@'localhost'"

**Solution:**
1. Check if you're using the correct password in `DATABASE_URL`
2. If you forgot the password, you can reset it:
   - Stop WAMP services
   - Edit `wamp64\bin\mysql\mysql[version]\my.ini` (or use WAMP menu: MySQL → my.ini)
   - Add this line under `[mysqld]`:
     ```
     skip-grant-tables
     ```
   - Restart MySQL
   - Connect to MySQL and reset password
   - Remove the `skip-grant-tables` line
   - Restart MySQL again

### Problem: "Can't connect to MySQL server"

**Solution:**
1. Make sure WAMP is running (green icon)
2. Check if MySQL service is running:
   - Right-click WAMP icon → Tools → Services
   - Find "wampmysqld" and make sure it's running
3. Try using `127.0.0.1` instead of `localhost` in `DATABASE_URL`

### Problem: "Database 'catering_db' doesn't exist"

**Solution:**
- Go back to Step 3 and create the database in phpMyAdmin

### Problem: Port 3306 is already in use

**Solution:**
- Check if another MySQL instance is running
- You can change MySQL port in WAMP settings, then update `DATABASE_URL` accordingly

## Next Steps

Once your database is set up:

1. **Generate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

2. **Run Migrations:**
   ```bash
   npm run prisma:migrate
   ```

3. **Seed the Database:**
   ```bash
   npm run seed
   ```

   Or restore from a SQL dump (defaults to `../../backup.sql` from `backend/`):
   ```bash
   npm run seed:backup
   ```

4. **Start the Server:**
   ```bash
   npm run dev
   ```

Your backend should now be running on `http://localhost:3001`! 🚀
