import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// Sample URL to download the screenshot
// https://api.screenshotmachine.com?key=184ec7&url=https://dipen-dedania.github.io/&dimension=1024x768

const API_KEY = '184ec7';
const API_KEY_v2 = '540061';
const SCREENSHOT_DIR = join(ROOT, 'public', 'screenshots');

// Create directory if it doesn't exist
if (!existsSync(SCREENSHOT_DIR)) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// 1. Read data.md
const readme = readFileSync(join(ROOT, 'data.md'), 'utf-8');

// 2. Extract the block between markers
const startMarker = '<!-- PROFILES-START -->';
const endMarker = '<!-- PROFILES-END -->';
const startIdx = readme.indexOf(startMarker);
const endIdx = readme.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find PROFILES-START / PROFILES-END markers in data.md');
  process.exit(1);
}

const block = readme.slice(startIdx + startMarker.length, endIdx).trim();

// 3. Split by "---" separator
const rawEntries = block.split('---').map(s => s.trim()).filter(Boolean);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function downloadScreenshot(username, siteUrl) {
  const fileDest = join(SCREENSHOT_DIR, `${username}.png`);
  if (existsSync(fileDest)) {
    console.log(`Skipping ${username}, screenshot already exists.`);
    return false;
  }
  
  // Create API URL
  const apiUrl = `https://api.screenshotmachine.com?key=${API_KEY_v2}&url=${encodeURIComponent(siteUrl)}&dimension=1024x768`;
  
  console.log(`Downloading screenshot for ${username} from ${siteUrl}...`);
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    writeFileSync(fileDest, buffer);
    console.log(`✅ Saved ${username}.png`);
    return true;
  } catch (error) {
    console.error(`❌ Error downloading for ${username}: ${error.message}`);
    return false;
  }
}

async function main() {
  for (const entry of rawEntries) {
    const lines = entry.split('\n').map(l => l.trim()).filter(Boolean);

    let repoUrl = null;
    let siteUrl = null;

    for (const line of lines) {
      if (line.startsWith('Repo -') || line.startsWith('Repo-')) {
        repoUrl = line.replace(/^Repo\s*-\s*/, '').trim();
      } else if (line.startsWith('Link -') || line.startsWith('Link-')) {
        siteUrl = line.replace(/^Link\s*-\s*/, '').trim();
      }
    }

    if (!repoUrl || !siteUrl) continue;

    let username = null;
    try {
      const u = new URL(repoUrl);
      const parts = u.pathname.split('/').filter(Boolean);
      username = parts[0]; // e.g., 'vivek9patel' from github.com/vivek9patel/repo
    } catch {
      continue;
    }

    if (username && siteUrl) {
      const downloaded = await downloadScreenshot(username, siteUrl);
      if (downloaded) {
        // Adding a delay to avoid rate limiting or overwhelming the API
        await delay(1000);
      }
    }
  }
  
  console.log('✅ Done downloading all screenshots.');
}

main();
