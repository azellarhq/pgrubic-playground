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
    }).catch(err => console.error("Failed to copy: ", err));
  }
}

// Print Lint Violations
function printViolations(violations) {
  var html = "";

  violations.forEach(v => {
    html += `<span><b>${v.description} </b>(${v.rule_code}) [Ln ${v.line_number}, Col ${v.column_offset}] <hr></span>`;
  }
  );

  return html;
}

function printErrors(errors) {
  var html = "";
  errors.forEach(e => {
    html += `<span><b>${e.message} </b>(${e.hint}) <hr></span>`;
  }
  );
  return html;
}

export { notify, copyToClipboard, printViolations, printErrors };
