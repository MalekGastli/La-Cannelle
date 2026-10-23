import { Request, Response } from 'express';
import { phoneService } from '../services/phoneService';

export const phoneController = {
  async getCountryFlag(req: Request, res: Response) {
    const phoneQuery = typeof req.query.phone === 'string' ? req.query.phone : '';
    const callingCodeQuery = typeof req.query.callingCode === 'string' ? req.query.callingCode : '';
    const input = (callingCodeQuery || phoneQuery || '').trim();

    if (!input) {
      res.status(400).json({ error: 'phone or callingCode query param is required' });
      return;
    }

    const resolved = await phoneService.resolveFromPhoneOrCode(input);
    if (!resolved) {
      res.status(200).json({ callingCode: '', countries: [] });
      return;
    }

    res.json(resolved);
  },
};

