import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { productService } from '../services/productService';
import { AppError } from '../middleware/errorHandler';
import { sendCachedJson } from '../utils/httpCache';
import { isStaffRequest, parsePaging } from '../utils/requestContext';

export const productController = {
  async getProducts(req: AuthRequest, res: Response) {
    const { category, available, search, menuId } = req.query;

    const filters: any = { ...parsePaging(req.query) };
    if (category) filters.category = String(category);
    if (available !== undefined) filters.available = available === 'true';
    if (search) filters.search = String(search);
    if (menuId) {
      const parsed = parseInt(menuId as string, 10);
      if (Number.isFinite(parsed)) filters.menuId = parsed;
    }

    // Production cost is internal data: only team members receive it. Team members also skip the in-memory cache.
    const staff = isStaffRequest(req);
    const products = await productService.getProducts(filters, { includeCost: staff, bypassCache: staff });
    sendCachedJson(req, res, products);
  },

  async getProductById(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const staff = isStaffRequest(req);
    const product = await productService.getProductById(parseInt(id, 10), { includeCost: staff, bypassCache: staff });
    sendCachedJson(req, res, product);
  },

  async createProduct(req: AuthRequest, res: Response) {
    const product = await productService.createProduct(req.body);
    res.status(201).json(product);
  },

  async updateProduct(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const product = await productService.updateProduct(parseInt(id, 10), req.body);
    res.json(product);
  },

  async bulkUpdate(req: AuthRequest, res: Response) {
    res.json(await productService.bulkUpdate(req.body || {}));
  },

  async duplicateProduct(req: AuthRequest, res: Response) {
    const product = await productService.duplicateProduct(parseInt(req.params.id, 10));
    res.status(201).json(product);
  },

  async bulkDelete(req: AuthRequest, res: Response) {
    const ids: number[] = Array.isArray(req.body?.ids) ? req.body.ids.map(Number).filter(Number.isInteger) : [];
    if (ids.length > 500) throw new AppError('Too many products selected (max 500)', 400);
    const { deleted, archived } = await productService.deleteProducts(ids);
    res.json({ deleted, archived });
  },

  async deleteProduct(req: AuthRequest, res: Response) {
    const { id } = req.params;
    try {
      const result = await productService.deleteProduct(parseInt(id, 10));
      res.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Failed to delete product', error);
      return res.status(500).json({ error: 'Unable to delete product' });
    }
  }
};
