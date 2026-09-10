import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireOwner } from '@/lib/api-guards';
import { TABLE_NAMES } from '@/lib/db/schema.mjs';

export const dynamic = 'force-dynamic';

/** Full backup: every table as JSON. */
export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  const d = getDb();
  const out: Record<string, any> = { exported_at: new Date().toISOString(), db: d.kind };
  for (const table of TABLE_NAMES) {
    try {
      out[table] = await d.query(`SELECT * FROM ${table}`);
    } catch {
      out[table] = [];
    }
  }
  return new Response(JSON.stringify(out, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="therecipeseeker-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
