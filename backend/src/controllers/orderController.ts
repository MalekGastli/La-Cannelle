import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { orderService } from '../services/orderService';
import { systemService } from '../services/systemService';
import { AppError } from '../middleware/errorHandler';
import { captchaService } from '../services/captchaService';

export const orderController = {
  async createOrder(req: AuthRequest, res: Response) {
    const {
      clientName,
      contactEmail,
      phone,
      eventType,
      eventDate,
      eventTime,
      guests,
      location,
      specialRequests,
      businessType,
      serviceType,
      serviceId,
      postalCode,
      street,
      houseNumber,
      city,
      captchaToken,
      items,
      subtotal,
      serviceFee,
      total
    } = req.body;

    // Relax validation: only require contact details
    if (!contactEmail || !phone) {
      throw new AppError('Contact email and phone are required', 400);
    }

    const eventDateObj = eventDate ? new Date(eventDate) : new Date();

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

    const ipHeader = (req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || '') as string;
    const ip = ipHeader ? String(ipHeader).split(',')[0].trim() : (req.ip ? String(req.ip) : undefined);
    await captchaService.verify(captchaToken, { ip });

    const order = await orderService.createOrder({
      userId: req.user?.id,
      serviceId: serviceId === '' || serviceId === null || serviceId === undefined ? undefined : parseInt(serviceId, 10),
      clientName: clientName || 'Guest',
      contactEmail,
      phone,
      eventType: eventType || serviceType || businessType || 'Custom Event',
      eventDate: eventDateObj,
      eventTime: eventTime || 'TBD',
      guests: parseInt(guests) || 1,
      location: location || postalCode || 'Not provided',
      specialRequests,
      businessType,
      serviceType,
      postalCode,
      street,
      houseNumber,
      city,
      items: Array.isArray(items) ? items : [],
      subtotal: parseFloat(subtotal) || 0,
      serviceFee: parseFloat(serviceFee) || 0,
      total: parseFloat(total) || 0
    });

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
      filters.search = search as string;
    }

    const orders = await orderService.getOrders(filters);
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
