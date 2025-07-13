const defaultConfigTOML = `[lint]
postgres-target-version = 14
select = []
ignore = []
fixable = []
unfixable = []
ignore-noqa = false
disallowed-schemas = []
allowed-extensions = []
allowed-languages = []
disallowed-data_types = []
required-columns = []
timestamp-column-suffix = "_at"
date-column-suffix = "_date"
regex-partition = "^.+$"
regex-index = "^.+$"
regex-constraint-primary_key = "^.+$"
regex-constraint-unique_key = "^.+$"
regex-constraint-foreign_key = "^.+$"
regex-constraint-check = "^.+$"
regex-constraint-exclusion = "^.+$"
regex-sequence = "^.+$"

[format]
comma-at-beginning = true
new-line-before-semicolon = false
remove-pg-catalog-from-functions = true
lines-between-statements = 1`;

function toSnakeCase(str) {
  return str.replace(/-/g, "_");
}

function transformKeys(obj) {
  if (Array.isArray(obj)) {
    return obj.map(transformKeys);
  } else if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [toSnakeCase(k), transformKeys(v)])
    );
  } else {
    return obj;
  }
}

export { transformKeys, defaultConfigTOML };
