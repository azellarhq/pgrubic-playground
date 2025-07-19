// Test editors

import { it, expect, describe } from "vitest"

import { transformKeys } from "../src/editors"

it("transformKeys should handle objects", () => {
  const input = { "some-key": [{ "some-key": "value" }, { "another-key": "value2" }]}
  const output = transformKeys(input)
  expect(output).toEqual({ "some_key": [{ "some_key": "value" }, { "another_key": "value2" }]})
})
