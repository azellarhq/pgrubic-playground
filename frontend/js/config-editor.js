const defaultConfigTOML = `[lint]
# Target version 14 of PostgreSQL by default
postgres-target-version = 14
select = []
ignore = []
include = []
exclude = []
ignore-noqa = false
disallowed-schemas = []
allowed-extensions = []
allowed-languages = []
fix = false
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
include = []
exclude = []
comma-at-beginning = true
new-line-before-semicolon = false
remove-pg-catalog-from-functions = true
lines-between-statements = 1
check = false
diff = false
no-cache = false
`;

let configEditor;

require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.34.1/min/vs' } });

require(['vs/editor/editor.main'], function () {
  configEditor = monaco.editor.create(document.getElementById('config-editor'), {
    value: defaultConfigTOML,
    language: 'toml',
    theme: 'vs-light',
    automaticLayout: true,
    minimap: {
      enabled: false
    },
    fontSize: 14,             // Increased font size
  lineHeight: 22
  });

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
});
