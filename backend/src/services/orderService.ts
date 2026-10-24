import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma, withRetry } from '../prisma';
import { AppError } from '../middleware/errorHandler';

export const MIN_GUESTS = 10;
export const MIN_ORDER_VALUE = 199;
/** Flat service fee is a server-side constant; the client value is ignored. */
export const SERVICE_FEE = Number(process.env.ORDER_SERVICE_FEE ?? 48.9);
const MAX_AMOUNT = 1_000_000;
const DUPLICATE_WINDOW_MS = 30_000;

const round2 = (n: number) => Math.round(n * 100) / 100;

const optionalText = (max: number) =>
  z.preprocess(
    (v) => (v === null || v === '' ? undefined : v),
    z.string().trim().max(max).optional()
  );

/** Server-side contract for POST /orders. Prices sent by the client for items are NOT part of it. */
export const createOrderSchema = z.object({
  clientName: z.preprocess((v) => (v ? v : 'Guest'), z.string().trim().min(1).max(200)),
  contactEmail: z.string({ required_error: 'Contact email and phone are required' }).trim().toLowerCase().email('Invalid contact email').max(254),
  phone: z.string({ required_error: 'Contact email and phone are required' }).trim().min(3, 'Invalid phone').max(50),
  eventType: optionalText(200),
  eventDate: z.preprocess(
    (v) => (v ? new Date(v as any) : new Date()),
    z.date({ invalid_type_error: 'Invalid event date' }).refine((d) => !Number.isNaN(d.getTime()), 'Invalid event date')
  ),
  eventTime: optionalText(50),
  guests: z.coerce.number({ invalid_type_error: 'Invalid guest count' }).int().min(MIN_GUESTS, `A minimum of ${MIN_GUESTS} guests is required`).max(5000, 'Too many guests'),
  location: optionalText(500),
  specialRequests: optionalText(5000),
  businessType: optionalText(100),
  serviceType: optionalText(100),
  serviceId: z.preprocess((v) => (v === '' || v === null ? undefined : v), z.coerce.number().int().positive().optional()),
  postalCode: optionalText(20),
  street: optionalText(200),
  houseNumber: optionalText(50),
  city: optionalText(100),
  items: z
    .array(
      z.object({
        productId: z.coerce.number().int().positive(),
        quantity: z.coerce.number({ invalid_type_error: 'Invalid quantity' }).int().min(0, 'Item quantity cannot be negative').max(100_000, 'Quantity too large')
      })
    )
    .max(300, 'Too many items')
    .default([]),
  // Menu base price and accessories are not itemised in the payload, so subtotal/total cannot be
  // fully recomputed here; they are bounds-checked and the service fee is forced (see createOrder).
  subtotal: z.coerce.number({ invalid_type_error: 'Invalid subtotal' }).finite().min(MIN_ORDER_VALUE, `The minimum order value is ${MIN_ORDER_VALUE} EUR (excl. VAT)`).max(MAX_AMOUNT, 'Subtotal too large'),
  total: z.coerce.number({ invalid_type_error: 'Invalid total' }).finite().max(MAX_AMOUNT, 'Total too large')
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

const IDEMPOTENCY_KEY_RE = /^[A-Za-z0-9_\-:.]{8,128}$/;

export function normalizeIdempotencyKey(raw: unknown): string | undefined {
  if (raw === undefined || raw === null || raw === '') return undefined;
  const key = String(Array.isArray(raw) ? raw[0] : raw).trim();
  if (!IDEMPOTENCY_KEY_RE.test(key)) {
    throw new AppError('Invalid Idempotency-Key (8-128 chars: letters, digits, _ - : .)', 400);
  }
  return key;
}

const orderInclude = {
  items: true,
  service: true,
  user: { select: { id: true, email: true, firstName: true, lastName: true } }
} satisfies Prisma.OrderInclude;

export const orderService = {
  /**
   * Validates and creates an order atomically. Item names/prices always come from the database.
   * Returns `{ order, replayed }`; `replayed` is true when an earlier request with the same
   * idempotency key (or an identical request in the last 30s) already created the order.
   */
  async createOrder(
    rawInput: unknown,
    ctx: { userId?: number; idempotencyKey?: string } = {}
  ): Promise<{ order: Prisma.OrderGetPayload<{ include: typeof orderInclude }>; replayed: boolean }> {
    const parsed = createOrderSchema.safeParse(rawInput);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message || 'Invalid order', 400);
    }
    const input = parsed.data;

    // Merge duplicate lines, drop zero-quantity lines.
    const wanted = new Map<number, number>();
    for (const item of input.items) {
      if (item.quantity > 0) wanted.set(item.productId, (wanted.get(item.productId) ?? 0) + item.quantity);
    }

    const serviceFee = SERVICE_FEE;
    const subtotal = round2(input.subtotal);
    if (input.total < subtotal - 0.01) {
      throw new AppError('Order total is inconsistent', 400);
    }
    // total = subtotal + accessories + fee. Accessories can only add, never subtract.
    const total = round2(Math.max(input.total, subtotal + serviceFee));

    // Namespaced by e-mail so one customer's key can never collide with / reveal another's order.
    const storedKey = ctx.idempotencyKey ? `${input.contactEmail}|${ctx.idempotencyKey}` : null;

    const run = () =>
      prisma.$transaction(
        async (tx) => {
          if (storedKey) {
            const existing = await tx.order.findUnique({ where: { idempotencyKey: storedKey }, include: orderInclude });
            if (existing) return { order: existing, replayed: true };
          } else {
            // No key supplied: serialise identical submissions (double click) and de-duplicate them.
            const lockKey = `${input.contactEmail}|${input.eventDate.toISOString()}|${input.guests}|${total}`;
            await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;
            const recent = await tx.order.findFirst({
              where: {
                contactEmail: input.contactEmail,
                eventDate: input.eventDate,
                guests: input.guests,
                total,
                createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) }
              },
              orderBy: { createdAt: 'desc' },
              include: orderInclude
            });
            if (recent) return { order: recent, replayed: true };
          }

          const ids = [...wanted.keys()];
          const products = ids.length
            ? await tx.product.findMany({
                where: { id: { in: ids } },
                select: { id: true, name: true, price: true, available: true, minOrderQuantity: true }
              })
            : [];
          const byId = new Map(products.map((p) => [p.id, p]));

          const lines: Array<{ productId: number; quantity: number; price: number; name: string }> = [];
          for (const [productId, quantity] of wanted) {
            const product = byId.get(productId);
            if (!product) throw new AppError(`Product not found: ${productId}`, 404);
            if (!product.available) throw new AppError(`Product is not available: ${product.name}`, 400);
            const minQuantity = Math.max(1, product.minOrderQuantity ?? 1);
            if (quantity < minQuantity) {
              throw new AppError(`Minimum quantity for product ${productId} is ${minQuantity}`, 400);
            }
            lines.push({ productId, quantity, price: product.price, name: product.name });
          }

          if (input.serviceId !== undefined) {
            const service = await tx.service.findUnique({
              where: { id: input.serviceId },
              select: { id: true, isActive: true }
            });
            if (!service) throw new AppError('Service not found', 404);
            if (!service.isActive) throw new AppError('Service is not active', 400);
          }

          const order = await tx.order.create({
            data: {
              userId: ctx.userId,
              serviceId: input.serviceId ?? null,
              clientName: input.clientName,
              contactEmail: input.contactEmail,
              phone: input.phone,
              eventType: input.eventType || input.serviceType || input.businessType || 'Custom Event',
              eventDate: input.eventDate,
              eventTime: input.eventTime || 'TBD',
              guests: input.guests,
              location: input.location || input.postalCode || 'Not provided',
              specialRequests: input.specialRequests,
              businessType: input.businessType,
              serviceType: input.serviceType,
              postalCode: input.postalCode,
              street: input.street,
              houseNumber: input.houseNumber,
              city: input.city,
              subtotal,
              serviceFee,
              total,
              status: 'PENDING',
              paymentStatus: 'PENDING',
              idempotencyKey: storedKey,
              items: { create: lines }
            },
            include: orderInclude
          });
          return { order, replayed: false };
        },
        { maxWait: 5000, timeout: 15000 }
      );

    try {
      return await run();
    } catch (error) {
      // Lost the race against a concurrent request with the same idempotency key.
      if (storedKey && error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await prisma.order.findUnique({ where: { idempotencyKey: storedKey }, include: orderInclude });
        if (existing) return { order: existing, replayed: true };
      }
      throw error;
    }
  },

  /** Returns the order created by an earlier request with this key (same e-mail), if any. */
  async findByIdempotencyKey(contactEmail: string, key: string) {
    return withRetry(() =>
      prisma.order.findUnique({
        where: { idempotencyKey: `${contactEmail.trim().toLowerCase()}|${key}` },
        include: orderInclude
      })
    );
  },

  async getOrders(filters?: {
    userId?: number;
    status?: OrderStatus;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
    take?: number;
    skip?: number;
    withTotal?: boolean;
  }) {
    const where: Prisma.OrderWhereInput = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.eventDate = {};
      if (filters.dateFrom) where.eventDate.gte = filters.dateFrom;
      if (filters.dateTo) where.eventDate.lte = filters.dateTo;
    }

    if (filters?.search) {
      where.OR = [
        { clientName: { contains: filters.search, mode: 'insensitive' } },
        { contactEmail: { contains: filters.search, mode: 'insensitive' } },
        { id: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const take = Math.min(filters?.take ?? 200, 200);
    const [orders, total] = await Promise.all([
      withRetry(() =>
        prisma.order.findMany({
          where,
          include: orderInclude,
          // id as tie-breaker keeps pages stable
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take,
          skip: filters?.skip ?? 0
        })
      ),
      filters?.withTotal ? withRetry(() => prisma.order.count({ where })) : Promise.resolve(undefined)
    ]);

    return { orders, total };
  },

  async getOrderById(id: string, userId?: number) {
    const where: any = { id };
    if (userId) {
      where.userId = userId;
    }

    const order = await prisma.order.findFirst({
      where,
      include: {
        items: true,
        service: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      }
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    return order;
  },

  async updateOrderStatus(id: string, status: OrderStatus, cancellationReason?: string) {
    const safeStatus = status?.toString().toUpperCase() as OrderStatus;
    const trimmedReason = String(cancellationReason || '').trim();
    const order = await prisma.order.update({
      where: { id },
      data: {
        status: safeStatus,
        ...(safeStatus === 'CANCELLED'
          ? {
              cancellationReason: trimmedReason || null,
              paymentStatus: 'REFUNDED' as PaymentStatus
            }
          : safeStatus === 'CONFIRMED_PAID'
          ? { cancellationReason: null, paymentStatus: 'PAID' as PaymentStatus }
          : safeStatus === 'CONFIRMED_UNPAID'
          ? { cancellationReason: null, paymentStatus: 'PENDING' as PaymentStatus }
          : { cancellationReason: null })
      },
      include: {
        items: true
      }
    });

    return order;
  },

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus) {
    const order = await prisma.order.update({
      where: { id },
      data: { paymentStatus },
      include: {
        items: true
      }
    });

    return order;
  },

  async deleteOrder(id: string) {
    const existing = await prisma.order.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      throw new AppError('Order not found', 404);
    }

    await prisma.$transaction([
      prisma.orderItem.deleteMany({ where: { orderId: id } }),
      prisma.order.delete({ where: { id } })
    ]);

    return { deletedOrderId: id };
  },

  async deleteAllOrders() {
    const [items, orders] = await prisma.$transaction([
      prisma.orderItem.deleteMany({}),
      prisma.order.deleteMany({})
    ]);

    return {
      deletedOrders: orders.count,
      deletedOrderItems: items.count
    };
  }
};
