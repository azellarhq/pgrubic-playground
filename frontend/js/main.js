let editor;

// Load Monaco Editor for SQL
require(['vs/editor/editor.main'], function () {
  editor = monaco.editor.create(document.getElementById('editor-container'), {
    value: 'CREATE TABLE users (id INT, name TEXT);',
    language: 'sql',
    theme: 'vs-light',
    automaticLayout: true,
    minimap: {
      enabled: false
    }
  });
});

// Hamburger Menu
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('top-links').classList.toggle('show');
});

// Copy to Clipboard
function copyToClipboard(id, button) {
  const el = document.getElementById(id);
  const message = button.nextElementSibling;

  if (el) {
    navigator.clipboard.writeText(el.textContent).then(() => {
      message.style.opacity = '1';
      message.style.transform = 'translateY(0)';
      setTimeout(() => {
        message.style.opacity = '0';
        message.style.transform = 'translateY(5px)';
      }, 1500);
    }).catch(err => console.error('Failed to copy: ', err));
  }
}
function syncFormattedBoxHeight() {
  const editorContainer = document.getElementById('editor-container');
  const formattedBox = document.querySelector('.formatted-box');
  const formattedOutput = document.getElementById('formatted-output');

  if (!editorContainer || !formattedBox || !formattedOutput) return;

  const editorHeight = editorContainer.offsetHeight;

  formattedBox.style.height = `${editorHeight}px`;
  formattedOutput.style.maxHeight = `${editorHeight}px`;
}


// Format Code
async function formatCode() {
  const formattedOutput = document.getElementById('formatted-output');
  const lintOutput = document.getElementById('lint-output');
  const formattedBox = document.querySelector('.formatted-box');

  lintOutput.innerHTML = '';
  formattedOutput.textContent = 'Formatting...';

  try {
    const res = await fetch('http://localhost:8000/format', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: editor.getValue(),
        config: configEditor.getValue()  // comes from config-editor.js
      })
    });

    const data = await res.json();

    if (data.error || data.errors) {
      lintOutput.innerHTML = `<span style="color:red">${data.error || JSON.stringify(data.errors)}</span>`;
      formattedBox.style.display = 'none';
    } else {
      formattedOutput.textContent = data.formatted || '';
      formattedBox.style.display = data.formatted ? 'flex' : 'none';
      syncFormattedBoxHeight();
    }
  } catch (error) {
    lintOutput.innerHTML = `<span style="color:red">Request failed: ${error.message}</span>`;
    formattedBox.style.display = 'none';
  }
}

// Lint Code
async function lintCode() {
  const lintOutput = document.getElementById('lint-output');
  lintOutput.innerHTML = 'Linting...';

  try {
    const res = await fetch('http://localhost:8000/lint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: editor.getValue(),
        config: configEditor.getValue()
      })
    });

    const data = await res.json();
    lintOutput.innerHTML = renderViolations(data.violations || []);

  } catch (error) {
    lintOutput.innerHTML = `<span style="color:red">Error: ${error.message}</span>`;
  }
}

// Lint & Fix Code
async function lintAndFix() {
  const lintOutput = document.getElementById('lint-output');
  const formattedOutput = document.getElementById('formatted-output');
  const formattedBox = document.querySelector('.formatted-box');

  lintOutput.innerHTML = 'Linting and Fixing...';
  formattedOutput.textContent = '';
  formattedBox.style.display = 'none';

  try {
    const res = await fetch('http://localhost:8000/lint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: editor.getValue(),
        config: configEditor.getValue(),
        fix: true
      })
    });

    const data = await res.json();
    lintOutput.innerHTML = renderViolations(data.violations || []);

    if (data.fixed_source && data.fixed_source.trim()) {
      formattedOutput.textContent = data.fixed_source;
      formattedBox.style.display = 'flex';
      syncFormattedBoxHeight();
    }

  } catch (error) {
    lintOutput.innerHTML = `<span style="color:red">❌ Request failed: ${escapeHtml(error.message)}</span>`;
  }
}

// Render Lint Violations
function renderViolations(violations) {
  if (!violations.length) {
    return `<div class="no-violations">✅ No violations found.</div>`;
  }

  let html = `
    <div class="violation-table-container">
      <table class="violation-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Line</th>
            <th>Description</th>
            <th>Help</th>
            <th>Auto-fixable?</th>
          </tr>
        </thead>
        <tbody>
  `;

  violations.forEach(v => {
    html += `
      <tr>
        <td>${escapeHtml(v.rule_code || '')}</td>
        <td>${v.line_number ?? ''}</td>
        <td>${escapeHtml(v.description || '')}</td>
        <td>${escapeHtml(v.help || '')}</td>
        <td>${v.is_auto_fixable ? 'Yes' : 'No'}</td>
      </tr>
    `;
  });

  html += `</tbody></table></div>`;
  return html;
}

// Escape HTML
function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}


// Hook Up Buttons Once DOM is Ready
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('format-btn').onclick = formatCode;
  document.getElementById('lint-btn').onclick = lintCode;
  document.getElementById('lintfix-btn').onclick = lintAndFix;
  syncFormattedBoxHeight(); 
});
window.addEventListener('resize', syncFormattedBoxHeight);

