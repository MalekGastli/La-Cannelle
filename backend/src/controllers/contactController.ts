import { Request, Response } from 'express';
import { z } from 'zod';
import { contactService } from '../services/contactService';

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().or(z.literal('')),
  eventType: z.string().min(1),
  eventDate: z.string().optional().or(z.literal('')),
  guests: z.string().optional().or(z.literal('')),
  message: z.string().min(5),
  language: z.enum(['EN', 'DE']).optional(),
});

export const sendContact = async (req: Request, res: Response) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid contact form data' });
  }

  await contactService.sendContactEmail(parsed.data);
  return res.status(200).json({ message: 'Contact email sent' });
};
