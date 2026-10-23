import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { AppError } from '../middleware/errorHandler';

const DATA_URL_PREFIX = /^data:(image\/[a-zA-Z0-9.+-]+);base64,/;

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

const resolveUploadsDir = () => {
  const configuredUploadsDir = process.env.UPLOAD_DIR?.trim();
  if (configuredUploadsDir) {
    return path.isAbsolute(configuredUploadsDir)
      ? configuredUploadsDir
      : path.resolve(process.cwd(), configuredUploadsDir);
  }

  const isDistBuild = __dirname.split(path.sep).includes('dist');
  const backendRootDir = isDistBuild ? path.resolve(__dirname, '../../..') : path.resolve(__dirname, '../..');
  return path.join(backendRootDir, 'uploads');
};

export const ensureUploadsDir = () => {
  const uploadsDir = resolveUploadsDir();
  fs.mkdirSync(uploadsDir, { recursive: true });
  return uploadsDir;
};

export const isBase64ImageDataUrl = (value: string) => DATA_URL_PREFIX.test(value);

const getMaxUploadBytes = () => {
  const raw = process.env.UPLOAD_MAX_BYTES?.trim();
  if (!raw) return 15 * 1024 * 1024;

  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return 15 * 1024 * 1024;
};

export const storeBase64ImageDataUrl = async (
  dataUrl: string,
  options: { prefix: string; maxBytes?: number }
) => {
  const match = dataUrl.match(DATA_URL_PREFIX);
  if (!match) {
    throw new AppError('Invalid image payload', 400);
  }

  const mime = match[1];
  const ext = EXT_BY_MIME[mime];
  if (!ext) {
    throw new AppError('Unsupported image type', 400);
  }

  const base64 = dataUrl.slice(match[0].length);
  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64, 'base64');
  } catch {
    throw new AppError('Invalid image payload', 400);
  }

  const maxBytes = options.maxBytes ?? getMaxUploadBytes();
  if (buffer.length > maxBytes) {
    throw new AppError('Image too large', 413);
  }

  const uploadsDir = ensureUploadsDir();
  const safePrefix = options.prefix.replace(/[^a-zA-Z0-9_-]+/g, '-') || 'image';
  const filename = `${safePrefix}-${Date.now()}-${crypto.randomUUID()}.${ext}`;
  await fs.promises.writeFile(path.join(uploadsDir, filename), buffer);

  return {
    filename,
    url: `/api/uploads/${filename}`,
    mime,
    bytes: buffer.length,
  };
};

export const normalizeImageValue = async (
  value: string | null | undefined,
  options: { prefix: string; maxBytes?: number }
): Promise<string | null | undefined> => {
  if (value === null || value === undefined) return value;
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (!isBase64ImageDataUrl(trimmed)) return trimmed;
  return (await storeBase64ImageDataUrl(trimmed, options)).url;
};
