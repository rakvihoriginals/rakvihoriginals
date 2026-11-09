// Run manually when the home-page source frames change. One encoder at a time
// keeps asset preparation from competing with the local app for CPU/memory.
// Pass source folder names to rebuild only those, e.g. `node scripts/optimize-home-frames.cjs hero2-frames-png`.
const sharp = require('sharp');
const { mkdir, readdir, stat } = require('node:fs/promises');
const path = require('node:path');
sharp.concurrency(1);
sharp.cache(false);
const allSources = ['hero1-frames-full', 'hero2-frames-png', 'hero5-frames-png', 'hero6-frames-png'];
const sources = process.argv.length > 2 ? process.argv.slice(2) : allSources;
(async () => {
  let inputBytes = 0, outputBytes = 0, mobileBytes = 0, count = 0, mobileCount = 0;
  for (const source of sources) {
    const files = (await readdir(path.join('public', source))).filter(name => name.endsWith('.webp')).sort();
    const dir = path.join('public', 'home-frames', '1080p', source);
    const mobileDir = path.join('public', 'home-frames', '540p', source);
    await mkdir(dir, { recursive: true });
    await mkdir(mobileDir, { recursive: true });
    for (const [index, name] of files.entries()) {
      const input = path.join('public', source, name);
      // Lanczos downscale from the 2560px masters, high quality and full-resolution chroma.
      const info = await sharp(input)
        .resize({ width: 1920, height: 1080, fit: 'cover', kernel: 'lanczos3' })
        .webp({ quality: 88, effort: 4, smartSubsample: true })
        .toFile(path.join(dir, name));
      outputBytes += info.size;
      inputBytes += (await stat(input)).size;
      count++;
      // Mobile playback uses every fifth source frame, so only build those at half-size.
      if (index % 5 === 0) {
        const mobileInfo = await sharp(input)
          .resize({ width: 960, height: 540, fit: 'cover', kernel: 'lanczos3' })
          .webp({ quality: 80, effort: 4, smartSubsample: true })
          .toFile(path.join(mobileDir, name));
        mobileBytes += mobileInfo.size;
        mobileCount++;
      }
    }
    console.log(`${source}: ${files.length} frames ready`);
  }
  console.log(JSON.stringify({
    count,
    sourceMB: +(inputBytes / 1048576).toFixed(1),
    outputMB: +(outputBytes / 1048576).toFixed(1),
    mobileCount,
    mobileOutputMB: +(mobileBytes / 1048576).toFixed(1),
  }));
})().catch(error => { console.error(error); process.exitCode = 1; });
