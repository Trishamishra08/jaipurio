const { execSync } = require('child_process');

function pidOnPort(port) {
  try {
    const output = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const line = output.split('\n').map((row) => row.trim()).find(Boolean);
    if (!line) return null;
    return line.split(/\s+/).pop();
  } catch {
    return null;
  }
}

function freePort(port, { exceptPid = process.pid } = {}) {
  const pid = pidOnPort(String(port));
  if (!pid || pid === '0' || String(pid) === String(exceptPid)) return false;
  try {
    execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

module.exports = { freePort, pidOnPort };
