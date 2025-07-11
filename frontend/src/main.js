import toml from 'toml';

import { editor } from "monaco-editor";

import { configEditor } from './config-editor';
import { notify, copyToClipboard } from './utils';

let sqlEditor;
let sqlOutput;

sqlEditor = editor.create(document.getElementById('sqlEditor'), {
  value: 'CREATE TABLE users (id INT, name TEXT);',
  language: 'sql',
  theme: 'vs-light',
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbersMinChars: 0,
  lineDecorationsWidth: 0,
  overviewRulerLanes: 0,

});

// Copy to Clipboard
// function copyToClipboard(id) {
//   const element = document.getElementById(id);

//   if (element) {
//     navigator.clipboard.writeText(element.textContent).then(() => {
//       notify('Copied!', 'success');
//     }).catch(err => console.error('Failed to copy: ', err));
//   }
// }

// Format Code
async function formatCode() {
  const formattedOutput = document.getElementById('formatted-output');
  const lintOutput = document.getElementById('lintOutput');
  const formattedBox = document.querySelector('.formatted-box');
  const formattedLabel = document.getElementById('formattedLabel');

  lintOutput.innerHTML = '';
  formattedOutput.textContent = 'Formatting...';
  formattedLabel.textContent = 'Formatted SQL';
  let configObject;
  try {
    configObject = toml.parse(configEditor.getValue());
  } catch (error) {
    console.error("Error in config. Parsing error on line " + error.line + ", column " + error.column +
      ": " + error.message);
    lintOutput.innerHTML = `<span style="color:red">Config error: ${error.message}</span>`;
    notify('Config error', 'error');
    return;
  }
  await fetch('http://localhost:8000/api/v1/format', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_code: sqlEditor.getValue(),
      config: transformKeys(configObject)
    })
  })
    .then(response => response.json())
    .then(data => {
      console.log(data);
      formattedOutput.textContent = data.formatted_source_code;
      formattedBox.style.display = data.formatted_source_code ? 'flex' : 'none';
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

// Lint Code
async function lintCode() {
  const lintOutput = document.getElementById('lintOutput');
  const lintViolationsSummary = document.getElementById('lintViolationsSummary');
  let configObject;
  try {
    configObject = toml.parse(configEditor.getValue());
  } catch (error) {
    console.error("Error in config. Parsing error on line " + error.line + ", column " + error.column +
      ": " + error.message);
    lintOutput.innerHTML = `<span style="color:red">Config error: ${error.message}</span>`;
    notify('Error in config', 'error');
    return;
  }

  await fetch('http://localhost:8000/api/v1/lint', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_code: sqlEditor.getValue(),
      config: transformKeys(configObject)
    })
  })
    .then(response => response.json())
    .then(data => {
      lintViolationsSummary.innerHTML = `Hi! I found  ${data.violations.length} violations for you to look at!`;
      lintOutput.innerHTML = printViolations(data.violations || []);
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

// Lint & Fix Code
async function lintAndFix() {
  const lintOutput = document.getElementById('lint-output');
  const formattedOutput = document.getElementById('formatted-output');
  const formattedBox = document.querySelector('.formatted-box');
  const formattedLabel = document.getElementById('formattedLabel');

  lintOutput.innerHTML = 'Linting with fix...';
  formattedLabel.textContent = 'Formatted SQL';

  let configObject;
  try {
    configObject = toml.parse(configEditor.getValue());
  } catch (error) {
    console.error("Parsing error on line " + error.line + ", column " + error.column +
      ": " + error.message);
    lintOutput.innerHTML = `<span style="color:red">Config error: ${error.message}</span>`;
    notify('Error in config', 'error');
    return;
  }
  console.log(configObject);
  lintOutput.innerHTML = 'Linting...';
  console.log(JSON.stringify({
    source_code: sqlEditor.getValue(),
    config: transformKeys(configObject),
    with_fix: true
  }))

  await fetch('http://localhost:8000/api/v1/lint', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_code: sqlEditor.getValue(),
      config: transformKeys(configObject),
      with_fix: true
    })
  })
    .then(response => response.json())
    .then(data => {
      lintOutput.innerHTML = printViolations(data.violations || []);
      if (data.fixed_source_code && data.fixed_source_code.trim()) {
        formattedOutput.textContent = data.fixed_source_code;
        formattedBox.style.display = 'flex';
        syncFormattedBoxHeight();
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

// function notify(message, type = 'success') {
//   const n = document.createElement('div');
//   n.className = `notification ${type}`;
//   n.textContent = message;
//   document.body.appendChild(n);
//   setTimeout(() => n.remove(), 3000);
// }

// Print Lint Violations
function printViolations(violations) {
  if (!violations.length) {
    return `<div class="no-violations">All checks passed! 🎉🎉🎉.</div>`;
  }

  let html = "";
  violations.forEach(v => {
    html += `<span><b>${v.rule_code}</b> ${v.line}: ${v.column_offset} ${v.description}<hr></span>`;
  }
  );
  return html;
}

function toSnakeCase(str) {
  return str.replace(/-/g, '_');
}

function transformKeys(obj) {
  if (Array.isArray(obj)) {
    return obj.map(transformKeys);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [toSnakeCase(k), transformKeys(v)])
    );
  } else {
    return obj;
  }
}

// Hook Up Buttons Once DOM is Ready
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('formatBtn').onclick = formatCode;
  document.getElementById('lintBtn').onclick = lintCode;
  document.getElementById('lintFixBtn').onclick = lintAndFix;
  // document.getElementById("resetConfigBtn").onclick = () => {
  //   configEditor.setValue(defaultConfigTOML);
  //   notify("Configuration reset to default!", "info");
  // };
  document.getElementById('copyBtn').onclick = function () {
    copyToClipboard('formatted-output');
  };
});

