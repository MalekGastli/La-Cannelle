import '../src/env';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { PrismaClient } from '@prisma/client';

type ColumnMeta = {
  name: string;
  dataType: string;
  columnType: string;
  isNullable: boolean;
  columnDefault: string | null;
  extra: string;
};

function getFlagValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  if (!value || value.startsWith('-')) return undefined;
  return value;
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function getFirstPositionalArg(): string | undefined {
  for (const arg of process.argv.slice(2)) {
    if (!arg.startsWith('-')) return arg;
  }
  return undefined;
}

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let start = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let escaped = false;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (inSingleQuote) {
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === "'") {
        if (sql[i + 1] === "'") {
          i++;
          continue;
        }
        inSingleQuote = false;
      }
      continue;
    }

    if (inDoubleQuote) {
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        if (sql[i + 1] === '"') {
          i++;
          continue;
        }
        inDoubleQuote = false;
      }
      continue;
    }

    if (inBacktick) {
      if (ch === '`') inBacktick = false;
      continue;
    }

    if (ch === "'") {
      inSingleQuote = true;
      continue;
    }
    if (ch === '"') {
      inDoubleQuote = true;
      continue;
    }
    if (ch === '`') {
      inBacktick = true;
      continue;
    }

    if (ch === ';') {
      const statement = sql.slice(start, i).trim();
      if (statement) statements.push(statement);
      start = i + 1;
    }
  }

  const tail = sql.slice(start).trim();
  if (tail) statements.push(tail);
  return statements;
}

function parseValuesTuples(valuesText: string): string[] {
  const tuples: string[] = [];
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escaped = false;
  let depth = 0;
  let tupleStart = -1;

  for (let i = 0; i < valuesText.length; i++) {
    const ch = valuesText[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (inSingleQuote) {
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === "'") {
        if (valuesText[i + 1] === "'") {
          i++;
          continue;
        }
        inSingleQuote = false;
      }
      continue;
    }

    if (inDoubleQuote) {
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        if (valuesText[i + 1] === '"') {
          i++;
          continue;
        }
        inDoubleQuote = false;
      }
      continue;
    }

    if (ch === "'") {
      inSingleQuote = true;
      continue;
    }
    if (ch === '"') {
      inDoubleQuote = true;
      continue;
    }

    if (ch === '(') {
      if (depth === 0) tupleStart = i + 1;
      depth++;
      continue;
    }

    if (ch === ')') {
      depth--;
      if (depth === 0 && tupleStart !== -1) {
        tuples.push(valuesText.slice(tupleStart, i));
        tupleStart = -1;
      }
      continue;
    }
  }

  return tuples;
}

function splitTupleValues(tupleBody: string): string[] {
  const values: string[] = [];
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escaped = false;
  let parenDepth = 0;
  let start = 0;

  for (let i = 0; i < tupleBody.length; i++) {
    const ch = tupleBody[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (inSingleQuote) {
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === "'") {
        if (tupleBody[i + 1] === "'") {
          i++;
          continue;
        }
        inSingleQuote = false;
      }
      continue;
    }

    if (inDoubleQuote) {
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        if (tupleBody[i + 1] === '"') {
          i++;
          continue;
        }
        inDoubleQuote = false;
      }
      continue;
    }

    if (ch === "'") {
      inSingleQuote = true;
      continue;
    }
    if (ch === '"') {
      inDoubleQuote = true;
      continue;
    }

    if (ch === '(') {
      parenDepth++;
      continue;
    }

    if (ch === ')') {
      parenDepth = Math.max(0, parenDepth - 1);
      continue;
    }

    if (ch === ',' && parenDepth === 0) {
      values.push(tupleBody.slice(start, i).trim());
      start = i + 1;
    }
  }

  values.push(tupleBody.slice(start).trim());
  return values;
}

function placeholderForColumn(column: ColumnMeta): string {
  if (column.columnDefault !== null) return 'DEFAULT';
  if (column.isNullable) return 'NULL';
  if (column.extra.toLowerCase().includes('auto_increment')) return 'NULL';

  const type = column.dataType.toLowerCase();
  const rawColumnType = column.columnType;
  if (rawColumnType.toLowerCase().startsWith('enum(')) {
    const allowed: string[] = [];
    const re = /'((?:\\'|''|[^'])*)'/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(rawColumnType))) {
      allowed.push(match[1].replace(/\\'/g, "'").replace(/''/g, "'"));
    }
    const first = allowed[0];
    if (first) return `'${first.replace(/'/g, "\\'")}'`;
  }
  if (type === 'json') return "'{}'";
  if (type.includes('int') || type === 'decimal' || type === 'float' || type === 'double') return '0';
  if (type === 'boolean' || type === 'bool' || type === 'bit') return '0';
  if (type === 'date' || type === 'datetime' || type === 'timestamp') return 'CURRENT_TIMESTAMP';
  if (type === 'time') return "'00:00:00'";
  return "''";
}

function isCompatibleValue(column: ColumnMeta, rawValue: string): boolean {
  const value = rawValue.trim();
  const upper = value.toUpperCase();

  if (upper === 'DEFAULT') return true;
  if (upper === 'NULL') return column.isNullable || column.columnDefault !== null || column.extra.toLowerCase().includes('auto_increment');

  const dataType = column.dataType.toLowerCase();
  const columnType = column.columnType.toLowerCase();

  const isQuotedString = value.startsWith("'") && value.endsWith("'");
  const isNumberLiteral = /^-?\d+(\.\d+)?$/.test(value);

  if (columnType.startsWith('enum(')) {
    if (!isQuotedString) return false;
    const allowed: string[] = [];
    const re = /'((?:\\'|''|[^'])*)'/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(columnType))) {
      allowed.push(match[1].replace(/\\'/g, "'").replace(/''/g, "'"));
    }
    const raw = value.slice(1, -1).replace(/\\'/g, "'").replace(/''/g, "'");
    return allowed.some((v) => v.toUpperCase() === raw.toUpperCase());
  }
  if (dataType === 'json') {
    if (!isQuotedString) return false;
    const inner = value.slice(1, -1).trimStart();
    const firstMeaningful = inner.replace(/^\\+/, '').trimStart().slice(0, 1).toLowerCase();
    return ['{', '[', '"', '-', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 't', 'f', 'n'].includes(firstMeaningful);
  }

  if (dataType === 'boolean' || dataType === 'bool' || dataType === 'bit' || dataType === 'tinyint') {
    return value === '0' || value === '1' || upper === 'TRUE' || upper === 'FALSE' || isNumberLiteral;
  }

  if (dataType.includes('int') || dataType === 'decimal' || dataType === 'float' || dataType === 'double') {
    return isNumberLiteral;
  }

  if (dataType === 'date') return isQuotedString && /^'\d{4}-\d{2}-\d{2}/.test(value);
  if (dataType === 'datetime' || dataType === 'timestamp') {
    return isQuotedString && /^'\d{4}-\d{2}-\d{2}/.test(value);
  }
  if (dataType === 'time') return isQuotedString;

  return isQuotedString;
}

function computeBestMapping(columns: ColumnMeta[], values: string[]): Array<number | null> {
  const n = columns.length;
  const m = values.length;

  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(-Infinity));
  const prev: Array<Array<{ pi: number; pj: number; action: 'match' | 'skipCol' | 'skipVal' } | null>> =
    Array.from({ length: n + 1 }, () => Array(m + 1).fill(null));

  dp[0][0] = 0;

  const skipValuePenalty = 1;

  function matchScoreFor(column: ColumnMeta, rawValue: string): number {
    const value = rawValue.trim();
    const upper = value.toUpperCase();
    if (upper === 'DEFAULT') return 2;
    if (upper === 'NULL') return column.isNullable ? 2 : 0;

    const dataType = column.dataType.toLowerCase();
    const columnType = column.columnType.toLowerCase();

    if (columnType.startsWith('enum(')) return 12;
    if (dataType === 'json') return 10;
    if (dataType === 'datetime' || dataType === 'timestamp' || dataType === 'date') return 10;
    if (dataType.includes('int') || dataType === 'decimal' || dataType === 'float' || dataType === 'double') return 8;
    if (dataType === 'boolean' || dataType === 'bool' || dataType === 'bit' || dataType === 'tinyint') return 6;
    return 3;
  }

  function skipColumnPenaltyFor(column: ColumnMeta): number {
    const required = !column.isNullable && column.columnDefault === null && !column.extra.toLowerCase().includes('auto_increment');
    return required ? 8 : 0.6;
  }

  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= m; j++) {
      const score = dp[i][j];
      if (!Number.isFinite(score)) continue;

      if (i < n && j < m && isCompatibleValue(columns[i], values[j])) {
        const nextScore = score + matchScoreFor(columns[i], values[j]);
        if (nextScore > dp[i + 1][j + 1]) {
          dp[i + 1][j + 1] = nextScore;
          prev[i + 1][j + 1] = { pi: i, pj: j, action: 'match' };
        }
      }

      if (i < n) {
        const nextScore = score - skipColumnPenaltyFor(columns[i]);
        if (nextScore > dp[i + 1][j]) {
          dp[i + 1][j] = nextScore;
          prev[i + 1][j] = { pi: i, pj: j, action: 'skipCol' };
        }
      }

      if (j < m) {
        const nextScore = score - skipValuePenalty;
        if (nextScore > dp[i][j + 1]) {
          dp[i][j + 1] = nextScore;
          prev[i][j + 1] = { pi: i, pj: j, action: 'skipVal' };
        }
      }
    }
  }

  let bestJ = 0;
  let bestScore = -Infinity;
  for (let j = 0; j <= m; j++) {
    if (dp[n][j] > bestScore) {
      bestScore = dp[n][j];
      bestJ = j;
    }
  }

  const mapping: Array<number | null> = Array(n).fill(null);
  let i = n;
  let j = bestJ;

  while (i > 0 || j > 0) {
    const step = prev[i][j];
    if (!step) break;

    if (step.action === 'match') {
      mapping[i - 1] = j - 1;
    } else if (step.action === 'skipCol') {
      mapping[i - 1] = null;
    }

    i = step.pi;
    j = step.pj;
  }

  return mapping;
}

function shouldDropStatement(statement: string): boolean {
  const trimmed = statement.trim();
  const upper = trimmed.toUpperCase();
  if (upper.startsWith('LOCK TABLES')) return true;
  if (upper.startsWith('UNLOCK TABLES')) return true;
  if (upper.startsWith('DROP TABLE')) return true;
  if (upper.startsWith('TRUNCATE')) return true;
  if (upper.startsWith('CREATE TABLE')) return true;
  if (upper.startsWith('ALTER TABLE')) return true;
  if (upper.startsWith('SET ')) return true;
  return false;
}

function parseInsertStatement(statement: string): {
  table: string;
  columnListRaw?: string;
  valuesText: string;
} | null {
  const match = statement.match(
    /^INSERT\s+INTO\s+`?([A-Za-z0-9_]+)`?\s*(\([^)]*\))?\s*VALUES\s+/i,
  );
  if (!match) return null;
  const table = match[1];
  const columnListRaw = match[2] || undefined;
  const valuesText = statement.slice(match[0].length).trim();
  return { table, columnListRaw, valuesText };
}

async function main() {
  const schemaPath = path.resolve(__dirname, 'schema.prisma');
  const defaultSqlPath = path.resolve(__dirname, '../../backup.sql');

  const sqlPath =
    process.env.BACKUP_SQL_PATH ||
    getFlagValue('--file') ||
    getFirstPositionalArg() ||
    defaultSqlPath;

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Prisma schema not found at: ${schemaPath}`);
  }

  if (!fs.existsSync(sqlPath)) {
    throw new Error(
      `SQL backup file not found at: ${sqlPath}\n` +
        `Provide a path via \`BACKUP_SQL_PATH\` or \`--file <path>\`.`,
    );
  }

  const truncateBeforeInsert = hasFlag('--truncate') || hasFlag('--reset');
  const dryRun = hasFlag('--dry-run');
  const outPath = getFlagValue('--out');

  const prismaCliPath = require.resolve('prisma/build/index.js');

  const originalSql = fs.readFileSync(sqlPath, 'utf8');
  const sanitizedSqlLines = originalSql.split(/\r?\n/).filter((line) => {
    if (line.includes('SET character_set_client = @saved_cs_client')) return false;
    return true;
  });
  const sanitizedSql = sanitizedSqlLines.join('\n');

  const prisma = new PrismaClient();

  const columnRows = (await prisma.$queryRaw`
    SELECT
      TABLE_NAME as tableName,
      COLUMN_NAME as columnName,
      DATA_TYPE as dataType,
      COLUMN_TYPE as columnType,
      IS_NULLABLE as isNullable,
      COLUMN_DEFAULT as columnDefault,
      EXTRA as extra,
      ORDINAL_POSITION as ordinalPosition
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    ORDER BY TABLE_NAME, ORDINAL_POSITION;
  `) as Array<{
    tableName: string;
    columnName: string;
    dataType: string;
    columnType: string;
    isNullable: 'YES' | 'NO';
    columnDefault: string | null;
    extra: string;
    ordinalPosition: number;
  }>;

  const tableColumns = new Map<string, ColumnMeta[]>();
  for (const row of columnRows) {
    const key = row.tableName;
    const list = tableColumns.get(key) ?? [];
    list.push({
      name: row.columnName,
      dataType: row.dataType,
      columnType: row.columnType,
      isNullable: row.isNullable === 'YES',
      columnDefault: row.columnDefault,
      extra: row.extra ?? '',
    });
    tableColumns.set(key, list);
  }

  const statements = splitSqlStatements(sanitizedSql);
  const rewrittenStatements: string[] = [];
  const tablesInDump: string[] = [];

  for (const statement of statements) {
    if (!statement.trim()) continue;
    if (shouldDropStatement(statement)) continue;

    const insert = parseInsertStatement(statement);
    if (!insert) continue;

    const columns = tableColumns.get(insert.table);
    if (!columns || columns.length === 0) {
      console.warn(`Skipping unknown table (not in current schema): ${insert.table}`);
      continue;
    }

    tablesInDump.push(insert.table);

    const tupleBodies = parseValuesTuples(insert.valuesText);
    if (tupleBodies.length === 0) continue;

    const rewrittenTuples: string[] = [];

    if (insert.columnListRaw !== undefined) {
      const desiredColumns = insert.columnListRaw
        .replace(/^\(/, '')
        .replace(/\)$/, '')
        .split(',')
        .map((c) => c.trim().replace(/^`/, '').replace(/`$/, ''));

      const desiredMeta: ColumnMeta[] = desiredColumns.map((name) => {
        return (
          columns.find((c) => c.name === name) ?? {
            name,
            dataType: 'text',
            columnType: 'text',
            isNullable: true,
            columnDefault: null,
            extra: '',
          }
        );
      });

      for (const tupleBody of tupleBodies) {
        const rowValues = splitTupleValues(tupleBody);
        const desiredCount = desiredMeta.length;
        const rewritten = rowValues.slice(0, desiredCount);

        for (let i = rewritten.length; i < desiredCount; i++) {
          rewritten.push(placeholderForColumn(desiredMeta[i]));
        }

        rewrittenTuples.push(`(${rewritten.join(',')})`);
      }

      rewrittenStatements.push(
        `INSERT INTO \`${insert.table}\` ${insert.columnListRaw} VALUES ${rewrittenTuples.join(',')};`,
      );
      continue;
    }

    const firstRowValues = splitTupleValues(tupleBodies[0]);
    const mapping = computeBestMapping(columns, firstRowValues);

    for (const tupleBody of tupleBodies) {
      const rowValues = splitTupleValues(tupleBody);
      const rewritten = columns.map((column, index) => {
        const valueIndex = mapping[index];
        if (typeof valueIndex === 'number' && valueIndex >= 0 && valueIndex < rowValues.length) {
          return rowValues[valueIndex];
        }
        return placeholderForColumn(column);
      });

      rewrittenTuples.push(`(${rewritten.join(',')})`);
    }

    rewrittenStatements.push(`INSERT INTO \`${insert.table}\` VALUES ${rewrittenTuples.join(',')};`);
  }

  const uniqueTables = Array.from(new Set(tablesInDump));
  const finalSqlParts: string[] = ['SET FOREIGN_KEY_CHECKS=0;'];

  if (truncateBeforeInsert) {
    for (const table of uniqueTables) {
      finalSqlParts.push(`TRUNCATE TABLE \`${table}\`;`);
    }
  }

  finalSqlParts.push(...rewrittenStatements);
  finalSqlParts.push('SET FOREIGN_KEY_CHECKS=1;');

  const finalSql = finalSqlParts.join('\n');

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'la-cannelle-seed-'));
  const tempSqlPath = outPath ? path.resolve(outPath) : path.join(tempDir, path.basename(sqlPath));
  fs.writeFileSync(tempSqlPath, finalSql, 'utf8');

  if (sanitizedSqlLines.length !== originalSql.split(/\r?\n/).length) {
    console.log('Note: sanitized SQL dump to remove incompatible session directives.');
  }

  console.log(`Restoring MySQL data from: ${sqlPath}`);
  console.log(`Rewritten SQL file: ${tempSqlPath}`);
  console.log(`Using Prisma schema: ${schemaPath}`);

  try {
    if (dryRun) {
      console.log('Dry run enabled; skipping execution.');
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const child = spawn(
        process.execPath,
        [prismaCliPath, 'db', 'execute', '--schema', schemaPath, '--file', tempSqlPath],
        {
          stdio: 'inherit',
          env: process.env,
        },
      );

      child.on('error', reject);
      child.on('exit', (code) => {
        if (code === 0) resolve();
        reject(new Error(`Restore failed (exit code ${code ?? 'unknown'})`));
      });
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
