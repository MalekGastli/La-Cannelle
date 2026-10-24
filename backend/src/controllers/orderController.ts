import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { orderService, createOrderSchema, normalizeIdempotencyKey } from '../services/orderService';
import { parsePagination, setTotalCount } from '../utils/pagination';
import { systemService } from '../services/systemService';
import { AppError } from '../middleware/errorHandler';
import { clientIp } from '../utils/clientIp';
import { captchaService } from '../services/captchaService';

export const orderController = {
  async createOrder(req: AuthRequest, res: Response) {
    const body = req.body || {};

    // Cheap shape/limit validation first (zod, inside the service) so junk never reaches the
    // DB, captcha provider or the system-status lookups below.
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message || 'Invalid order', 400);
    }
    const idempotencyKey = normalizeIdempotencyKey(req.headers['idempotency-key'] ?? body.idempotencyKey);
    const eventDateObj = parsed.data.eventDate;

    const systemStatus = await systemService.getSystemStatus();
    if (systemStatus?.orderingPaused) {
      return res.status(403).json({ error: 'Ordering is currently paused' });
    }

    const closedDates = await systemService.getClosedDates();
    const eventKey = eventDateObj.toISOString().split('T')[0];
    const isClosed = closedDates.some((d) => {
      const closedKey = new Date(d.date).toISOString().split('T')[0];
      return closedKey === eventKey;
    });
    if (isClosed) {
      return res.status(403).json({ error: 'Selected date is closed for orders' });
    }

    // A replayed request was already captcha-verified the first time; tokens are single use.
    if (idempotencyKey) {
      const replay = await orderService.findByIdempotencyKey(parsed.data.contactEmail, idempotencyKey);
      if (replay) {
        res.setHeader('Idempotent-Replay', 'true');
        return res.status(200).json(replay);
      }
    }

    const ip = clientIp(req);
    await captchaService.verify(body.captchaToken, { ip });

    const { order, replayed } = await orderService.createOrder(body, {
      userId: req.user?.id,
      idempotencyKey
    });

    if (replayed) {
      res.setHeader('Idempotent-Replay', 'true');
      return res.status(200).json(order);
    }
    res.status(201).json(order);
  },

  async getOrders(req: AuthRequest, res: Response) {
    const { status, dateFrom, dateTo, search, customerId, userId } = req.query;

    const filters: any = {};

    // Allow explicit customer/user filter (admin dashboards)
    const requestedUserId = customerId || userId;
    if (requestedUserId) {
      const parsedId = parseInt(requestedUserId as string, 10);
      if (!Number.isNaN(parsedId)) {
        filters.userId = parsedId;
      }
    } else if (req.user && req.user.role === 'CLIENT') {
      // If authenticated client, limit to their orders
      filters.userId = req.user.id;
    }

    if (status) {
      filters.status = status;
    }

    if (dateFrom) {
      filters.dateFrom = new Date(dateFrom as string);
    }

    if (dateTo) {
      filters.dateTo = new Date(dateTo as string);
    }

    if (search) {
      filters.search = String(search).slice(0, 100);
    }

    const page = parsePagination(req.query as Record<string, unknown>);
    const { orders, total } = await orderService.getOrders({
      ...filters,
      take: page.take,
      skip: page.skip,
      withTotal: page.paginated
    });
    if (total !== undefined) setTotalCount(res, total);
    res.json(orders);
  },

  async getOrderById(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const userId = req.user?.role === 'CLIENT' ? req.user.id : undefined;

    const order = await orderService.getOrderById(id, userId);
    res.json(order);
  },

  async updateOrderStatus(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { status, cancellationReason } = req.body;

    if (!status) {
      throw new AppError('Status is required', 400);
    }

    const normalizedStatus = String(status).toUpperCase() as any;
    const order = await orderService.updateOrderStatus(id, normalizedStatus, cancellationReason);
    res.json(order);
  },

  async updatePaymentStatus(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!paymentStatus) {
      throw new AppError('Payment status is required', 400);
    }

    const order = await orderService.updatePaymentStatus(id, paymentStatus);
    res.json(order);
  },

  async deleteOrder(req: AuthRequest, res: Response) {
    const { id } = req.params;
    if (!id) {
      throw new AppError('Order id is required', 400);
    }

    const result = await orderService.deleteOrder(id);
    res.json(result);
  },

  async deleteAllOrders(_req: AuthRequest, res: Response) {
    const result = await orderService.deleteAllOrders();
    res.json(result);
  }
};
