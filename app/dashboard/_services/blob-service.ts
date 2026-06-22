import type { ReceiptFile } from '../_components/interfaces/new-transaction-panel.interfaces'

export async function uploadReceiptFile(file: File, userId?: number | null): Promise<ReceiptFile> {
  const formData = new FormData()
  formData.append('file', file)
  if (userId != null) formData.append('userId', String(userId))

  const response = await fetch('/api/blob', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Falha ao enviar comprovante. Tente novamente.')
  }

  const data = (await response.json()) as { url: string; filename: string }
  return { url: data.url, filename: file.name }
}

export async function deleteReceiptFile(url: string): Promise<void> {
  await fetch('/api/blob', {
    method: 'DELETE',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url }),
  })
}
