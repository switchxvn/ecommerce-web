import fs from 'node:fs/promises';
import path from 'node:path';

const mediaDir = path.resolve('scripts/seo/generated-service-media/2026-05-25');
const outputPath = path.join(mediaDir, 'upload-manifest.json');

async function main() {
  const entries = await fs.readdir(mediaDir, { withFileTypes: true });
  const manifest = entries
    .filter((entry) => entry.isFile() && /\.(png|jpe?g)$/i.test(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => ({
      source: path.join(mediaDir, entry.name),
      key: `services/${entry.name}`,
    }));

  await fs.writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(`${outputPath}\n`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
