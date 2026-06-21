import { put, del } from '@vercel/blob'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import type { NextRequest } from 'next/server'

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN
const LOCAL_UPLOADS_DIR = join(process.cwd(), 'public', 'uploads')

async function ensureUploadsDir() {
  await mkdir(LOCAL_UPLOADS_DIR, { recursive: true })
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

  await ensureUploadsDir()
  const uniqueName = `${Date.now()}-${file.name}`
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(join(LOCAL_UPLOADS_DIR, uniqueName), buffer)
  return Response.json({ url: `/uploads/${uniqueName}`, filename: file.name })
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

  const filename = url.split('/uploads/').pop()
  if (filename) {
    await unlink(join(LOCAL_UPLOADS_DIR, filename)).catch(() => null)
  }
  return new Response(null, { status: 204 })
}
