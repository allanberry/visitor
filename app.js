const assert = require("chai").assert;
const fs = require("fs");
const fsp = require("fs").promises;
const moment = require("moment");
const puppeteer = require("puppeteer");

const CONFIG = require("./config.json");
const packageJson = require("./package.json");
const utils = require("./src/utils.js");
const reporter = require("./src/reporter.js");
const requests = require("./src/requests.js");

const visits_ledger = CONFIG.data_root + "visits_ledger.json";

const visit = require("./src/visit.js");

/**
 * The main loop.
 * @return {undefined}
 */
async function main(visits_ledger) {
  reporter.log(`Apato visitor run start.  v${packageJson.version}`, "info");

  // ensure expected directories exist
  const expected_dirs = [CONFIG.requests_root, CONFIG.visits_root];
  for (const dir of expected_dirs) {
    fs.mkdir(
      dir,
      {
        recursive: true,
      },
      (error) => {
        if (error) throw error;
      }
    );
  }

  // read new requests
  // const requests = JSON.parse(fs.readFileSync(requests_file));

  // read existing results
  const existing_results_json = fs.readFileSync(visits_ledger, {
    flag: "a+",
  });
  const existing_results = existing_results_json.length
    ? JSON.parse(existing_results_json)
    : [];

  // setup virtual browser
  const browser = await puppeteer.launch();

  try {
    // process each request
    for (const request of requests()) {
      // We have to ensure each request has a date and a url, and figure them out if not.
      const result = {
        url: request.url
          ? request.url
          : request.id
          ? ((id) => requests.find((request) => request.id === id).url)(
              request.id
            )
          : undefined,
        date: request.date
          ? request.date
          : request.date_requested
          ? request.date_requested
          : request.id
          ? ((id) => moment.utc(id.slice(-14), utils.wayback_format).format())(
              request.id
            )
          : request.date_wayback
          ? request.date_wayback
          : request.date_accessed
          ? request.date_accessed
          : undefined,
      };

      const request_match = existing_results.find(
        (request) =>
          request.url === result.url &&
          request.date === result.date &&
          request.status === "ok" &&
          request.visitor_version === packageJson.version
      );

      // interrupt if either url or date are missing
      if (!result.url || !result.date) {
        reporter.log(
          url
            ? `missing date: ${(url, request.id)}`
            : `missing url: ${(date, request.id)}`,
          "warn"
        );
      }

      // interrupt if request has already occurred
      else if (request_match && !CONFIG.overwrite_existing) {
        reporter.log(
          `exists (skipping) - url: "${request.url}", date: "${request.date}"`, "warn"
        );
      }

      // do the deed
      else {
        const vis = await visit(browser, result.url, result.date);

        // determine visits directory, and ensure exists
        const visit_dir =
          CONFIG.visits_root +
          `v${packageJson.version.split(".").slice(0, 2).join("_")}/${vis.id}`;
        await fsp.mkdir(visit_dir, {
          recursive: true,
        });

        // write visit to file
        await fsp.writeFile(
          `${visit_dir}/visit.json`,
          JSON.stringify(vis, null, 2),
          (error) => {
            if (error) throw error;
          }
        );

        // results are slightly different than requests, sort of quasi-visits
        result.id = vis.id;
        result.date_accessed = vis.date_accessed;
        result.status = "ok";
        result.visitor_version = packageJson.version;
        result.date_wayback = vis.wayback.date_available;

        // add results to ledger
        existing_results.push(result);
        fs.writeFileSync(
          visits_ledger,
          JSON.stringify(existing_results, null, 2),
          {
            encoding: "utf-8",
          }
        );
      }
    }
  } catch (error) {
    // known errors
    const known_errors = [
      {
        name: "TimeoutError",
      },
    ];

    if (known_errors.some((e) => e.name === error.name)) {
      reporter.log(`"app (error)" ${error.name} ${error.message}`, "info");
    } else {
      // unknown errors
      reporter.log(`"app" ${error.name} ${error.message}`, "info");
      // console.error(error);
    }
  } finally {
    await browser.close();
    reporter.log("Apato visitor run complete.\n", "info");
  }
}

main(visits_ledger);
