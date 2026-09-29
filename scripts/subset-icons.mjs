// Rebuilds public/fonts/material-symbols-outlined.woff2 with only the icons the site uses.
// The full font is 3.7 MB; the subset is ~35 KB. Run after using a new icon:  npm run icons
// ponytail: keeps every source word that is also an icon name — a few extras, never a missing icon.
import fs from 'fs'
import path from 'path'

const root = path.resolve(import.meta.dirname, '..')
const CODEPOINTS =
  'https://raw.githubusercontent.com/google/material-design-icons/master/variablefont/MaterialSymbolsOutlined%5BFILL%2CGRAD%2Copsz%2Cwght%5D.codepoints'

const all = new Set((await (await fetch(CODEPOINTS)).text()).split('\n').map((l) => l.split(' ')[0]).filter(Boolean))

const words = new Set()
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p)
    else if (/\.(tsx?|jsx?|html)$/.test(e.name)) for (const w of fs.readFileSync(p, 'utf8').match(/[a-z0-9_]+/g) || []) words.add(w)
  }
}
walk(path.join(root, 'src'))
walk(path.join(root, 'public'))
for (const w of fs.readFileSync(path.join(root, 'index.html'), 'utf8').match(/[a-z0-9_]+/g) || []) words.add(w)

const names = [...words].filter((w) => all.has(w)).sort()
const css = await (
  await fetch(
    `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&icon_names=${names.join(',')}&display=block`,
    { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36' } },
  )
).text()
const url = css.match(/url\((https:[^)]+)\)/)?.[1]
if (!url) throw new Error('Google Fonts did not return a font URL:\n' + css.slice(0, 300))

const out = path.join(root, 'public/fonts/material-symbols-outlined.woff2')
fs.writeFileSync(out, Buffer.from(await (await fetch(url)).arrayBuffer()))
console.log(`${names.length} icons → ${Math.round(fs.statSync(out).size / 1024)} KB  (${out})`)
