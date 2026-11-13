import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Builds /firebase-messaging-sw.js from sw/firebase-messaging-sw.template.js, filling in the
 * public Firebase web config from VITE_FIREBASE_* variables (served by the dev server too).
 * With no Firebase config the worker is still emitted but does nothing.
 */
function firebaseMessagingSw() {
  let env = {};
  const render = () => {
    const template = fs.readFileSync(path.resolve(__dirname, 'sw/firebase-messaging-sw.template.js'), 'utf8');
    const version = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'node_modules/firebase/package.json'), 'utf8')).version;
    const config = {
      apiKey: env.VITE_FIREBASE_API_KEY || '',
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: env.VITE_FIREBASE_APP_ID || '',
      measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || '',
    };
    return template.replaceAll('__FIREBASE_VERSION__', version).replace('__FIREBASE_CONFIG__', JSON.stringify(config, null, 2));
  };
  return {
    name: 'firebase-messaging-sw',
    configResolved(config) {
      env = loadEnv(config.mode, config.envDir || process.cwd(), 'VITE_');
    },
    configureServer(server) {
      server.middlewares.use('/firebase-messaging-sw.js', (req, res) => {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Service-Worker-Allowed', '/');
        res.setHeader('Cache-Control', 'no-cache');
        res.end(render());
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'firebase-messaging-sw.js', source: render() });
    },
  };
}

export default defineConfig({
  plugins: [react(), firebaseMessagingSw()],
  server: {
    port: 5175,
    host: true,
    strictPort: false
  }
});
