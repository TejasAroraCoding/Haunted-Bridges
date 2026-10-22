import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { defineConfig } from 'vite';

/** Lists every file in a directory tree (paths relative to `root`, using forward slashes). */
function listFiles(root, dir = root) {
  return readdirSync(dir).flatMap(name => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listFiles(root, full) : [relative(root, full).split(sep).join('/')];
  });
}

/**
 * Writes dist/sw.js from src/pwa/sw-template.js, injecting the list of built files to precache
 * and a content hash so every release gets a fresh cache.
 */
function serviceWorkerPlugin() {
  let outDir;
  return {
    name: 'haunted-bridges-service-worker',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      // woff2 is enough for every browser that supports service workers; skip legacy .woff and source maps.
      const files = listFiles(outDir).filter(
        f => f !== 'sw.js' && f !== '_headers' && !f.endsWith('.map') && !f.endsWith('.woff')
      );
      const hash = createHash('sha256');
      for (const f of files.sort()) hash.update(f).update(readFileSync(join(outDir, f)));
      const precache = ['./', ...files.map(f => `./${f}`)];
      const sw = readFileSync('src/pwa/sw-template.js', 'utf8')
        .replace('__BUILD_HASH__', hash.digest('hex').slice(0, 12))
        .replace('__PRECACHE_LIST__', JSON.stringify(precache, null, 2));
      writeFileSync(join(outDir, 'sw.js'), sw);
    },
  };
}

export default defineConfig({
  // Relative URLs so the build works from any sub-path (e.g. GitHub Pages project sites).
  base: './',
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    sourcemap: true,
  },
  plugins: [serviceWorkerPlugin()],
});
