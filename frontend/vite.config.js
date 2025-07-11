// import { defineConfig } from 'vite';
// import monacoEditorPlugin from 'vite-plugin-monaco-editor'; // ✅ CORRECT

// export default defineConfig({
//   plugins: [monacoEditorPlugin()],
//   build: {
//     outDir: 'dist',
//     emptyOutDir: true,
//   },
// });

import { defineConfig } from 'vite';
import monacoEditorPlugin from 'vite-plugin-monaco-editor-esm';
export default defineConfig({ plugins: [monacoEditorPlugin()] });

// import { defineConfig } from 'vite';
// import { monacoEditorPlugin } from 'vite-plugin-monaco-editor'; // ✅ named import

// export default defineConfig({
//   plugins: [monacoEditorPlugin()],
//   build: {
//     outDir: 'dist',
//     emptyOutDir: true,
//   },
// });
