import { db } from "@/db";
import { auditLog } from '@/db/schema'
import { nanoid } from 'nanoid'
import type { AuditLogAction } from '@/types/vault'

type AuditLogParams = {
    userId: string
    action : AuditLogAction
    metadata? : Record<string, string|number>
    ipAddress? : string | null
    userAgent? : string | null
}

export async function writeAuditLog({
    userId,
    action,
    metadata,
    ipAddress,
    userAgent,
}:AuditLogParams):Promise<void>{
    try{
        await db.insert(auditLog).values({
            id: nanoid(),
            userId,
            action,
            metadata : metadata  ? JSON.stringify(metadata) : null,
            ipAddress : ipAddress ?? null,
            userAgent : userAgent ?? null,
        })
    }
    catch(error){
        console.error('Audit log write failed:', error)
    }
}

export function getRequestInfo(request: Request): {
  ipAddress: string | null
  userAgent: string | null
} {
  return {
    ipAddress:
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      request.headers.get('x-real-ip') ??
      null,
    userAgent: request.headers.get('user-agent') ?? null,
  }
}