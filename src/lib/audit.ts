import { prisma } from "@/lib/prisma";

export async function auditLog(
  userId: string | null,
  action: string,
  entityType: string,
  entityId?: string,
  oldValue?: unknown,
  newValue?: unknown,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId ?? undefined,
        action,
        entityType,
        entityId: entityId ?? undefined,
        oldValue: oldValue != null ? (oldValue as object) : undefined,
        newValue: newValue != null ? (newValue as object) : undefined,
        metadata: metadata != null ? (metadata as object) : undefined,
      },
    });
  } catch (e) {
    console.error("[auditLog]", e);
  }
}
