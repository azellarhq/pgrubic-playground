import { defineConfig } from 'vite';
import monacoEditorPlugin from 'vite-plugin-monaco-editor-esm';
export default defineConfig({ plugins: [monacoEditorPlugin()] });
