import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** Liveness probe for the Docker HEALTHCHECK (no database access on purpose). */
export function GET() {
  return NextResponse.json({ status: 'ok' })
}
