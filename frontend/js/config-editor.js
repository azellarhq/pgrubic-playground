import * as monaco from 'monaco-editor';

const defaultConfigTOML = `[lint]
postgres_target_version = 14
select = []
ignore = []
ignore-noqa = false
disallowed-schemas = []
allowed-extensions = []
allowed-languages = []
disallowed-data-types = []
required-columns = []
timestamp-column-suffix = "_at"
date-column-suffix = "_date"
regex-partition = "^.+$"
regex-index = "^.+$"
regex-constraint-primary-key = "^.+$"
regex-constraint-unique-key = "^.+$"
regex-constraint-foreign-key = "^.+$"
regex-constraint-check = "^.+$"
regex-constraint-exclusion = "^.+$"
regex-sequence = "^.+$"

[format]
comma-at-beginning = true
new-line-before-semicolon = false
remove-pg-catalog-from-functions = true
lines-between-statements = 1`;

// let configEditor;
// require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.34.1/min/vs' } });

// require(['vs/editor/editor.main'], function () {
//   configEditor = monaco.editor.create(document.getElementById('config-editor'), {
//   value: defaultConfigTOML,
//   language: 'toml',
//   theme: 'vs-light',
//   minimap: { enabled: false },
//   automaticLayout: true,
//   scrollBeyondLastLine: false,
//   lineNumbersMinChars: 3,
//   lineDecorationsWidth: 0,
//   scrollbar: {vertical: 'hidden',horizontal: 'hidden'},
//   overviewRulerLanes: 0,
//   renderLineHighlight: 'none',
//   renderSelectionHighlight: 'none',
//   renderIndentGuides: false,
//   guides: {indentation: false, bracketPairs: false},
//   // renderLineHighlightOnlyWhenFocus: false,
//   // renderValidationDecorations: 'off',
//   // renderWhitespace: 'none',
//   // renderControlCharacters: false,
//   // renderIndentGuides: false,
//   // renderFinalNewline: false,
//   // renderLineNumbers: 'off',
// });

export const configEditor = monaco.editor.create(document.getElementById('config-editor'), {
  value: defaultConfigTOML,
  language: 'toml',
  theme: 'vs-light',
  minimap: { enabled: false },
  automaticLayout: true,
  scrollBeyondLastLine: false,
  lineNumbersMinChars: 3,
  lineDecorationsWidth: 0,
  scrollbar: {vertical: 'hidden',horizontal: 'hidden'},
  overviewRulerLanes: 0,
  renderLineHighlight: 'none',
  renderSelectionHighlight: 'none',
  renderIndentGuides: false,
  guides: {indentation: false, bracketPairs: false},
  // renderLineHighlightOnlyWhenFocus: false,
  // renderValidationDecorations: 'off',
  // renderWhitespace: 'none',
  // renderControlCharacters: false,
  // renderIndentGuides: false,
  // renderFinalNewline: false,
  // renderLineNumbers: 'off',
});

configEditor.onKeyDown((e) => {
  if (e.keyCode === monaco.KeyCode.Enter) {
    e.preventDefault(); // Prevents adding a new line
  }
});

// require(['vs/editor/editor.main'], function () {
//   configEditor = monaco.editor.create(document.getElementById('config-editor'), {
//     value: defaultConfigTOML,
//     language: 'toml',
//     theme: 'vs-light',
//     automaticLayout: true,
//     minimap: {
//       enabled: false
//     },
//     fontSize: 14,             // Increased font size
//   lineHeight: 22,
//   scrollBeyondLastLine: false,
//   });

  document.getElementById('config-toggle').onclick = () => {
    const sidebar = document.getElementById('sidebar');
    const arrow = document.getElementById('config-arrow');
    const isOpen = sidebar.classList.toggle('active');
    arrow.textContent = isOpen ? '−' : '+';

    if (configEditor) {
      setTimeout(() => configEditor.layout(), 310);
    }
  };

  document.getElementById('reset-config-btn').onclick = () => {
    configEditor.setValue(defaultConfigTOML);
    alert('Configuration reset to default!');
  };
