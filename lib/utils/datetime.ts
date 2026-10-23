export const formatIsoDate = (value?: string | null) => {
  if (!value) return '';
  const str = String(value);
  const match = str.match(/^\d{4}-\d{2}-\d{2}/);
  if (match) return match[0];
  const parsed = new Date(str);
  if (Number.isFinite(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return str;
};

export const formatIsoDateTime = (value?: string | null) => {
  if (!value) return '';
  const str = String(value);
  const date = formatIsoDate(str);
  const timeMatch = str.match(/T(\d{2}:\d{2})/);
  if (timeMatch) return `${date} ${timeMatch[1]}`;
  return date;
};

export const formatTimeHHmm = (value?: string | null) => {
  if (!value) return '';
  const str = String(value).trim();
  if (!str) return '';
  const isoTimeMatch = str.match(/T(\d{2}:\d{2})/);
  if (isoTimeMatch) return isoTimeMatch[1];
  const plainMatch = str.match(/^(\d{1,2}):(\d{2})/);
  if (plainMatch) {
    const hh = plainMatch[1].padStart(2, '0');
    return `${hh}:${plainMatch[2]}`;
  }
  return str;
};

