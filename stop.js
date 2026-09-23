const { execSync } = require('child_process');

console.log('[CLASSROOM-HUB] Stopping local backend (Node on port 3000) and local frontend (Node on port 8080)...');

if (process.platform === 'win32') {
  try {
    const output = execSync(
      'powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000,8080 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess"',
      { encoding: 'utf-8' }
    );
    const pids = [...new Set(output.split(/\r?\n/).map((s) => s.trim()).filter(Boolean))];

    if (pids.length === 0) {
      console.log('[CLASSROOM-HUB] No local Node processes running on ports 3000 or 8080. Already clean!');
    } else {
      for (const pid of pids) {
        try {
          execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
          console.log(`[CLASSROOM-HUB] Stopped local Node process (PID: ${pid})`);
        } catch (_) {}
      }
      console.log('[CLASSROOM-HUB] Local backend and frontend stopped successfully.');
    }
  } catch (err) {
    console.log('[CLASSROOM-HUB] Local ports 3000 and 8080 are already clean.');
  }
} else {
  try {
    execSync('fuser -k 3000/tcp 8080/tcp 2>/dev/null', { stdio: 'ignore' });
    console.log('[CLASSROOM-HUB] Local backend and frontend stopped.');
  } catch (_) {
    console.log('[CLASSROOM-HUB] No local Node processes running. Already clean!');
  }
}
