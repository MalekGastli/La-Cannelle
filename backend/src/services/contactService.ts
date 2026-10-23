import nodemailer from 'nodemailer';
import { AppError } from '../middleware/errorHandler';

type ContactPayload = {
  name: string;
  email: string;
  phone?: string;
  eventType: string;
  eventDate?: string;
  guests?: string;
  message: string;
  language?: 'EN' | 'DE';
};

const getEnv = (key: string, fallback?: string) => process.env[key] ?? fallback;

const getTransporter = () => {
  const host = getEnv('SMTP_HOST', 'smtp.sendgrid.net');
  const port = Number(getEnv('SMTP_PORT', '587'));
  const user = getEnv('SMTP_USER', 'apikey');
  const pass = getEnv('SMTP_PASS');

  if (!pass) {
    throw new AppError('SMTP_PASS is not configured', 500);
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

const formatField = (label: string, value?: string) => (value ? `${label}: ${value}` : `${label}: -`);

const buildAdminText = (payload: ContactPayload) => [
  'New contact form submission',
  '',
  formatField('Name', payload.name),
  formatField('Email', payload.email),
  formatField('Phone', payload.phone),
  formatField('Event Type', payload.eventType),
  formatField('Event Date', payload.eventDate),
  formatField('Guests', payload.guests),
  '',
  'Message:',
  payload.message,
].join('\n');

const buildAdminHtml = (payload: ContactPayload) => `
  <h2>New contact form submission</h2>
  <ul>
    <li><strong>Name:</strong> ${payload.name}</li>
    <li><strong>Email:</strong> ${payload.email}</li>
    <li><strong>Phone:</strong> ${payload.phone || '-'}</li>
    <li><strong>Event Type:</strong> ${payload.eventType}</li>
    <li><strong>Event Date:</strong> ${payload.eventDate || '-'}</li>
    <li><strong>Guests:</strong> ${payload.guests || '-'}</li>
  </ul>
  <h3>Message</h3>
  <p style="white-space: pre-wrap;">${payload.message}</p>
`;

const buildAutoReply = (payload: ContactPayload) => {
  const isDe = payload.language === 'DE';
  const subject = isDe
    ? 'Wir haben Ihre Nachricht erhalten'
    : 'We received your message';
  const greeting = isDe ? `Hallo ${payload.name},` : `Hi ${payload.name},`;
  const body = isDe
    ? 'vielen Dank fuer Ihre Nachricht an La Cannelle. Wir haben Ihre Anfrage erhalten und melden uns so schnell wie moeglich bei Ihnen.'
    : 'thanks for contacting La Cannelle. We received your message and will reply as soon as possible.';
  const closing = isDe
    ? 'Wenn es dringend ist, rufen Sie uns bitte unter +49 2133 978 2992 an.'
    : 'If this is urgent, please call us at +49 2133 978 2992.';

  return {
    subject,
    text: `${greeting}\n\n${body}\n\n${closing}\n\nLa Cannelle Catering`,
    html: `<p>${greeting}</p><p>${body}</p><p>${closing}</p><p>La Cannelle Catering</p>`,
  };
};

export const contactService = {
  async sendContactEmail(payload: ContactPayload) {
    const receiver = getEnv('CONTACT_RECEIVER', 'bouzidioussema16@gmail.com');
    const from = getEnv('SMTP_FROM', 'La Cannelle <no-reply@la-cannelle.com>');
    const transporter = getTransporter();

    await transporter.sendMail({
      from,
      to: receiver,
      replyTo: payload.email,
      subject: `New contact form submission - ${payload.name}`,
      text: buildAdminText(payload),
      html: buildAdminHtml(payload),
    });

    const autoReply = buildAutoReply(payload);
    await transporter.sendMail({
      from,
      to: payload.email,
      subject: autoReply.subject,
      text: autoReply.text,
      html: autoReply.html,
    });
  },
};
