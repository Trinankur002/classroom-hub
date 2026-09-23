const { spawn, exec, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

// ANSI styling
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
};

function logSystem(msg) {
  console.log(`${colors.yellow}${colors.bright}[CLASSROOM-HUB]${colors.reset} ${msg}`);
}

function parseDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');
  const result = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([\w.-]+)\s*=\s*(.*)$/);
    if (match) {
      let val = match[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      result[match[1]] = val;
    }
  }
  return result;
}

// ─────────────────────────────────────────────────────────────
// Pre-flight Environment & Files Check
// ─────────────────────────────────────────────────────────────
function runPreflightCheck() {
  console.log(`\n${colors.bright}${colors.cyan}======================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}   CLASSROOM HUB - PRE-FLIGHT ENVIRONMENT CHECK       ${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}======================================================${colors.reset}\n`);

  let allOk = true;

  // 1. Backend environment
  const serverEnvPath = path.resolve(__dirname, 'server/.env');
  const serverEnv = parseDotEnvFile(serverEnvPath);

  if (!serverEnv) {
    console.log(`${colors.red}✖ [BACKEND] Missing server/.env file!${colors.reset}`);
    console.log(`  Run: ${colors.yellow}npm run setup:env${colors.reset} to generate from template.\n`);
    allOk = false;
  } else {
    console.log(`${colors.green}✔ [BACKEND] server/.env loaded successfully${colors.reset}`);

    // Database
    if (serverEnv.DATABASE_URL && serverEnv.DATABASE_URL.trim().length > 0) {
      const isNeon = serverEnv.DATABASE_URL.includes('neon.tech');
      const isLocal = serverEnv.DATABASE_URL.includes('localhost') || serverEnv.DATABASE_URL.includes('127.0.0.1');
      const dbType = isNeon ? 'Neon Cloud' : isLocal ? 'Localhost' : 'PostgreSQL';
      console.log(`  ${colors.green}✔${colors.reset} DATABASE_URL configured (${dbType})`);
    } else {
      console.log(`  ${colors.red}✖ DATABASE_URL is missing or empty!${colors.reset}`);
      allOk = false;
    }

    // JWT Secret
    if (serverEnv.JWT_SECRET && serverEnv.JWT_SECRET.trim().length > 0) {
      console.log(`  ${colors.green}✔${colors.reset} JWT_SECRET configured`);
    } else {
      console.log(`  ${colors.yellow}⚠ JWT_SECRET is missing! Using fallback.${colors.reset}`);
    }

    // GCP Key & Bucket
    if (serverEnv.GCP_KEY_FILE) {
      const gcpKeyResolved = path.resolve(__dirname, 'server', serverEnv.GCP_KEY_FILE);
      if (fs.existsSync(gcpKeyResolved)) {
        try {
          const keyData = JSON.parse(fs.readFileSync(gcpKeyResolved, 'utf-8'));
          const clientEmail = keyData.client_email ? ` (${keyData.client_email.split('@')[0]}@...)` : '';
          console.log(`  ${colors.green}✔${colors.reset} GCP_KEY_FILE valid JSON at ${serverEnv.GCP_KEY_FILE}${clientEmail}`);
        } catch (e) {
          console.log(`  ${colors.yellow}⚠ GCP_KEY_FILE exists but is not valid JSON!${colors.reset}`);
        }
      } else {
        console.log(`  ${colors.yellow}⚠ GCP_KEY_FILE (${serverEnv.GCP_KEY_FILE}) not found on disk (file uploads will fail)${colors.reset}`);
      }
    } else {
      console.log(`  ${colors.dim}- GCP_KEY_FILE not configured (optional for file uploads)${colors.reset}`);
    }

    // LiveKit
    if (serverEnv.LIVEKIT_URL) {
      console.log(`  ${colors.green}✔${colors.reset} LIVEKIT_URL -> ${serverEnv.LIVEKIT_URL}`);
    } else {
      console.log(`  ${colors.yellow}⚠ LIVEKIT_URL not set (live classes disabled)${colors.reset}`);
    }
  }

  console.log('');

  // 2. Frontend environment
  const webEnvPath = path.resolve(__dirname, 'web/.env');
  const webEnv = parseDotEnvFile(webEnvPath);

  if (!webEnv) {
    console.log(`${colors.red}✖ [FRONTEND] Missing web/.env file!${colors.reset}`);
    console.log(`  Run: ${colors.yellow}npm run setup:env${colors.reset} to generate from template.\n`);
    allOk = false;
  } else {
    console.log(`${colors.green}✔ [FRONTEND] web/.env loaded successfully${colors.reset}`);

    if (webEnv.VITE_BACKEND_API_URL) {
      console.log(`  ${colors.green}✔${colors.reset} VITE_BACKEND_API_URL -> ${webEnv.VITE_BACKEND_API_URL}`);
    } else {
      console.log(`  ${colors.yellow}⚠ VITE_BACKEND_API_URL missing (defaulting to /api)${colors.reset}`);
    }

    if (webEnv.VITE_LIVEKIT_WS_URL) {
      console.log(`  ${colors.green}✔${colors.reset} VITE_LIVEKIT_WS_URL -> ${webEnv.VITE_LIVEKIT_WS_URL}`);
    }
  }

  console.log('');

  // 3. Dependencies check
  const serverModules = fs.existsSync(path.resolve(__dirname, 'server/node_modules'));
  const webModules = fs.existsSync(path.resolve(__dirname, 'web/node_modules'));

  if (serverModules && webModules) {
    console.log(`${colors.green}✔ [DEPENDENCIES] node_modules present in both server/ and web/${colors.reset}`);
  } else {
    if (!serverModules) console.log(`${colors.yellow}⚠ server/node_modules is missing!${colors.reset}`);
    if (!webModules) console.log(`${colors.yellow}⚠ web/node_modules is missing!${colors.reset}`);
  }

  console.log(`${colors.bright}${colors.cyan}======================================================${colors.reset}\n`);

  return { allOk, serverModules, webModules };
}

// ─────────────────────────────────────────────────────────────
// Dependency Installer
// ─────────────────────────────────────────────────────────────
function installDependenciesIfNeeded(force = false, { serverModules, webModules }) {
  if (force || !serverModules) {
    logSystem(`Installing dependencies in server/...`);
    execSync(`${npmCmd} install`, { cwd: path.resolve(__dirname, 'server'), stdio: 'inherit' });
  }
  if (force || !webModules) {
    logSystem(`Installing dependencies in web/...`);
    execSync(`${npmCmd} install`, { cwd: path.resolve(__dirname, 'web'), stdio: 'inherit' });
  }
}

// ─────────────────────────────────────────────────────────────
// Process Orchestration
// ─────────────────────────────────────────────────────────────
const processes = [];
let isShuttingDown = false;

function terminateProcess(proc) {
  if (!proc || !proc.pid) return;
  try {
    if (isWin) {
      exec(`taskkill /pid ${proc.pid} /T /F`, () => {});
    } else {
      try {
        process.kill(-proc.pid, 'SIGTERM');
      } catch (err) {
        proc.kill('SIGTERM');
      }
    }
  } catch (err) {
    // ignore
  }
}

const keepAlive = setInterval(() => {}, 60000);

function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  clearInterval(keepAlive);

  for (const proc of processes) {
    if (proc && proc.pid) {
      try {
        if (isWin) {
          execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
        } else {
          try {
            process.kill(-proc.pid, 'SIGKILL');
          } catch (_) {
            proc.kill('SIGKILL');
          }
        }
      } catch (_) {}
    }
  }

  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function createLinePrefixedStream(prefixColor, prefixText, outputStream) {
  let buffer = '';
  return (data) => {
    if (isShuttingDown) return;
    buffer += data.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!isShuttingDown) {
        outputStream.write(`${prefixColor}${colors.bright}[${prefixText}]${colors.reset} ${line}\n`);
      }
    }
  };
}

function startService(name, cwd, scriptArgs, color) {
  logSystem(`Starting ${name}...`);

  const proc = spawn(npmCmd, scriptArgs, {
    cwd: path.resolve(__dirname, cwd),
    env: { ...process.env, FORCE_COLOR: 'true' },
    detached: !isWin,
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: isWin,
  });

  processes.push(proc);

  const outHandler = createLinePrefixedStream(color, name.toUpperCase(), process.stdout);
  const errHandler = createLinePrefixedStream(color, name.toUpperCase(), process.stderr);

  proc.stdout.on('data', outHandler);
  proc.stderr.on('data', errHandler);

  proc.on('error', (err) => {
    console.error(`${colors.red}[${name.toUpperCase()} ERROR]${colors.reset} ${err.message}`);
  });

  proc.on('close', (code) => {
    if (!isShuttingDown && code !== 0) {
      logSystem(`${name} stopped with exit code ${code}`);
    }
  });

  return proc;
}

// ─────────────────────────────────────────────────────────────
// Main Entrypoint
// ─────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const forceInstall = args.includes('--install') || args.includes('-i');
const checkOnly = args.includes('--check') || args.includes('--check-only');

const { allOk, serverModules, webModules } = runPreflightCheck();

if (checkOnly) {
  process.exit(allOk ? 0 : 1);
}

if (forceInstall || !serverModules || !webModules) {
  installDependenciesIfNeeded(forceInstall, { serverModules, webModules });
}

logSystem('Booting Classroom Hub development environment...');
logSystem('Running Backend (NestJS) and Frontend (Vite) concurrently.');
logSystem('Press Ctrl+C at any time to stop all services.\n');

startService('backend', 'server', ['run', 'dev'], colors.cyan);
startService('frontend', 'web', ['run', 'dev'], colors.magenta);

if (process.stdin.isTTY) {
  process.stdin.resume();
}
