import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const scriptPath = path.resolve('scripts/deploy.sh');

function setupFixture() {
  const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deploy-script-test-'));
  const scriptsDir = path.join(fixtureDir, 'scripts');
  const binDir = path.join(fixtureDir, 'bin');

  fs.mkdirSync(scriptsDir, { recursive: true });
  fs.mkdirSync(binDir, { recursive: true });
  fs.mkdirSync(path.join(fixtureDir, 'apps', 'backend'), { recursive: true });
  fs.mkdirSync(path.join(fixtureDir, 'apps', 'api'), { recursive: true });
  fs.mkdirSync(path.join(fixtureDir, 'apps', 'frontend'), { recursive: true });
  fs.mkdirSync(path.join(fixtureDir, 'apps', 'admin'), { recursive: true });

  fs.copyFileSync(scriptPath, path.join(scriptsDir, 'deploy.sh'));
  fs.writeFileSync(
    path.join(fixtureDir, '.env'),
    [
      'GITHUB_USERNAME=tester',
      'REGISTRY=ghcr.io',
      'GITHUB_TOKEN=secret',
      'APP_NAME=test-app',
      'NETWORK_NAME=test-network',
      '',
    ].join('\n'),
  );

  const dockerMock = `#!/bin/bash
set -e
LOG_FILE="${fixtureDir}/docker.log"
printf '%s\\n' "$*" >> "$LOG_FILE"

case "$1" in
  info)
    echo "Registry: ghcr.io"
    ;;
  ps)
    if [ "$2" = "--format" ]; then
      exit 0
    fi
    cat <<'EOF'
CONTAINER ID   IMAGE   COMMAND   CREATED   STATUS   PORTS   NAMES
123456789abc   mock    mock      now       Up 1 second   0.0.0.0:3333->3333/tcp   test-app-backend
123456789abd   mock    mock      now       Up 1 second   0.0.0.0:4000->4000/tcp   test-app-api
123456789abe   mock    mock      now       Up 1 second   0.0.0.0:3000->4201/tcp   test-app-frontend
123456789abf   mock    mock      now       Up 1 second   0.0.0.0:3001->3001/tcp   test-app-admin
123456789ab0   mock    mock      now       Up 1 second   0.0.0.0:80->80/tcp       test-app-nginx
EOF
    exit 0
    ;;
  network)
    case "$2" in
      ls)
        exit 0
        ;;
      inspect)
        echo "[]"
        exit 0
        ;;
      create|rm|disconnect)
        exit 0
        ;;
    esac
    ;;
  pull|stop|rm|run|logs|login)
    exit 0
    ;;
esac

exit 0
`;

  fs.writeFileSync(path.join(binDir, 'docker'), dockerMock, { mode: 0o755 });

  return { fixtureDir, logPath: path.join(fixtureDir, 'docker.log') };
}

function runDeploy(args) {
  const { fixtureDir, logPath } = setupFixture();
  execFileSync('bash', ['scripts/deploy.sh', ...args], {
    cwd: fixtureDir,
    env: {
      ...process.env,
      PATH: `${path.join(fixtureDir, 'bin')}:${process.env.PATH}`,
    },
    stdio: 'pipe',
  });

  const logLines = fs.readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean);
  return { logLines };
}

test('deploys only requested service for partial deploy', () => {
  const { logLines } = runDeploy(['backend']);

  assert.ok(logLines.includes('pull --platform linux/amd64 ghcr.io/tester/test-app-backend:latest'));
  assert.ok(logLines.includes('run -d --platform linux/amd64 --name test-app-backend --network test-network --network-alias backend -p 3333:3333 --env-file apps/backend/.env.production -e NODE_ENV=production --restart unless-stopped ghcr.io/tester/test-app-backend:latest'));

  assert.equal(logLines.some((line) => line.includes('test-app-frontend:latest')), false);
  assert.equal(logLines.some((line) => line.includes('test-app-admin:latest')), false);
  assert.equal(logLines.some((line) => line.includes('test-app-api:latest')), false);
  assert.equal(logLines.some((line) => line.includes('test-app-nginx:latest')), false);
  assert.equal(logLines.some((line) => line === 'network rm test-network'), false);
});

test('deploys all services when no service argument is provided', () => {
  const { logLines } = runDeploy([]);

  assert.ok(logLines.includes('pull --platform linux/amd64 ghcr.io/tester/test-app-backend:latest'));
  assert.ok(logLines.includes('pull --platform linux/amd64 ghcr.io/tester/test-app-api:latest'));
  assert.ok(logLines.includes('pull --platform linux/amd64 ghcr.io/tester/test-app-frontend:latest'));
  assert.ok(logLines.includes('pull --platform linux/amd64 ghcr.io/tester/test-app-admin:latest'));
  assert.ok(logLines.includes('pull --platform linux/amd64 ghcr.io/tester/test-app-nginx:latest'));
});
