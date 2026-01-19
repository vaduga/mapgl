// vite.config.ts
import { defineConfig } from "vite";
import dts from 'vite-plugin-dts';
import { resolve } from 'path';
import fs from 'fs';

import typescript from "@rollup/plugin-typescript";
import path from "path";
import { typescriptPaths } from "rollup-plugin-typescript-paths";

export default defineConfig({
  /// for dynamic import in GeomapPanel.ts
  define: {
    'process.env.NODE_ENV': JSON.stringify('development'), // or 'development'
  },
  plugins: [],
  resolve: {
    alias: [
      {
        find: "~",
        replacement: path.resolve(__dirname, "./src"),
      },
    ],
  },
  server: {
    port: 3000,
  },
  build: {
    manifest: true,
    minify: true,
    reportCompressedSize: true,
    lib: {
      entry: path.resolve(__dirname, "src/main.ts"),
      name: "mapLib",
      fileName: "mapLib",
      formats: ["es"],
    },
    target: 'esnext',
    rollupOptions: {

      output: {
        assetFileNames: '[name][extname]',
      },

      plugins: [
        //wasm(),
        //topLevelAwait(),
        typescriptPaths({
          preserveExtensions: true,
        }) as Plugin,
        typescript({
          sourceMap: true,
          declaration: true,
          outDir: "dist",
        }) as Plugin,
        dts({
          insertTypesEntry: true,
          tsconfigPath: './tsconfig.json',
        }),
        {
          name: 'generate-utils-subpackage',
          closeBundle() {
            const srcPkg = resolve(__dirname, 'src/utils/package.json');
            const destDir = resolve(__dirname, 'utils');
            const destPkg = resolve(destDir, 'package.json');

            fs.mkdirSync(destDir, { recursive: true });
            fs.copyFileSync(srcPkg, destPkg);

            //console.log('Created subpackage: mapLib/utils');
          }
        },
      ],
    },
  },
});
