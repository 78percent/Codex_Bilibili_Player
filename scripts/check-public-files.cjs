// Review the actual Git index, not ignored local research or user data.
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const git = args => execFileSync('git', args, { cwd: root, maxBuffer: 64 * 1024 * 1024 });
const files = git(['ls-files', '-z']).toString('utf8').split('\0').filter(Boolean);
const publicDocs = new Set(['docs/architecture.md', 'docs/compatibility.md', 'docs/privacy.md',
  'docs/sources.md', 'docs/release-review.md', 'docs/releases/1.3.0.md', 'docs/releases/1.3.3.md', 'docs/releases/1.4.0.md']);
const patterns = [
  ['personal home path', /[A-Z]:[\\/]+Users[\\/]+[^\s<>"'`\\/]+|\/(?:Users|home)\/[A-Za-z0-9_.-]+/i],
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['access token', /\b(?:gh[pousr]_[A-Za-z0-9]{25,}|github_pat_[A-Za-z0-9_]{30,}|sk-(?:proj-)?[A-Za-z0-9_-]{30,})\b/],
  ['literal login cookie', /\b(?:SESSDATA|bili_jct)\s*[:=]\s*["'][A-Za-z0-9%+/_=-]{24,}["']/],
  ['local evidence identifier', /\bev_[a-f0-9]{40,}\b/],
];
const issues = [];
const textFiles = files.filter(file => /\.(?:md|txt|json|[cm]?js|tsx?|css|html|svg|ya?ml|ps1|cmd)$/.test(file)
  || ['LICENSE', '.npmrc', '.gitignore'].includes(file));
const objects = execFileSync('git', ['cat-file', '--batch'], { cwd: root,
  input: textFiles.map(file => `:${file}\n`).join(''), maxBuffer: 64 * 1024 * 1024 });
const contentsByFile = new Map();
let offset = 0;
for (const file of textFiles) {
  const end = objects.indexOf(10, offset), header = objects.subarray(offset, end).toString('utf8');
  const match = header.match(/^[a-f0-9]+ blob (\d+)$/);
  if (!match) throw new Error(`Unable to read staged file: ${file}`);
  const size = Number(match[1]);
  contentsByFile.set(file, objects.subarray(end + 1, end + 1 + size).toString('utf8'));
  offset = end + 2 + size;
}
for (const file of files) {
  if (/^(?:\.local|\.runtime|\.cache|work|release|dist|node_modules|openspec)\//.test(file)
    || file === 'AGENTS.md' || file.startsWith('docs/') && !publicDocs.has(file)
    || /(?:^|\/)(?:\.env(?:\..*)?|Cookies(?:-journal)?|bilibili-session\.bin(?:\.tmp)?)$/.test(file)
    || /\.(?:pem|key|pfx|p12|har|dmp|log|asar)$/i.test(file)) {
    issues.push(`${file}: excluded publication material`);
  }
  const contents = contentsByFile.get(file);
  if (contents === undefined) continue;
  const lines = contents.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const [kind, pattern] of patterns) if (pattern.test(line)) issues.push(`${file}:${index + 1}: ${kind}`);
  });
}
if (issues.length) { console.error(issues.join('\n')); process.exitCode = 1; }
else console.log(`Public index review: ${files.length} files; no matches in the defined privacy/credential rules.`);
// Pattern matching cannot certify the absence of every secret or inspect old commits.
