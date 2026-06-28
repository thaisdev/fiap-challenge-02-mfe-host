import type { NextRequest } from 'next/server'

const API_URL = process.env.API_URL

type RouteContext = {
  params: Promise<{ slug: string[] }>
}

const FORWARDED_HEADERS = ['authorization', 'content-type', 'accept']

async function handleProxy(request: NextRequest, slug: string[]): Promise<Response> {
  if (!API_URL) {
    return new Response('Gateway not configured', { status: 502 })
  }

  const pathname = `/${slug.join('/')}`
  const upstreamUrl = new URL(pathname, API_URL)
  upstreamUrl.search = request.nextUrl.search

  const headers = new Headers()
  for (const key of FORWARDED_HEADERS) {
    const value = request.headers.get(key)
    if (value) headers.set(key, value)
  }
  headers.set('accept-encoding', 'identity')

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD'

  try {
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      ...(hasBody ? { body: request.body, duplex: 'half' } : {}),
    } as RequestInit)

    // Node's fetch auto-decompresses gzip/br bodies, so strip encoding headers
    // to prevent the browser from trying to decompress an already-decoded body.
    const HOP_BY_HOP = new Set(['content-encoding', 'transfer-encoding', 'connection', 'keep-alive'])
    const responseHeaders = new Headers()
    for (const [key, value] of upstream.headers.entries()) {
      if (!HOP_BY_HOP.has(key.toLowerCase())) {
        responseHeaders.set(key, value)
      }
    }

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    })
  } catch {
    return new Response('Gateway error', { status: 502 })
  }
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { slug } = await params
  return handleProxy(request, slug)
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { slug } = await params
  return handleProxy(request, slug)
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { slug } = await params
  return handleProxy(request, slug)
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { slug } = await params
  return handleProxy(request, slug)
}
