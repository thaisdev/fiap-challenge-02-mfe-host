import { put, del } from '@vercel/blob'
import { writeFile, mkdir, unlink, readFile } from 'fs/promises'
import { join, resolve, sep } from 'path'
import type { NextRequest } from 'next/server'

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN

const MIME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
}

function getUploadsDir(): string {
  return process.env.UPLOADS_DIR ?? join(process.cwd(), 'uploads')
}

async function ensureUploadsDir(dir: string) {
  await mkdir(dir, { recursive: true })
}

function safeLocalPath(uploadsDir: string, filename: string): string | null {
  const filePath = resolve(join(uploadsDir, filename))
  const uploadsPrefix = uploadsDir.endsWith(sep) ? uploadsDir : uploadsDir + sep
  return filePath.startsWith(uploadsPrefix) ? filePath : null
}

export async function GET(request: NextRequest): Promise<Response> {
  if (BLOB_TOKEN) {
    return Response.json({ error: 'Não disponível.' }, { status: 404 })
  }

  const filename = request.nextUrl.searchParams.get('file')
  if (!filename) {
    return Response.json({ error: 'Arquivo inválido.' }, { status: 400 })
  }

  const uploadsDir = getUploadsDir()
  const filePath = safeLocalPath(uploadsDir, filename)

  if (!filePath) {
    return Response.json({ error: 'Arquivo inválido.' }, { status: 400 })
  }

  const buffer = await readFile(filePath).catch(() => null)

  if (!buffer) {
    return Response.json({ error: 'Arquivo não encontrado.' }, { status: 404 })
  }

  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const contentType = MIME_TYPES[ext] ?? 'application/octet-stream'

  return new Response(buffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': 'inline',
    },
  })
}

export async function POST(request: NextRequest): Promise<Response> {
  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return Response.json({ error: 'Arquivo não encontrado na requisição.' }, { status: 400 })
  }

  if (BLOB_TOKEN) {
    const blob = await put(file.name, file, { access: 'public', token: BLOB_TOKEN })
    return Response.json({ url: blob.url, pathname: blob.pathname, filename: file.name })
  }

  const uploadsDir = getUploadsDir()
  await ensureUploadsDir(uploadsDir)
  const safeName = file.name.replace(/[/\\:*?"<>|]/g, '_')
  const uniqueName = `${Date.now()}-${safeName}`
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(join(uploadsDir, uniqueName), buffer)
  return Response.json({ url: `/api/blob?file=${encodeURIComponent(uniqueName)}`, filename: file.name })
}

export async function DELETE(request: NextRequest): Promise<Response> {
  const body = (await request.json().catch(() => null)) as { url?: unknown } | null
  const url = body?.url

  if (typeof url !== 'string' || !url) {
    return Response.json({ error: 'URL inválida.' }, { status: 400 })
  }

  if (BLOB_TOKEN) {
    await del(url, { token: BLOB_TOKEN })
    return new Response(null, { status: 204 })
  }

  const filename = new URL(url, 'http://localhost').searchParams.get('file')
  if (filename) {
    const uploadsDir = getUploadsDir()
    const filePath = safeLocalPath(uploadsDir, filename)
    if (filePath) {
      await unlink(filePath).catch(() => null)
    }
  }
  return new Response(null, { status: 204 })
}
