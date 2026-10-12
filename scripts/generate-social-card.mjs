import { join } from "node:path";
import sharp from "sharp";

const projectRoot = process.cwd();
const logoPath = join(
  projectRoot,
  "public",
  "brand",
  "pro-concursos-logo-dark.png",
);
const outputPath = join(
  projectRoot,
  "public",
  "brand",
  "pro-concursos-social.png",
);

const background = Buffer.from(`
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#181820"/>
        <stop offset="1" stop-color="#242039"/>
      </linearGradient>
      <radialGradient id="purple" cx="0" cy="0" r="1" gradientTransform="translate(180 100) rotate(36) scale(620 460)">
        <stop stop-color="#6c5ce7" stop-opacity="0.34"/>
        <stop offset="1" stop-color="#6c5ce7" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="orange" cx="0" cy="0" r="1" gradientTransform="translate(1080 560) rotate(-145) scale(470 340)">
        <stop stop-color="#f9a826" stop-opacity="0.22"/>
        <stop offset="1" stop-color="#f9a826" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1200" height="630" rx="0" fill="url(#background)"/>
    <rect width="1200" height="630" fill="url(#purple)"/>
    <rect width="1200" height="630" fill="url(#orange)"/>
    <path d="M0 544 C260 476 368 670 672 566 C886 492 1020 482 1200 526 V630 H0 Z" fill="#0f0f14" fill-opacity="0.58"/>
    <text x="82" y="340" fill="#ffffff" font-family="Arial, sans-serif" font-size="52" font-weight="700">Estudo integrado para</text>
    <text x="82" y="402" fill="#ffffff" font-family="Arial, sans-serif" font-size="52" font-weight="700">concursos públicos</text>
    <text x="84" y="476" fill="#c4b5fd" font-family="Arial, sans-serif" font-size="24" font-weight="700" letter-spacing="3">RESUMOS  •  LEGISLAÇÃO  •  QUESTÕES</text>
    <text x="84" y="574" fill="#b4b1c3" font-family="Arial, sans-serif" font-size="22">proconcursos.com.br</text>
  </svg>
`);

const logo = await sharp(logoPath)
  .resize({ width: 500, withoutEnlargement: true })
  .png()
  .toBuffer();

await sharp(background)
  .composite([{ input: logo, left: 82, top: 68 }])
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(outputPath);

const metadata = await sharp(outputPath).metadata();
if (metadata.width !== 1200 || metadata.height !== 630) {
  throw new Error("A imagem social deve possuir exatamente 1200 × 630 pixels.");
}

console.log(`Imagem social gerada: ${outputPath}`);
