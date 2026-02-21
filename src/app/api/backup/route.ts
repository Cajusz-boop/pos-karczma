import { NextRequest, NextResponse } from "next/server";
import { auditLog } from "@/lib/audit";
import { exec } from "child_process";
import { promisify } from "util";
import { readdir, stat } from "fs/promises";
import path from "path";

const execAsync = promisify(exec);
const BACKUP_DIR = path.join(process.cwd(), "backups");

/**
 * GET /api/backup — list available backups
 */
export async function GET() {
  try {
    let files: string[] = [];
    try {
      files = await readdir(BACKUP_DIR);
    } catch {
      return NextResponse.json({ backups: [], backupDir: BACKUP_DIR });
    }

    const backups = await Promise.all(
      files
        .filter((f) => f.startsWith("backup_") && (f.endsWith(".sql") || f.endsWith(".sql.gz")))
        .map(async (f) => {
          const filePath = path.join(BACKUP_DIR, f);
          const stats = await stat(filePath);
          return {
            filename: f,
            size: stats.size,
            sizeHuman: formatBytes(stats.size),
            createdAt: stats.mtime.toISOString(),
          };
        })
    );

    backups.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return NextResponse.json({
      backups,
      backupDir: BACKUP_DIR,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd listowania backupów" }, { status: 500 });
  }
}

/**
 * POST /api/backup — trigger a manual backup
 */
export async function POST(request: NextRequest) {
  try {
    const scriptPath = path.join(process.cwd(), "scripts", "backup-db.sh");

    // Try running the backup script
    try {
      const { stdout, stderr } = await execAsync(`bash "${scriptPath}"`, {
        timeout: 120000,
        env: {
          ...process.env,
          BACKUP_DIR: BACKUP_DIR,
          DB_HOST: process.env.DB_HOST ?? "localhost",
          DB_PORT: process.env.DB_PORT ?? "3306",
          DB_NAME: process.env.DB_NAME ?? "pos_karczma",
          DB_USER: process.env.DB_USER ?? "root",
          DB_PASS: process.env.DB_PASS ?? "",
        },
      });

      const userId = request.headers.get("x-user-id");
      await auditLog(userId, "BACKUP_MANUAL", "System", undefined, undefined, {
        output: stdout.slice(0, 500),
        stderr: stderr.slice(0, 200),
      });

      return NextResponse.json({
        ok: true,
        output: stdout,
        message: "Backup utworzony pomyślnie",
      });
    } catch (execError) {
      // If bash is not available (Windows), try alternative approach
      const errMsg = execError instanceof Error ? execError.message : String(execError);

      if (errMsg.includes("bash") || errMsg.includes("ENOENT")) {
        // Windows fallback: use mariadb-dump directly
        try {
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
          const filename = `backup_${timestamp}.sql`;
          const filepath = path.join(BACKUP_DIR, filename);

          const { mkdir } = await import("fs/promises");
          await mkdir(BACKUP_DIR, { recursive: true });

          const dbUrl = process.env.DATABASE_URL ?? "";
          const match = dbUrl.match(/mysql:\/\/([^:]+):([^@]*)@([^:]+):(\d+)\/(.+)/);

          if (match) {
            const [, user, pass, host, port, dbName] = match;
            const dumpCmd = `mariadb-dump --host=${host} --port=${port} --user=${user} ${pass ? `--password=${pass}` : ""} --single-transaction ${dbName} > "${filepath}"`;
            await execAsync(dumpCmd, { timeout: 120000 });
          } else {
            return NextResponse.json({
              ok: false,
              error: "Nie można odczytać DATABASE_URL. Skonfiguruj zmienne środowiskowe.",
            }, { status: 500 });
          }

          const userId = request.headers.get("x-user-id");
          await auditLog(userId, "BACKUP_MANUAL", "System", undefined, undefined, {
            filename,
            method: "windows-fallback",
          });

          return NextResponse.json({
            ok: true,
            filename,
            message: `Backup utworzony: ${filename}`,
          });
        } catch (winError) {
          return NextResponse.json({
            ok: false,
            error: `Błąd backupu: ${winError instanceof Error ? winError.message : String(winError)}`,
          }, { status: 500 });
        }
      }

      return NextResponse.json({
        ok: false,
        error: errMsg,
      }, { status: 500 });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd tworzenia backupu" }, { status: 500 });
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
