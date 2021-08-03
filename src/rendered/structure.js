const reporter = require("../reporter.js");

async function main(html) {
  const branch = "rendered.structure";

  try {
    return {
      branch,
      status: "ok",
      data: html,
      aggregate: {
        length: html.length,
      },
    };
  } catch (error) {
    return reporter.error(error, branch);
  }
}

module.exports = main;
