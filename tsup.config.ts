import { defineConfig } from 'tsup';

export default defineConfig({
  // Entry points
  entry: ['src/index.ts'],
  
  // Output formats
  format: ['cjs', 'esm'],
  
  // Generate .d.ts files
  dts: true,
  
  // Output directory
  outDir: 'dist',
  
  // Clean output directory before build
  clean: true,
  
  // Generate source maps
  sourcemap: true,
  
  // Minify output (optional)
  minify: false,
  
  // Split chunks for better tree shaking
  splitting: false,
  
  // Keep original file names
  keepNames: true,
  
  // Target environment
  target: 'es2020',
  
  // External dependencies (don't bundle)
  external: ['@adobe/aio-sdk'],
  
  // Preserve .mjs extension for ESM
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.js',
    };
  },
});
