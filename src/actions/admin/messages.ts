'use server'

import type { ActionResult } from '@/lib/action-result'
import { runVoid } from '@/lib/admin/run-action'
import { idSchema } from '@/lib/admin/schema-common'
import { messageStatusSchema, type MESSAGE_STATUSES } from '@/lib/admin/schema-content'
import { adminMessagesRepo } from '@/lib/db/repositories/admin-misc'

export async function setMessageStatus(
  id: string,
  status: (typeof MESSAGE_STATUSES)[number],
): Promise<ActionResult> {
  return runVoid(messageStatusSchema, { id, status }, (v) =>
    adminMessagesRepo.setStatus(v.id, v.status),
  )
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  return runVoid(idSchema, id, (value) => adminMessagesRepo.remove(value))
}
