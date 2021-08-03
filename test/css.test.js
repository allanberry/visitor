const fsp = require("fs").promises;
var validate = require('jsonschema').validate;


function sum(a, b) {
  return a + b;
}

/**
 * internal_sheets
 */
describe("visits", () => {
  const schema = ""
  const visit = ""

  test('validate works', () => {
    expect(validate(4, {"type": "number"})).toBe(true);
  });
});