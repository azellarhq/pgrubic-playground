// Utils

function notify(message, type = "success") {
  const n = document.createElement("div");
  n.className = `notification ${type}`;
  n.textContent = message;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 1000);
}

function copyToClipboard(id) {
  const element = document.getElementById(id);

  if (element) {
    navigator.clipboard.writeText(element.textContent).then(() => {
      notify("Copied!", "success");
    }).catch(err => console.error("Failed to copy: ", err));
  }
}

// Print Lint Violations
function printViolations(violations) {
  var html = "";

  violations.forEach(v => {
    html += `<span><b>${v.rule_code}</b> ${v.line}: ${v.column_offset} ${v.description}<hr></span>`;
  }
  );

  return html;
}

export { notify, copyToClipboard, printViolations };

export const API_BASE_URL = "/api/v1"
