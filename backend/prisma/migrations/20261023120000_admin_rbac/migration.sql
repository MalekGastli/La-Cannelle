-- Admin system: staff role, roles and permissions, per-person overrides, invites, audit log.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'STAFF';

ALTER TABLE "users"
  ADD COLUMN "roleId" INTEGER,
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "lastLoginAt" TIMESTAMP(3);

CREATE TABLE "roles" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

CREATE TABLE "role_permissions" (
  "id" SERIAL NOT NULL,
  "roleId" INTEGER NOT NULL,
  "resource" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "role_permissions_roleId_resource_action_key" ON "role_permissions"("roleId", "resource", "action");

CREATE TABLE "user_permissions" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "resource" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "allow" BOOLEAN NOT NULL,
  CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "user_permissions_userId_resource_action_key" ON "user_permissions"("userId", "resource", "action");

CREATE TABLE "invites" (
  "id" SERIAL NOT NULL,
  "email" TEXT NOT NULL,
  "roleId" INTEGER NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "invitedById" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "invites_email_key" ON "invites"("email");
CREATE UNIQUE INDEX "invites_tokenHash_key" ON "invites"("tokenHash");

CREATE TABLE "audit_logs" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER,
  "userEmail" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "target" TEXT NOT NULL DEFAULT '',
  "detail" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invites" ADD CONSTRAINT "invites_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invites" ADD CONSTRAINT "invites_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
