export type SqlValue = string | null;

const isEscaped = (text: string, index: number) => {
  let backslashes = 0;
  for (let i = index - 1; i >= 0 && text[i] === '\\'; i -= 1) {
    backslashes += 1;
  }
  return backslashes % 2 === 1;
};

const unescapeSqlString = (value: string) => {
  // value includes surrounding single quotes
  const inner = value.slice(1, -1);
  return inner
    .replace(/\\0/g, '\0')
    .replace(/\\b/g, '\b')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\Z/g, '\x1a')
    .replace(/\\\\/g, '\\')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'");
};

const splitTuples = (valuesText: string) => {
  const tuples: string[] = [];
  let inString = false;
  let depth = 0;
  let start = -1;

  for (let i = 0; i < valuesText.length; i += 1) {
    const ch = valuesText[i];
    if (ch === "'" && !isEscaped(valuesText, i)) {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '(') {
      if (depth === 0) start = i;
      depth += 1;
      continue;
    }
    if (ch === ')') {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        tuples.push(valuesText.slice(start + 1, i));
        start = -1;
      }
    }
  }

  return tuples;
};

const splitFields = (tupleText: string) => {
  const fields: string[] = [];
  let inString = false;
  let current = '';

  for (let i = 0; i < tupleText.length; i += 1) {
    const ch = tupleText[i];
    if (ch === "'" && !isEscaped(tupleText, i)) {
      inString = !inString;
      current += ch;
      continue;
    }
    if (!inString && ch === ',') {
      fields.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.length) fields.push(current.trim());

  return fields;
};

const findStatementEnd = (sql: string, startIndex: number) => {
  let inString = false;
  for (let i = startIndex; i < sql.length; i += 1) {
    const ch = sql[i];
    if (ch === "'" && !isEscaped(sql, i)) {
      inString = !inString;
      continue;
    }
    if (!inString && ch === ';') {
      return i;
    }
  }
  return -1;
};

export const extractInsertRows = (sql: string, tableName: string): SqlValue[][] => {
  const rows: SqlValue[][] = [];
  const needle = `INSERT INTO \`${tableName}\` VALUES `;
  let cursor = 0;

  while (cursor < sql.length) {
    const start = sql.indexOf(needle, cursor);
    if (start === -1) break;
    const valuesStart = start + needle.length;
    const end = findStatementEnd(sql, valuesStart);
    if (end === -1) break;

    const valuesText = sql.slice(valuesStart, end).trim();
    const tuples = splitTuples(valuesText);
    for (const tuple of tuples) {
      const rawFields = splitFields(tuple);
      const parsed = rawFields.map((token) => {
        if (!token || token.toUpperCase() === 'NULL') return null;
        if (token.startsWith("'") && token.endsWith("'")) return unescapeSqlString(token);
        return token;
      });
      rows.push(parsed);
    }

    cursor = end + 1;
  }

  return rows;
};

