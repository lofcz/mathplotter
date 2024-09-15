import { defineConfig } from 'vite'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJson = JSON.parse(readFileSync(path.join(__dirname, 'package.json'), 'utf-8'));
const header = `
/**
 * Plotter.js
 * Version: ${packageJson.version}
 * Author: ${packageJson.author}
 * License: ${packageJson.license}
 */
`;

// Vlastní plugin pro přidání hlavičky
function addHeaderPlugin() {
    return {
      name: 'add-header',
      generateBundle(options, bundle) {
        for (const fileName in bundle) {
          const chunk = bundle[fileName]
          if (chunk.type === 'chunk' && chunk.isEntry) {
            chunk.code = header + chunk.code
          }
        }
      }
    }
}

export default defineConfig({
    build: {
      manifest: true,
      rollupOptions: {
        input: '/plotter.js',
        output: {
            entryFileNames: 'plotter.js'
        },
        plugins: [
            addHeaderPlugin()
        ]
      }
    }
  })