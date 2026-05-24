// Offline sync queue backed by localStorage
// Queued mutations are replayed when the connection is restored.

export interface QueuedRequest {
  id: string
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  url: string
  body?: unknown
  timestamp: number
}

const QUEUE_KEY = 'nt-sync-queue'

function getQueue(): QueuedRequest[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveQueue(queue: QueuedRequest[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function enqueue(req: Omit<QueuedRequest, 'id' | 'timestamp'>) {
  const queue = getQueue()
  queue.push({ ...req, id: crypto.randomUUID(), timestamp: Date.now() })
  saveQueue(queue)
}

export function dequeue(id: string) {
  saveQueue(getQueue().filter((r) => r.id !== id))
}

export function getQueueLength(): number {
  return getQueue().length
}

export async function flushQueue(apiFn: (req: QueuedRequest) => Promise<void>) {
  const queue = getQueue()
  if (queue.length === 0) return { synced: 0, failed: 0 }

  let synced = 0
  let failed = 0

  for (const req of queue) {
    try {
      await apiFn(req)
      dequeue(req.id)
      synced++
    } catch {
      failed++
    }
  }

  return { synced, failed }
}
