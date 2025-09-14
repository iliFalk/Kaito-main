/**
 * scripts/vendor-cdn.cjs
 *
 * Scans the repo for external http(s) URLs (HTML, JS/TS, CSS, JSON, MD),
 * downloads each resource into public/vendor/, and writes:
 *  - vendor-map.json : { "<originalUrl>": "/vendor/<saved-filename>" }
 *  - occurrences.json : [{ file, url, index, previewLine }]
 *
 * Usage:
 *   node scripts/vendor-cdn.cjs            # downloads and writes maps
 *   node scripts/vendor-cdn.cjs --report  # only scans and reports, no downloads
 *
 * Notes:
 *  - Skips node_modules, .git and the scripts/ and public/vendor folders.
 *  - Keeps original filename when possible; if conflict or query string exists,
 *    appends a short hash.
 *  - Make sure you review vendor-map.json and occurrences.json before doing
 *    automated replacements. This script does NOT rewrite project files.
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'vendor');
const VENDOR_MAP_PATH = path.join(ROOT, 'vendor-map.json');
const OCCURRENCES_PATH = path.join(ROOT, 'occurrences.json');

const SKIP_DIRS = new Set(['node_modules', '.git', 'public/vendor', 'public/vendor/', 'scripts']);

const TEXT_EXTS = new Set([
  '.html', '.htm', '.js', '.jsx', '.ts', '.tsx', '.css', '.json', '.md', '.txt'
]);

const urlRegex = /https?:\/\/[^\s"'<>`)]+/g;

function shortHash(input, length = 8) {
  return crypto.createHash('sha1').update(input).digest('hex').slice(0, length);
}

async function walk(dir, callback) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    const rel = path.relative(ROOT, full);
    if (ent.isDirectory()) {
      // skip certain directories
      if (SKIP_DIRS.has(ent.name) || Array.from(SKIP_DIRS).some(s => rel.startsWith(s + path.sep))) {
        continue;
      }
      await walk(full, callback);
    } else if (ent.isFile()) {
      callback(full);
    }
  }
}

function sanitizeFilename(name) {
  // remove query params, keep extension; replace unsafe chars
  return name.replace(/[\?\#].*$/, '').replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function downloadToFile(url, outDir) {
  try {
    const u = new URL(url);
    const pathname = u.pathname;
    let base = path.basename(pathname) || u.hostname;
    base = sanitizeFilename(base);
    const hasExt = /\.[a-zA-Z0-9]{1,8}$/.test(base);
    // if filename empty or has no ext and url has no obvious filename, use hostname + hash
    let filename = base;
    if (u.search || !base || !hasExt) {
      const add = shortHash(url);
      const ext = hasExt ? '' : path.extname(base) || '';
      filename = (base || u.hostname) + (ext ? '' : '') + '-' + add + (ext || '');
      // ensure safe char replacement
      filename = sanitizeFilename(filename);
    }
    const outPath = path.join(outDir, filename);

    // If conflict with different origin, append short hash
    try {
      const stat = await fs.stat(outPath);
      if (stat && stat.size > 0) {
        // already exists; check if it's from same URL by comparing hash in name
        if (!outPath.includes(shortHash(url))) {
          // append hash to avoid overwriting
          const hashed = filename.replace(/(\.[^.]*)?$/, '-' + shortHash(url) + '$1');
          const alt = hashed.replace('$1', '');
          filename = alt;
        } else {
          // use existing
        }
      }
    } catch (e) {
      // doesn't exist; continue
    }

    const finalPath = path.join(outDir, filename);

    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Warning: failed to fetch ${url} — ${res.status} ${res.statusText}`);
      return null;
    }
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(finalPath, buffer);
    return { url, filename, path: finalPath };
  } catch (err) {
    console.warn(`Warning: error downloading ${url}: ${err.message}`);
    return null;
  }
}

(async function main() {
  const args = process.argv.slice(2);
  const REPORT_ONLY = args.includes('--report');
  console.log(`Starting vendor-cdn scan (report only: ${REPORT_ONLY})...`);
  const foundUrls = new Map(); // url -> Set(files)
  const occurrences = [];

  await walk(ROOT, (filePath) => {
    const rel = path.relative(ROOT, filePath);
    const ext = path.extname(filePath).toLowerCase();
    if (!TEXT_EXTS.has(ext)) return;
    // skip some top-level files like vendor-map.json or occurrences.json to avoid self-matching
    if (rel === path.relative(ROOT, VENDOR_MAP_PATH) || rel === path.relative(ROOT, OCCURRENCES_PATH)) return;
    (async () => {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        let match;
        while ((match = urlRegex.exec(content))) {
          const url = match[0];
          // skip obvious dev-urls or ones we don't want to vendor
          if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) continue;
          // ignore package registry URLs inside package-lock / node_modules detection by extension filter, but further safety:
          if (filePath.includes('package-lock.json') || filePath.includes('node_modules')) continue;
          if (!foundUrls.has(url)) foundUrls.set(url, new Set());
          foundUrls.get(url).add(rel);
          // Save one-line preview
          const lines = content.split(/\r?\n/);
          const pos = content.slice(0, match.index).split(/\r?\n/).length - 1;
          const previewLine = (lines[pos] || '').trim();
          occurrences.push({ file: rel, url, index: match.index, previewLine });
        }
      } catch (e) {
        // ignore read errors
      }
    })();
  });

  // wait a tick for all async reads to complete (walk triggers readFile async but doesn't await them)
  // Better approach: gather promises. For this small script, wait briefly then continue.
  await new Promise(r => setTimeout(r, 400));

  const uniqueUrls = Array.from(foundUrls.keys()).sort();
  console.log(`Found ${uniqueUrls.length} unique external URLs.`);

  await ensureDir(OUT_DIR);

  const vendorMap = {};
  if (!REPORT_ONLY) {
    for (const url of uniqueUrls) {
      try {
        const result = await downloadToFile(url, OUT_DIR);
        if (result && result.filename) {
          const localPath = '/vendor/' + result.filename;
          vendorMap[url] = localPath;
          console.log(`Downloaded: ${url} -> ${localPath}`);
        } else {
          console.warn(`Skipped download for: ${url}`);
        }
      } catch (e) {
        console.warn(`Error handling ${url}: ${e.message}`);
      }
    }
    // write vendor-map.json
    await fs.writeFile(VENDOR_MAP_PATH, JSON.stringify(vendorMap, null, 2), 'utf8');
    console.log(`Wrote vendor map to ${VENDOR_MAP_PATH}`);
  } else {
    // report-only: create a sample map of original filename proposals but don't download
    for (const url of uniqueUrls) {
      try {
        const u = new URL(url);
        let base = sanitizeFilename(path.basename(u.pathname) || u.hostname);
        if (u.search || !base) {
          base = (base || u.hostname) + '-' + shortHash(url);
          base = sanitizeFilename(base);
        }
        vendorMap[url] = '/vendor/' + base;
      } catch (e) {
        vendorMap[url] = null;
      }
    }
    console.log('Report mode; no downloads were performed.');
  }

  // write occurrences.json (helpful for replacements)
  await fs.writeFile(OCCURRENCES_PATH, JSON.stringify(occurrences, null, 2), 'utf8');
  console.log(`Wrote occurrences to ${OCCURRENCES_PATH}`);

  if (REPORT_ONLY) {
    const outReport = path.join(ROOT, 'vendor-map-proposal.json');
    await fs.writeFile(outReport, JSON.stringify(vendorMap, null, 2), 'utf8');
    console.log(`Wrote vendor-map proposal to ${outReport}`);
  }

  console.log('Done. Next steps: review vendor-map.json and occurrences.json, then replace URLs in files (manually or via a safe automated script).');
})();
