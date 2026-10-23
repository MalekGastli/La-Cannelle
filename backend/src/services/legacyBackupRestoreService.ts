import fs from 'fs';
import path from 'path';
import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';
import { extractInsertRows } from '../utils/sqlDumpParser';

type LegacyMenuRow = {
  name: string;
  description: string;
  isActive: boolean;
  price: number | null;
  image: string | null;
  minPeople: number | null;
  steps: any;
};

type LegacyProductRow = {
  legacyId: number;
  name: string;
  description: string;
  category: string;
  price: number;
  cost: number;
  available: boolean;
  tier: any;
  ingredients: any;
  allergens: any;
  image: string | null;
  popularity: number;
  createdAt: Date | null;
  updatedAt: Date | null;
  minOrderQuantity: number;
};

type LegacyServiceRow = {
  legacyId: number;
  name: string;
  occasion: string;
  description: string | null;
  image: string | null;
  isActive: boolean;
};

type LegacyAccessoryRow = {
  legacyId: number;
  nameEn: string;
  nameDe: string | null;
  descriptionEn: string;
  descriptionDe: string | null;
  detailsEn: string | null;
  detailsDe: string | null;
  unitEn: string | null;
  unitDe: string | null;
  price: number;
  minQuantity: number;
  image: string | null;
  isActive: boolean;
};

const toInt = (value: unknown) => {
  const num = typeof value === 'number' ? value : Number(value);
  const int = Math.trunc(num);
  return Number.isFinite(int) ? int : null;
};

const toFloat = (value: unknown) => {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : null;
};

const toBool = (value: unknown) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'boolean') return value;
  const raw = String(value).trim().toLowerCase();
  return raw === '1' || raw === 'true';
};

const parseJsonOrNull = (value: unknown) => {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return value;
  const text = value.trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const parseDateOrNull = (value: unknown) => {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isFinite(date.getTime()) ? date : null;
};

const resolveBackupSqlPath = (backupPath?: string) => {
  const candidates: string[] = [];

  if (backupPath) {
    candidates.push(path.isAbsolute(backupPath) ? backupPath : path.resolve(process.cwd(), backupPath));
  }

  if (process.env.LEGACY_BACKUP_SQL) {
    const envPath = process.env.LEGACY_BACKUP_SQL;
    candidates.push(path.isAbsolute(envPath) ? envPath : path.resolve(process.cwd(), envPath));
  }

  candidates.push(
    path.resolve(process.cwd(), 'backup.sql'),
    path.resolve(process.cwd(), '..', 'backup.sql'),
    path.resolve(__dirname, '../../../../backup.sql')
  );

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }

  return null;
};

export const legacyBackupRestoreService = {
  async restoreLegacyMenusFromBackup(options?: { backupPath?: string }) {
    const backupPath = resolveBackupSqlPath(options?.backupPath);
    if (!backupPath) throw new AppError('backup.sql not found (set LEGACY_BACKUP_SQL or place backup.sql at repo root)', 404);

    const sql = fs.readFileSync(backupPath, 'utf8');

    const legacyMenusRaw = extractInsertRows(sql, 'menus');
    const legacyMenuProductsRaw = extractInsertRows(sql, 'menu_products');
    const legacyMenuServicesRaw = extractInsertRows(sql, 'menu_services');
    const legacyProductsRaw = extractInsertRows(sql, 'products');
    const legacyServicesRaw = extractInsertRows(sql, 'services');
    const legacyAccessoriesRaw = extractInsertRows(sql, 'accessories');

    if (legacyMenusRaw.length === 0) throw new AppError('No legacy menus found in backup.sql', 400);

    const legacyMenus: Array<{ legacyId: number } & LegacyMenuRow> = legacyMenusRaw
      .map((row) => {
        // INSERT INTO `menus` VALUES (id,name,description,isActive,startDate,endDate,price,image,createdAt,updatedAt,minPeople,steps)
        const legacyId = toInt(row[0]);
        const name = row[1] ? String(row[1]) : '';
        const description = row[2] ? String(row[2]) : '';
        if (!legacyId || !name || !description) return null;

        const price = toFloat(row[6]);
        const image = row[7] ? String(row[7]) : null;
        const minPeople = toInt(row[10]);
        const steps = parseJsonOrNull(row[11]);

        return {
          legacyId,
          name,
          description,
          isActive: toBool(row[3]),
          price,
          image,
          minPeople,
          steps
        };
      })
      .filter(Boolean) as any;

    const legacyProductsById = new Map<number, LegacyProductRow>();
    for (const row of legacyProductsRaw) {
      // INSERT INTO `products` VALUES (id,name,description,category,menuCategory,price,cost,available,tier,preparationTime,ingredients,allergens,productCategories,image,popularity,createdAt,updatedAt,minOrderQuantity)
      const legacyId = toInt(row[0]);
      const name = row[1] ? String(row[1]) : '';
      const description = row[2] ? String(row[2]) : '';
      const category = row[3] ? String(row[3]) : '';
      const price = toFloat(row[5]);
      const cost = toFloat(row[6]);
      const minOrderQuantity = toInt(row[17]);
      if (!legacyId || !name || !description || !category || price === null || cost === null || !minOrderQuantity) continue;

      legacyProductsById.set(legacyId, {
        legacyId,
        name,
        description,
        category,
        price,
        cost,
        available: toBool(row[7]),
        tier: parseJsonOrNull(row[8]),
        ingredients: parseJsonOrNull(row[10]),
        allergens: parseJsonOrNull(row[11]),
        image: row[13] ? String(row[13]) : null,
        popularity: toInt(row[14]) ?? 0,
        createdAt: parseDateOrNull(row[15]),
        updatedAt: parseDateOrNull(row[16]),
        minOrderQuantity
      });
    }

    const legacyServicesById = new Map<number, LegacyServiceRow>();
    for (const row of legacyServicesRaw) {
      // INSERT INTO `services` VALUES (id,name,occasion,description,image,isActive,createdAt,updatedAt)
      const legacyId = toInt(row[0]);
      const name = row[1] ? String(row[1]) : '';
      const occasion = row[2] ? String(row[2]) : '';
      if (!legacyId || !name || !occasion) continue;
      legacyServicesById.set(legacyId, {
        legacyId,
        name,
        occasion,
        description: row[3] ? String(row[3]) : null,
        image: row[4] ? String(row[4]) : null,
        isActive: toBool(row[5])
      });
    }

    const legacyAccessoriesById = new Map<number, LegacyAccessoryRow>();
    for (const row of legacyAccessoriesRaw) {
      // INSERT INTO `accessories` VALUES (id,nameEn,nameDe,descriptionEn,descriptionDe,detailsEn,detailsDe,unitEn,unitDe,price,minQuantity,image,isActive,createdAt,updatedAt)
      const legacyId = toInt(row[0]);
      const nameEn = row[1] ? String(row[1]) : '';
      const descriptionEn = row[3] ? String(row[3]) : '';
      const price = toFloat(row[9]);
      const minQuantity = toInt(row[10]);
      if (!legacyId || !nameEn || !descriptionEn || price === null || !minQuantity) continue;

      legacyAccessoriesById.set(legacyId, {
        legacyId,
        nameEn,
        nameDe: row[2] ? String(row[2]) : null,
        descriptionEn,
        descriptionDe: row[4] ? String(row[4]) : null,
        detailsEn: row[5] ? String(row[5]) : null,
        detailsDe: row[6] ? String(row[6]) : null,
        unitEn: row[7] ? String(row[7]) : null,
        unitDe: row[8] ? String(row[8]) : null,
        price,
        minQuantity,
        image: row[11] ? String(row[11]) : null,
        isActive: toBool(row[12])
      });
    }

    const legacyMenuIdToProducts = new Map<number, number[]>();
    for (const row of legacyMenuProductsRaw) {
      // INSERT INTO `menu_products` VALUES (id,menuId,productId)
      const menuId = toInt(row[1]);
      const productId = toInt(row[2]);
      if (!menuId || !productId) continue;
      const list = legacyMenuIdToProducts.get(menuId) ?? [];
      list.push(productId);
      legacyMenuIdToProducts.set(menuId, list);
    }

    const legacyMenuIdToServices = new Map<number, number[]>();
    for (const row of legacyMenuServicesRaw) {
      // INSERT INTO `menu_services` VALUES (id,menuId,serviceId)
      const menuId = toInt(row[1]);
      const serviceId = toInt(row[2]);
      if (!menuId || !serviceId) continue;
      const list = legacyMenuIdToServices.get(menuId) ?? [];
      list.push(serviceId);
      legacyMenuIdToServices.set(menuId, list);
    }

    const productsRestored = new Map<number, number>(); // legacyProductId -> currentProductId
    const servicesRestored = new Map<number, number>(); // legacyServiceId -> currentServiceId
    const menusRestored = new Map<number, number>(); // legacyMenuId -> currentMenuId
    const accessoriesRestored = new Map<number, number>(); // legacyAccessoryId -> currentAccessoryId

    // Upsert services (by name + occasion)
    for (const legacy of legacyServicesById.values()) {
      const existing = await prisma.service.findFirst({
        where: { name: legacy.name, occasion: legacy.occasion as any }
      });
      const saved = existing
        ? await prisma.service.update({
            where: { id: existing.id },
            data: {
              description: legacy.description,
              image: legacy.image,
              isActive: legacy.isActive
            }
          })
        : await prisma.service.create({
            data: {
              name: legacy.name,
              nameDe: null,
              occasion: legacy.occasion as any,
              description: legacy.description,
              descriptionDe: null,
              image: legacy.image,
              isActive: legacy.isActive
            }
          });
      servicesRestored.set(legacy.legacyId, saved.id);
    }

    // Upsert products (by name; best-effort exact match)
    for (const legacy of legacyProductsById.values()) {
      const existing = await prisma.product.findFirst({ where: { name: legacy.name } });
      const saved = existing
        ? await prisma.product.update({
            where: { id: existing.id },
            data: {
              description: legacy.description,
              category: legacy.category as any,
              customCategory: null,
              price: legacy.price,
              cost: legacy.cost,
              available: legacy.available,
              minOrderQuantity: legacy.minOrderQuantity,
              ingredients: legacy.ingredients ?? undefined,
              allergens: legacy.allergens ?? undefined,
              image: legacy.image,
              popularity: legacy.popularity
            }
          })
        : await prisma.product.create({
            data: {
              name: legacy.name,
              description: legacy.description,
              category: legacy.category as any,
              customCategory: null,
              price: legacy.price,
              cost: legacy.cost,
              available: legacy.available,
              minOrderQuantity: legacy.minOrderQuantity,
              ingredients: legacy.ingredients ?? undefined,
              allergens: legacy.allergens ?? undefined,
              image: legacy.image,
              popularity: legacy.popularity
            }
          });
      productsRestored.set(legacy.legacyId, saved.id);
    }

    // Upsert menus (by name)
    for (const legacy of legacyMenus) {
      const existing = await prisma.menu.findFirst({ where: { name: legacy.name } });
      const saved = existing
        ? await prisma.menu.update({
            where: { id: existing.id },
            data: {
              description: legacy.description,
              isActive: legacy.isActive,
              price: legacy.price,
              image: legacy.image,
              minPeople: legacy.minPeople,
              steps: legacy.steps ?? undefined
            }
          })
        : await prisma.menu.create({
            data: {
              name: legacy.name,
              description: legacy.description,
              isActive: legacy.isActive,
              price: legacy.price,
              image: legacy.image,
              minPeople: legacy.minPeople,
              steps: legacy.steps ?? undefined
            }
          });

      menusRestored.set(legacy.legacyId, saved.id);
    }

    // Upsert accessories (by nameEn)
    for (const legacy of legacyAccessoriesById.values()) {
      const existing = await prisma.accessory.findFirst({ where: { nameEn: legacy.nameEn } });
      const saved = existing
        ? await prisma.accessory.update({
            where: { id: existing.id },
            data: {
              nameDe: legacy.nameDe,
              descriptionEn: legacy.descriptionEn,
              descriptionDe: legacy.descriptionDe,
              detailsEn: legacy.detailsEn,
              detailsDe: legacy.detailsDe,
              unitEn: legacy.unitEn,
              unitDe: legacy.unitDe,
              price: legacy.price,
              image: legacy.image,
              isActive: legacy.isActive
            }
          })
        : await prisma.accessory.create({
            data: {
              nameEn: legacy.nameEn,
              nameDe: legacy.nameDe,
              descriptionEn: legacy.descriptionEn,
              descriptionDe: legacy.descriptionDe,
              detailsEn: legacy.detailsEn,
              detailsDe: legacy.detailsDe,
              unitEn: legacy.unitEn,
              unitDe: legacy.unitDe,
              price: legacy.price,
              quantityMode: 'GUEST_COUNT' as any,
              fixedQuantity: null,
              image: legacy.image,
              isActive: legacy.isActive
            }
          });
      accessoriesRestored.set(legacy.legacyId, saved.id);
    }

    // Rebuild relations exactly (by legacy ids)
    for (const legacyMenu of legacyMenus) {
      const menuId = menusRestored.get(legacyMenu.legacyId);
      if (!menuId) continue;

      const legacyProductIds = legacyMenuIdToProducts.get(legacyMenu.legacyId) ?? [];
      const legacyServiceIds = legacyMenuIdToServices.get(legacyMenu.legacyId) ?? [];

      const productIds = legacyProductIds
        .map((legacyProductId) => productsRestored.get(legacyProductId))
        .filter((id): id is number => typeof id === 'number');
      const serviceIds = legacyServiceIds
        .map((legacyServiceId) => servicesRestored.get(legacyServiceId))
        .filter((id): id is number => typeof id === 'number');

      await prisma.$transaction([
        prisma.menuProduct.deleteMany({ where: { menuId } }),
        prisma.menuService.deleteMany({ where: { menuId } }),
        productIds.length
          ? prisma.menuProduct.createMany({ data: productIds.map((productId) => ({ menuId, productId })), skipDuplicates: true })
          : prisma.menuProduct.deleteMany({ where: { menuId } }),
        serviceIds.length
          ? prisma.menuService.createMany({ data: serviceIds.map((serviceId) => ({ menuId, serviceId })), skipDuplicates: true })
          : prisma.menuService.deleteMany({ where: { menuId } })
      ]);
    }

    return {
      restoredMenus: menusRestored.size,
      restoredProducts: productsRestored.size,
      restoredServices: servicesRestored.size,
      restoredAccessories: accessoriesRestored.size
    };
  }
};
