const fsp = require('fs').promises
const axios = require("axios");
const geoip = require("geoip-lite");
const moment = require("moment");
const del = require("del");

const CONFIG = require("../config.json");
const utils = require("./utils.js");
const reporter = require("./reporter.js");
const packageJson = require("../package.json");

const raw = require("./raw");
const rendered = require("./rendered");
const analysis = require("./analysis");
const get_wayback = require("./wayback.js");

/**
 * Visit a URL on a particular date (using the Wayback Machine)
 * @param {string} browser - A puppeteer browser instance.
 * @param {string} url - A valid URL.
 * @param {string} date - A valid ISO-8601 date.
 * @returns {object} - a Visit
 */
async function main(browser, url, date) {
  const branch = "visit";

  reporter.log(`starting... ${url} ${date}`, "info");

  // data bootstrap
  const wayback = date ? await get_wayback(url, date) : undefined;
  const date_accessed = moment.utc().format();
  const date_requested = date ? moment.utc(date).format() : undefined;

  // assign visit id
  const id = utils.url_date_slug(
    url,
    wayback && wayback.date_available ? wayback.date_available : date_accessed
  );

  // determine where visit will be saved
  const visit_path = `v${packageJson.version
    .split(".")
    .slice(0, 2)
    .join("_")}/${id}`;
  const visit_dir = CONFIG.visits_root + visit_path;

  try {

    // make sure visits directory exists
    await fsp.mkdir(visit_dir, {
      recursive: true,
    });




    // start
    const result = {
      id,
      url,
      date_accessed,
      wayback,
      agent: agent_metadata(),
      client: await client_metadata(),
      raw: wayback ? await raw(wayback.url_raw) : await raw(url),
      rendered:
        wayback && wayback.url_rendered
          ? await rendered(browser, wayback.url_rendered, visit_path, date)
          : await rendered(browser, url, visit_path, date),
    };

    // analyze results, and inject back in
    result["analysis"] = await analysis(browser, result);

    // // delete a very big item of no further immediate use
    // if (result.rendered.structure.data) {
    //   delete result.rendered.structure.data; // HTML content; probably keep.
    // }

    // delete another very big item of no further immediate use
    if (result.rendered.styles && result.rendered.styles.combined) {
      delete result.rendered.styles.combined;
      result.rendered.styles.list.forEach((item) => {
        delete item.data;
      });
    }

    // delete another very big item of no further immediate use
    if (result.rendered.scripts && result.rendered.scripts.combined) {
      delete result.rendered.scripts.combined;
      result.rendered.scripts.list.forEach((item) => {
        delete item.data;
      });
    }

    // validate visit
    // const v = new jsonschema.Validator;
    // const schema = await fsp.readFile("../schemas/visit.schema.json")
    // console.log(validate(data, schema))

    reporter.log(`...complete ${id}`, "info");
    return result;
  } catch (error) {
    // clean up
    del(visit_dir);

    // barf
    return reporter.error(error, branch);
  }
}

/**
 * Useful metadata about Apato itself.
 * @return {object} a Branch
 */
function agent_metadata() {
  return {
    branch: "app.agent_metadata",
    status: "ok",
    name: "Apato (Visitor)",
    url: "https://github.com/allanberry/apato",
    version: packageJson.version,
    creator: "Allan Berry <allan.berry@gmail.com>",
  };
}

/**
 * Useful metadata about the client using Apato
 * (e.g. the browser, geographic data, IP address).
 * @return {object} a Branch
 */
async function client_metadata() {
  const response = await axios.get("https://api.myip.com", {
    timeout: 10000,
  });
  const ip = response.data.ip;
  const geo = await geoip.lookup(ip);
  return {
    branch: "app.client_metadata",
    status: "ok",
    ip,
    geo,
  };
}

module.exports = main;
