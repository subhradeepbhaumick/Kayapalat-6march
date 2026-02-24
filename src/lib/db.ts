// File: src/lib/db.ts
import mysql from 'mysql2/promise';

// Main connection pool
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Reusable slug generator
export function generateSlug(title: string): string {
  const timestamp = Date.now();
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// The primary function to execute all queries
export async function executeQuery<T = any>(
  query: string,
  params: any[] = [],
  existingConnection?: mysql.PoolConnection
): Promise<[T[], mysql.OkPacket]> {
  const connection = existingConnection || await pool.getConnection();

  try {
    const upperCaseQuery = query.toUpperCase();
    const trimmedQuery = upperCaseQuery.trim().replace(/;$/, '');

    const isSelect = trimmedQuery.startsWith('SELECT');
    const isTransactionCommand = ['START TRANSACTION', 'COMMIT', 'ROLLBACK'].includes(trimmedQuery);
    const isBulkInsert = upperCaseQuery.includes('VALUES ?');

    // ✅ Ensure params are safe
    const safeParams = params.map(p => (typeof p === "boolean" ? Number(p) : p));

    let results, fields;
    if (isSelect || isTransactionCommand || isBulkInsert) {
      [results, fields] = await connection.query(query, safeParams);
    } else {
      [results, fields] = await connection.execute(query, safeParams);
    }
    return [results as T[], fields as unknown as mysql.OkPacket];
  } catch (error: any) {
    console.error('Database query error:', {
      message: error.message,
      code: error.code,
      query: query,
      params: params,
    });
    throw error;
  } finally {
    if (!existingConnection && connection) {
      connection.release();
    }
  }
}

// Wrapper for simple queries
export const db = {
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const [results] = await executeQuery<T>(sql, params);
    return results;
  }
};

export function sanitizeContentLinks(htmlContent: string): string {
  if (!htmlContent) return '';
  return htmlContent.replace(
    /href="(?!(https?:\/\/|mailto:|tel:))([^"]+)"/g,
    (match, protocol, url) => url.startsWith('/') ? match : `href="https://${url}"`
  );
}

export const query = async (...args: unknown[]) => {
  if (typeof pool !== 'undefined' && typeof (pool as any).query === 'function') {
    // @ts-ignore
    return await (pool as any).query(...args);
  }
  throw new Error('Database pool is not available.');
};

export default { query, pool };
