// Core functions

import toml from "toml";

// Format SQL
async function formatSql(sql, config) {
  const sqlOutputBox = document.getElementById("sqlOutputBox");
  const sqlOutput = document.getElementById("sqlOutput");
  const sqlOutputLabel = document.getElementById("sqlOutputLabel");
  const lintOutput = document.getElementById("lintOutput");
  const lintViolationsSummary = document.getElementById("lintViolationsSummary");

  lintOutput.innerHTML = "";
  lintViolationsSummary.innerHTML = "";

  sqlOutputLabel.textContent = "Formatted SQL";

  let configObject;
  console.log(config);
  try {
    configObject = toml.parse(config);
  } catch (error) {
    console.error("Error in config. Parsing error on line " + error.line + ", column " + error.column +
      ": " + error.message);
    notify("Config error", "error");
    return;
  }

  await fetch("http://localhost:8000/api/v1/format", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source_code: sql,
      config: transformKeys(configObject)
    })
  })
    .then(response => response.json())
    .then(data => {
      console.log(data);
      sqlOutput.textContent = data.formatted_source_code;
      sqlOutputBox.style.display = data.formatted_source_code ? "flex" : "none";
    })
    .catch(error => {
      console.error("Error:", error);
    });
}

// Lint SQL
async function lintSql(configEditor) {
  const lintOutput = document.getElementById("lintOutput");
  const lintViolationsSummary = document.getElementById("lintViolationsSummary");

  let configObject;
  try {
    configObject = toml.parse(config);
  } catch (error) {
    console.error("Error in config. Parsing error on line " + error.line + ", column " + error.column +
      ": " + error.message);
    notify("Error in config", "error");
    return;
  }

  await fetch("http://localhost:8000/api/v1/lint", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source_code: sql,
      config: transformKeys(configObject)
    })
  })
    .then(response => response.json())
    .then(data => {
      lintViolationsSummary.innerHTML = `Hi! I found  ${data.violations.length} violations for you to look at!`;
      lintOutput.innerHTML = printViolations(data.violations || []);
    })
    .catch(error => {
      console.error("Error:", error);
    });
}

// Lint & Fix SQL
async function lintAndFixSql(configEditor) {
  const lintOutput = document.getElementById("lintOutput");
  const lintViolationsSummary = document.getElementById("lintViolationsSummary");
  const sqlOutputBox = document.getElementById("sqlOutputBox");
  const sqlOutput = document.getElementById("sqlOutput");
  const sqlOutputLabel = document.getElementById("sqlOutputLabel");

  lintOutput.innerHTML = "Linting with fix...";
  sqlOutputLabel.textContent = "Fixed SQL";

  let configObject;
  try {
    configObject = toml.parse(config);
  } catch (error) {
    console.error("Parsing error on line " + error.line + ", column " + error.column +
      ": " + error.message);
    notify("Error in config", "error");
    return;
  }

  await fetch("http://localhost:8000/api/v1/lint", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source_code: sql,
      config: transformKeys(configObject),
      with_fix: true
    })
  })
    .then(response => response.json())
    .then(data => {
      lintViolationsSummary.innerHTML = `Hi! I found  ${data.violations.length} violations for you to look at!`;
      lintOutput.innerHTML = printViolations(data.violations || []);

      sqlOutput.textContent = data.fixed_source_code;
      sqlOutputBox.style.display = "flex";
    })
    .catch(error => {
      console.error("Error:", error);
    });
}

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

export {
  formatSql,
  lintSql,
  lintAndFixSql,
  printViolations
};
