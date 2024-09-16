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
    lib: {
      entry: path.resolve(__dirname, 'plotter.js'),
      name: 'MathPlotter',
      fileName: (format) => `plotter.min.js`,
      formats: ['umd']
    },
    rollupOptions: {
      output: {
        globals: {
          MathPlotter: 'MathPlotter'
        }
      }
    },
    target: 'es2016',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      },
      format: {
        comments: false
      }
    }
  },
  plugins: [
    addHeaderPlugin(),
    {
      name: 'vite-plugin-scss',
      buildStart() {
        this.emitFile({
          type: 'asset',
          fileName: 'plotter.css',
          source: readFileSync(path.resolve(__dirname, 'plotter.scss'), 'utf-8')
        });
      }
    }
  ]
})
