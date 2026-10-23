# How to Generate JWT_SECRET

The `JWT_SECRET` is a secret key that you need to **create yourself**. It's used to sign and verify JWT tokens for authentication.

## Quick Method: Use Node.js

1. Open a terminal/command prompt
2. Run this command:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

This will generate a random 128-character hexadecimal string that you can use as your JWT_SECRET.

## Alternative Methods

### Method 1: Online Generator
Visit: https://generate-secret.vercel.app/64
- Set length to 64
- Copy the generated secret

### Method 2: PowerShell (Windows)
```powershell
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Method 3: Manual (Simple)
You can also use any long random string, for example:
```
my-super-secret-jwt-key-for-catering-app-2024-production
```

**Note:** For production, use a strong random secret (Method 1 or Node.js method above).

## Where to Put It

1. Copy the generated secret
2. Open your `.env` file in the `backend` folder
3. Replace the placeholder with your generated secret:

```env
JWT_SECRET="paste-your-generated-secret-here"
```

## Example

After generating, your `.env` file should look like:

```env
DATABASE_URL="mysql://root@localhost:3306/catering_db"
JWT_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
```

## Important Notes

⚠️ **Keep it secret!**
- Never commit `.env` to Git (it's already in `.gitignore`)
- Use different secrets for development and production
- Don't share your secret publicly

✅ **For development/testing**, you can use a simple string like:
```env
JWT_SECRET="dev-secret-key-12345"
```

✅ **For production**, always use a strong randomly generated secret.
