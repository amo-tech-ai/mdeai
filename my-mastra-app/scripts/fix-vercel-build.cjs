#!/usr/bin/env node
// Patches Vercel prebuilt output after `mastra build`:
//   1. Forces nodejs22.x runtime (mastra build reads process.version which may be 25.x)
//   2. Adds /chat → function route so the Mastra chat endpoint isn't swallowed by the Studio SPA

const fs = require('fs');

const vcConfigPath = '.vercel/output/functions/index.func/.vc-config.json';
const routesConfigPath = '.vercel/output/config.json';

try {
  const vc = JSON.parse(fs.readFileSync(vcConfigPath, 'utf8'));
  vc.runtime = 'nodejs22.x';
  fs.writeFileSync(vcConfigPath, JSON.stringify(vc, null, 2) + '\n');
  console.log('[postbuild] patched runtime → nodejs22.x');
} catch (e) {
  console.warn('[postbuild] .vc-config.json not found, skipping:', e.message);
}

try {
  const cfg = JSON.parse(fs.readFileSync(routesConfigPath, 'utf8'));
  const hasChat = cfg.routes.some(r => r.src === '/chat');
  if (!hasChat) {
    // Insert before {"handle":"filesystem"} so /chat hits the function, not the Studio SPA
    const fsIdx = cfg.routes.findIndex(r => r.handle === 'filesystem');
    const insertAt = fsIdx >= 0 ? fsIdx : 2;
    cfg.routes.splice(insertAt, 0, { src: '/chat', dest: '/' });
    fs.writeFileSync(routesConfigPath, JSON.stringify(cfg) + '\n');
    console.log('[postbuild] added /chat → function route');
  }
} catch (e) {
  console.warn('[postbuild] config.json not found, skipping:', e.message);
}
