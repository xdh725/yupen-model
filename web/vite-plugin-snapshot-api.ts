import type { Plugin } from 'vite';
import { execFile } from 'child_process';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';

const ROOT = resolve(__dirname, '..');
const UI_CONFIG_PATH = resolve(ROOT, 'web/config/ui-config.json');

type UiConfig = {
  indexTableWidths?: {
    withDelete?: number[];
    noDelete?: number[];
  };
};

function readUiConfig(): UiConfig {
  if (!existsSync(UI_CONFIG_PATH)) return {};
  try {
    return JSON.parse(readFileSync(UI_CONFIG_PATH, 'utf-8')) as UiConfig;
  } catch {
    return {};
  }
}

function writeUiConfig(config: UiConfig) {
  mkdirSync(dirname(UI_CONFIG_PATH), { recursive: true });
  writeFileSync(UI_CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, 'utf-8');
}

function readRequestBody(req: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolveBody, rejectBody) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : String(chunk);
    });
    req.on('end', () => resolveBody(raw));
    req.on('error', rejectBody);
  });
}

// ─── 定时快照生成器 ────────────────────────────────────────────────
// 每日 19:00 自动执行快照生成（与 crontab 一致）
function startSnapshotScheduler(
  server: Parameters<NonNullable<Plugin['configureServer']>>[0],
  log: { info: (msg: string) => void; warn: (msg: string) => void; error: (msg: string) => void },
) {
  const ROOT = resolve(__dirname, '..');
  const SCHEDULE_HOUR = 19; // 19:00 (武汉时间)
  const SCHEDULE_MINUTE = 0;
  const CHECK_INTERVAL_MS = 60_000; // 每分钟检查一次

  let lastRunDate: string | null = null;

  const timer = setInterval(() => {
    const now = new Date();
    // 武汉时间 (UTC+8)
    const wuhanHour = now.getUTCHours() + 8 >= 24 ? now.getUTCHours() + 8 - 24 : now.getUTCHours() + 8;
    const wuhanMinute = now.getUTCMinutes();
    const today = (() => {
      const d = new Date(now.getTime() + 8 * 3600_000);
      return d.toISOString().split('T')[0];
    })();

    if (wuhanHour === SCHEDULE_HOUR && wuhanMinute === SCHEDULE_MINUTE && lastRunDate !== today) {
      lastRunDate = today;

      // 检查是否已有快照
      const manifestPath = resolve(ROOT, 'web/public/data/manifest.json');
      if (existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
          if (manifest.latest === today) {
            log.info(`⏰ [scheduler] 今天 (${today}) 的快照已存在，跳过定时生成`);
            return;
          }
        } catch {
          // ignore parse error, proceed
        }
      }

      const scriptPath = resolve(ROOT, 'scripts/generate_daily_yupen_snapshot.py');
      const startedAt = Date.now();
      log.info(`⏰ [scheduler] 定时触发快照生成 (19:00 武汉时间, 含补缺) ...`);

      execFile('python3', [scriptPath, '--fill-gaps'], { timeout: 600_000 }, (error, stdout, stderr) => {
        const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);

        if (stdout) {
          for (const line of stdout.trim().split('\n')) {
            if (line.includes('❌') || line.includes('Error') || line.includes('error')) {
              log.error(`   ${line}`);
            } else if (line.includes('⚠️') || line.includes('Warning')) {
              log.warn(`   ${line}`);
            } else {
              log.info(`   ${line}`);
            }
          }
        }
        if (stderr) {
          for (const line of stderr.trim().split('\n')) {
            log.error(`   [stderr] ${line}`);
          }
        }

        if (error) {
          log.error(`❌ [scheduler] 定时生成失败 (${elapsedSec}s): ${error.message}`);
        } else {
          log.info(`✅ [scheduler] 定时生成完成 (${elapsedSec}s)`);
        }
      });
    }
  }, CHECK_INTERVAL_MS);

  // dev server 关闭时清理定时器
  server.httpServer?.on('close', () => {
    clearInterval(timer);
  });

  log.info(`⏰ [scheduler] 定时任务已启动: 每日 19:00 (武汉时间) 自动生成快照`);
}

export function snapshotApiPlugin(): Plugin {
  return {
    name: 'snapshot-api',
    configureServer(server) {
      const log = {
        info: (msg: string) => {
          const ts = new Date().toISOString().slice(11, 19);
          server.config.logger.info(`\x1b[36m[${ts}]\x1b[0m ${msg}`);
        },
        warn: (msg: string) => {
          const ts = new Date().toISOString().slice(11, 19);
          server.config.logger.warn(`\x1b[33m[${ts}]\x1b[0m ${msg}`);
        },
        error: (msg: string) => {
          const ts = new Date().toISOString().slice(11, 19);
          server.config.logger.error(`\x1b[31m[${ts}]\x1b[0m ${msg}`);
        },
      };

      // 启动定时任务
      startSnapshotScheduler(server, log);

      server.middlewares.use('/api/index-table-widths', async (req, res) => {
        const url = new URL(req.url ?? '', 'http://localhost');
        const profile = url.searchParams.get('profile') === 'withDelete' ? 'withDelete' : 'noDelete';
        res.setHeader('Content-Type', 'application/json');

        if (req.method === 'GET') {
          const config = readUiConfig();
          const widths = config.indexTableWidths?.[profile] ?? null;
          res.end(JSON.stringify({ profile, widths }));
          return;
        }

        if (req.method === 'POST') {
          try {
            const rawBody = await readRequestBody(req);
            const body = JSON.parse(rawBody) as { profile?: string; widths?: unknown };
            const bodyProfile = body.profile === 'withDelete' ? 'withDelete' : 'noDelete';
            if (!Array.isArray(body.widths) || body.widths.some((w) => typeof w !== 'number' || Number.isNaN(w))) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid widths payload' }));
              return;
            }
            const config = readUiConfig();
            const next: UiConfig = {
              ...config,
              indexTableWidths: {
                ...config.indexTableWidths,
                [bodyProfile]: body.widths.map((w) => Math.round(w)),
              },
            };
            writeUiConfig(next);
            res.end(JSON.stringify({ ok: true, profile: bodyProfile }));
            return;
          } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({
              error: error instanceof Error ? error.message : 'Failed to save widths',
            }));
            return;
          }
        }

        res.statusCode = 405;
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      });

      server.middlewares.use('/api/refresh-snapshot', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        const manifestPath = resolve(ROOT, 'web/public/data/manifest.json');
        const today = new Date().toISOString().split('T')[0];

        // 检查今天是否已有快照
        if (existsSync(manifestPath)) {
          try {
            const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
            if (manifest.latest === today) {
              log.info(`🔄 [refresh-snapshot] 今天 (${today}) 的快照已存在，跳过生成`);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                status: 'already_exists',
                message: `今天 (${today}) 的快照已存在`,
                date: today,
              }));
              return;
            }
          } catch {
            // ignore parse error, proceed to generate
          }
        }

        // 执行 Python 脚本
        const scriptPath = resolve(ROOT, 'scripts/generate_daily_yupen_snapshot.py');
        const startedAt = Date.now();
        const now = new Date();
        const hour = now.getHours();
        const marketClosed = hour >= 15; // A股 15:00 收盘

        if (!marketClosed) {
          log.warn(`🔄 [refresh-snapshot] 注意: 当前 ${hour}:${String(now.getMinutes()).padStart(2, '0')} 尚未收盘，数据可能不完整`);
        }
        log.info(`🔄 [refresh-snapshot] 开始执行 python3 scripts/generate_daily_yupen_snapshot.py --fill-gaps ...`);

        execFile('python3', [scriptPath, '--fill-gaps'], { timeout: 600_000 }, (error, stdout, stderr) => {
          res.setHeader('Content-Type', 'application/json');
          const elapsedMs = Date.now() - startedAt;
          const elapsedSec = (elapsedMs / 1000).toFixed(1);

          // 将 Python 脚本的输出打印到 Vite 服务端控制台
          if (stdout) {
            for (const line of stdout.trim().split('\n')) {
              if (line.includes('❌') || line.includes('Error') || line.includes('error')) {
                log.error(`   ${line}`);
              } else if (line.includes('⚠️') || line.includes('Warning')) {
                log.warn(`   ${line}`);
              } else {
                log.info(`   ${line}`);
              }
            }
          }
          if (stderr) {
            for (const line of stderr.trim().split('\n')) {
              log.error(`   [stderr] ${line}`);
            }
          }

          const debugLog = {
            command: `python3 ${scriptPath} --fill-gaps`,
            startedAt: new Date(startedAt).toISOString(),
            elapsedMs,
            stdout: stdout ?? '',
            stderr: stderr ?? '',
          };

          if (error) {
            log.error(`❌ [refresh-snapshot] 生成失败 (${elapsedSec}s): ${error.message}`);
            res.statusCode = 500;
            res.end(JSON.stringify({
              status: 'error',
              message: `生成失败: ${error.message}`,
              debugLog,
            }));
            return;
          }

          // 从输出中提取生成的日期
          const dateMatch = stdout.match(/snapshot=.*?(\d{4}-\d{2}-\d{2})\.json/);
          const generatedDate = dateMatch ? dateMatch[1] : today;

          log.info(`✅ [refresh-snapshot] 完成 date=${generatedDate} (${elapsedSec}s)`);

          res.end(JSON.stringify({
            status: 'generated',
            message: marketClosed
              ? `已生成 ${generatedDate} 快照`
              : `已生成 ${generatedDate} 快照（注意：当前尚未收盘，数据可能不完整）`,
            date: generatedDate,
            debugLog,
          }));
        });
      });
    },
  };
}
