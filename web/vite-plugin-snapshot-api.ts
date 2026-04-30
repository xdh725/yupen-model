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

export function snapshotApiPlugin(): Plugin {
  return {
    name: 'snapshot-api',
    configureServer(server) {
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
        const command = `python3 ${scriptPath}`;
        const startedAt = Date.now();
        const now = new Date();
        const hour = now.getHours();
        const marketClosed = hour >= 15; // A股 15:00 收盘

        execFile('python3', [scriptPath], { timeout: 300_000 }, (error, stdout, stderr) => {
          res.setHeader('Content-Type', 'application/json');
          const elapsedMs = Date.now() - startedAt;
          const debugLog = {
            command,
            startedAt: new Date(startedAt).toISOString(),
            elapsedMs,
            stdout: stdout ?? '',
            stderr: stderr ?? '',
          };

          if (error) {
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
