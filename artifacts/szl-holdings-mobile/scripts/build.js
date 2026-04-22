const { execSync } = require('node:child_process');
const path = require('node:path');
try {
  execSync('pnpm exec expo export --platform web --output-dir dist', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..'),
  });
} catch (_err) {
  process.exit(1);
}
