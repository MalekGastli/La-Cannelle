# Troubleshooting Guide

## Error: `npm run prisma:generate` fails

### Step 1: Check You're in the Right Directory

Make sure you're in the `backend` folder:
```bash
cd backend
```

### Step 2: Install Dependencies First

If you haven't installed dependencies yet:
```bash
npm install
```

Wait for it to complete, then try again:
```bash
npm run prisma:generate
```

### Step 3: Check if Prisma is Installed

Verify Prisma is installed:
```bash
npx prisma --version
```

If it says "command not found", run:
```bash
npm install
```

### Step 4: Check for .env File

Prisma needs the `DATABASE_URL` from your `.env` file. Make sure:

1. You have a `.env` file in the `backend` folder
2. It contains a valid `DATABASE_URL`

**To create `.env` file:**
- Copy `env.example` and rename it to `.env`
- Or create a new file named `.env` (with the dot!)

**Windows users:** If you can't create a file starting with a dot:
1. Open Command Prompt in the `backend` folder
2. Run: `copy env.example .env`
3. Edit `.env` with your database credentials

### Step 5: Common Error Messages

#### Error: "Environment variable not found: DATABASE_URL"

**Solution:**
- Make sure you have a `.env` file
- Make sure it contains: `DATABASE_URL="mysql://root@localhost:3306/catering_db"`
- Make sure you're in the `backend` folder when running the command

#### Error: "Can't reach database server"

**Solution:**
1. Make sure WAMP is running (green icon)
2. Check your `DATABASE_URL` in `.env`:
   ```env
   DATABASE_URL="mysql://root@localhost:3306/catering_db"
   ```
3. Make sure the database `catering_db` exists in phpMyAdmin

#### Error: "Access denied for user 'root'@'localhost'"

**Solution:**
- If MySQL has a password, update `.env`:
  ```env
  DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/catering_db"
  ```

#### Error: "Command 'prisma' not found"

**Solution:**
```bash
npm install
```

#### Error: "Prisma schema file not found"

**Solution:**
- Make sure you're in the `backend` folder
- Make sure `prisma/schema.prisma` exists

### Step 6: Try These Commands in Order

```bash
# 1. Make sure you're in backend folder
cd backend

# 2. Install dependencies
npm install

# 3. Check Prisma is installed
npx prisma --version

# 4. Generate Prisma Client
npm run prisma:generate
```

### Step 7: If Still Not Working

Try running Prisma directly:
```bash
npx prisma generate
```

This will show you the exact error message.

## Still Having Issues?

Share the **exact error message** you're seeing, and I can help you fix it!

Common things to check:
- ✅ Are you in the `backend` folder?
- ✅ Did you run `npm install`?
- ✅ Do you have a `.env` file?
- ✅ Is WAMP running (green icon)?
- ✅ Does the database `catering_db` exist?

