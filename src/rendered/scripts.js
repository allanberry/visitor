const reporter = require("../reporter.js");

const external_js = require("./scripts/external_js.js");
const internal_js = require("./scripts/internal_js.js");

/**
 * Analyze me some scripts
 */
async function main(html, url, date) {
  const branch = "rendered.scripts";

  try {
    const output = {
      branch,
      status: "ok",
      list: await list_scripts(html, url, date),
      combined: await combine_scripts(html, url, date),
    };
    output.aggregate = {
      length: output.combined.length,
    };
    return output;
  } catch (error) {
    return reporter.error(error, branch);
  }
}

async function list_scripts(html, url, date) {
  const base_url = new URL(url).origin;
  const external = await external_js(html, base_url, date),
    internal = await internal_js(html);
  const all_arrays = external.concat(internal);
  return all_arrays;
}

async function combine_scripts(html, url, date) {
  return await (await list_scripts(html, url, date)).reduce((sum, value) => {
    return sum + value.data;
  }, "");
}

module.exports = main;
