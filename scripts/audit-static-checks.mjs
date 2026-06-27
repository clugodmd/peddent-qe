import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const settings = read('src/pages/Settings.jsx');
assert(
  /const\s*\{\s*user\s*,\s*logOut\s*,\s*resetPassword\s*\}\s*=\s*useAuth\(\)/.test(settings) ||
    /resetPassword/.test(settings.split('useAuth()')[0] || ''),
  'Settings.jsx must pull resetPassword from useAuth before calling it.'
);
assert(
  /await\s+resetPassword\(user\.email\)/.test(settings),
  'Settings.jsx must call resetPassword(user.email).'
);

const supportBot = read('src/utils/supportBot.js');
assert(
  !/100\.123\.132\.50/.test(supportBot),
  'supportBot.js must not hardcode the private support bot IP.'
);
assert(
  /import\.meta\.env\.VITE_SUPPORT_BOT_URL/.test(supportBot),
  'supportBot.js must read VITE_SUPPORT_BOT_URL from Vite env.'
);

const faq = read('public/faq.html');
assert(
  !/billing\.stripe\.com\/p\/login\/test/.test(faq),
  'faq.html must not link to Stripe test billing portal.'
);

console.log('PedsDentQE audit static checks passed');
