// Makes uploads web-friendly at build time: a 960 px "-sm" copy for phones next to every image that lacks one.
// On Netlify it also shrinks oversized originals (max 2400 px wide) in the build copy only.
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const enc = (img, ext) => (/png/i.test(ext) ? img.png({ compressionLevel: 9 }) : /webp/i.test(ext) ? img.webp({ quality: 80 }) : img.jpeg({ quality: 80, mozjpeg: true }));

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'media');
for (const f of readdirSync(dir)) {
  const m = f.match(/^(.+?)(-sm)?\.(jpe?g|png|webp)$/i);
  if (!m || m[2]) continue;
  const src = join(dir, f);
  const sm = join(dir, `${m[1]}-sm.${m[3]}`);
  if (process.env.NETLIFY) {
    const meta = await sharp(src).metadata();
    if (meta.width > 2400 || statSync(src).size > 900_000) {
      const buf = await enc(sharp(src).rotate().resize({ width: 2400, withoutEnlargement: true }), m[3]).toBuffer();
      await sharp(buf).toFile(src);
      console.log('optimised', f);
    }
  }
  if (!existsSync(sm)) {
    await enc(sharp(src).rotate().resize({ width: 960, withoutEnlargement: true }), m[3]).toFile(sm);
    console.log('made', `${m[1]}-sm.${m[3]}`);
  }
}
