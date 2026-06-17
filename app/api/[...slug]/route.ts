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

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD'

  try {
    const response = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      ...(hasBody ? { body: request.body, duplex: 'half' } : {}),
    } as RequestInit)

    return response
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
