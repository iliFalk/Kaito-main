/**
 * scripts/replace-cdn.cjs
 *
 * Replaces remote CDN URLs in files with local paths from vendor-map.json.
 * - Creates a backup for each modified file: <file>.bak
 * - Removes integrity="..." attributes (SRI) since files are modified locally.
 * - Rewrites occurrences found in occurrences.json (safer) and any remaining
 *   occurrences across the same file.
 *
 * Usage:
 *   node scripts/replace-cdn.cjs
 *
 * Safety:
 *   - This will overwrite files in-place (but backup files are created).
 *   - Only replacements for URLs present in vendor-map.json (and non-null) are applied.
 *
 * Note: This version avoids external dependencies (no 'glob' required).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const VENDOR_MAP = path.join(ROOT, 'vendor-map.json');
const OCCURRENCES = path.join(ROOT, 'occurrences.json');

const SKIP_DIR_NAMES = new Set(['node_modules', '.git', 'public', 'public/vendor', 'scripts']);
const SKIP_PATH_PREFIXES = ['public/vendor', '.git', 'node_modules', 'scripts'];

function escapeForRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.error(`Failed to read/parse ${p}: ${e.message}`);
    process.exit(1);
  }
}

const vendorMap = readJson(VENDOR_MAP);
const occurrences = readJson(OCCURRENCES || '{}');

// Build list of replacers (only those with a mapping)
const replacers = Object.entries(vendorMap || {})
  .filter(([url, local]) => local && typeof local === 'string')
  .map(([url, local]) => ({ url, local, regex: new RegExp(escapeForRegex(url), 'g') }));

if (replacers.length === 0) {
  console.log('No vendor mappings found. Nothing to replace.');
  process.exit(0);
}

// Use occurrences to get candidate files
const candidateFiles = new Set();
if (Array.isArray(occurrences)) {
  for (const occ of occurrences) {
    if (occ && occ.file) {
      const full = path.join(ROOT, occ.file);
      candidateFiles.add(full);
    }
  }
}

function isIgnored(relPath) {
  if (!relPath) return true;
  for (const prefix of SKIP_PATH_PREFIXES) {
    if (relPath === prefix || relPath.startsWith(prefix + path.sep)) return true;
  }
  return false;
}

function walkSync(dir, callback) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    const rel = path.relative(ROOT, full);
    if (ent.isDirectory()) {
      if (isIgnored(rel)) continue;
      walkSync(full, callback);
    } else if (ent.isFile()) {
      // skip backup files
      if (full.endsWith('.bak')) continue;
      callback(full);
    }
  }
}

// Helper to process a single file
function processFile(filePath) {
  if (!fs.existsSync(filePath)) return { changed: false, reason: 'missing' };
  const ext = path.extname(filePath).toLowerCase();
  // Only process textual file types (same set as scanner)
  const TEXT_EXTS = new Set(['.html', '.htm', '.js', '.jsx', '.ts', '.tsx', '.css', '.json', '.md', '.txt']);
  if (!TEXT_EXTS.has(ext)) return { changed: false, reason: 'skip-ext' };

  const original = fs.readFileSync(filePath, 'utf8');
  let modified = original;
  let didReplace = false;

  // Apply replacements from vendorMap
  for (const { url, local, regex } of replacers) {
    if (regex.test(modified)) {
      modified = modified.replace(regex, local);
      didReplace = true;
    }
  }

  // Remove integrity attributes (SRI)
  const integrityRegex = /\s+integrity=(?:"[^"]*"|'[^']*')/g;
  if (integrityRegex.test(modified)) {
    modified = modified.replace(integrityRegex, '');
    didReplace = true;
  }

  // Optionally remove crossorigin attributes
  const crossoriginRegex = /\s+crossorigin=(?:"[^"]*"|'[^']*')/g;
  if (crossoriginRegex.test(modified)) {
    modified = modified.replace(crossoriginRegex, '');
    didReplace = true;
  }

  // Rewrite CSS url(...) that may still reference remote hosts (for safety handle absolute urls that were in vendorMap)
  // We already replaced direct matches above; this is an extra pass to catch url("https://...")
  const cssUrlRegex = /url\(\s*(['"]?)(https?:\/\/[^'")]+)\1\s*\)/g;
  modified = modified.replace(cssUrlRegex, (m, q, captured) => {
    const map = vendorMap[captured];
    if (map && typeof map === 'string') {
      didReplace = true;
      return `url(${q}${map}${q})`;
    }
    return m;
  });

  if (didReplace) {
    // Backup original
    try {
      fs.writeFileSync(filePath + '.bak', original, 'utf8');
    } catch (e) {
      console.warn(`Warning: failed to write backup for ${filePath}: ${e.message}`);
    }
    fs.writeFileSync(filePath, modified, 'utf8');
    return { changed: true };
  } else {
    return { changed: false, reason: 'no-match' };
  }
}

// First process candidate files discovered by the scanner
console.log(`Starting replacement in ${candidateFiles.size} candidate files...`);
const results = { processed: 0, changed: 0, skipped: 0, missing: 0 };

for (const filePath of candidateFiles) {
  results.processed++;
  const r = processFile(filePath);
  if (r.changed) results.changed++;
  else {
    results.skipped++;
    if (r.reason === 'missing') results.missing++;
  }
}

console.log('Replacement summary for occurrence files:');
console.log(results);

// Additional safety: scan repo text files for any remaining remote URLs that have mappings
console.log('Scanning repository for any other occurrences to replace...');
let extraProcessed = 0, extraChanged = 0;
walkSync(ROOT, (full) => {
  // skip files already processed (backups also skipped)
  if (candidateFiles.has(full)) return;
  // ignore vendor folder explicitly
  const rel = path.relative(ROOT, full);
  if (isIgnored(rel)) return;
  const ext = path.extname(full).toLowerCase();
  const TEXT_EXTS = new Set(['.html', '.htm', '.js', '.jsx', '.ts', '.tsx', '.css', '.json', '.md', '.txt']);
  if (!TEXT_EXTS.has(ext)) return;
  extraProcessed++;
  const r = processFile(full);
  if (r.changed) extraChanged++;
});

console.log(`Extra scan processed ${extraProcessed} files, changed ${extraChanged} files.`);
console.log('Done. Backups for modified files are saved with .bak extension. Please review changes before committing.');
