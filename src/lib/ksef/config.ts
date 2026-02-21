import { prisma } from "@/lib/prisma";

export interface KsefConfig {
  enabled: boolean;
  token: string | null;
  nip: string | null;
  subjectName: string | null;
  subjectAddress: string | null;
  mode: "test" | "prod";
  autoSend: boolean;
}

const DEFAULT_CONFIG: KsefConfig = {
  enabled: false,
  token: null,
  nip: null,
  subjectName: null,
  subjectAddress: null,
  mode: "test",
  autoSend: true,
};

export async function getKsefConfig(): Promise<KsefConfig> {
  const keys = [
    "ksef_enabled",
    "ksef_token",
    "ksef_nip",
    "ksef_subject_name",
    "ksef_subject_address",
    "ksef_mode",
    "ksef_auto_send",
  ];
  const rows = await prisma.systemConfig.findMany({
    where: { key: { in: keys } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value as unknown]));
  return {
    enabled: (map.get("ksef_enabled") as boolean) ?? DEFAULT_CONFIG.enabled,
    token: (map.get("ksef_token") as string) ?? null,
    nip: (map.get("ksef_nip") as string) ?? null,
    subjectName: (map.get("ksef_subject_name") as string) ?? null,
    subjectAddress: (map.get("ksef_subject_address") as string) ?? null,
    mode: ((map.get("ksef_mode") as string) ?? "test") === "prod" ? "prod" : "test",
    autoSend: (map.get("ksef_auto_send") as boolean) ?? true,
  };
}

export async function setKsefConfig(partial: Partial<KsefConfig>): Promise<void> {
  const entries: [string, unknown][] = [];
  if (partial.enabled !== undefined) entries.push(["ksef_enabled", partial.enabled]);
  if (partial.token !== undefined) entries.push(["ksef_token", partial.token]);
  if (partial.nip !== undefined) entries.push(["ksef_nip", partial.nip]);
  if (partial.subjectName !== undefined) entries.push(["ksef_subject_name", partial.subjectName]);
  if (partial.subjectAddress !== undefined) entries.push(["ksef_subject_address", partial.subjectAddress]);
  if (partial.mode !== undefined) entries.push(["ksef_mode", partial.mode]);
  if (partial.autoSend !== undefined) entries.push(["ksef_auto_send", partial.autoSend]);
  for (const [key, value] of entries) {
    await prisma.systemConfig.upsert({
      where: { key },
      create: { key, value: value as object },
      update: { value: value as object },
    });
  }
}
