const dotenv = require("dotenv").config();
const fs = require("fs");
const fsp = require("fs").promises;
const parse = require("csv-parse/lib/sync");
const path = require("path");
const moment = require("moment");
const axios = require("axios");
const geoip = require("geoip-lite");
const puppeteer = require("puppeteer");
const validate = require("jsonschema").validate;
const assert = require("chai").assert;

const utils = require("./src/utils");
const raw = require("./src/raw");
const rendered = require("./src/rendered");
const analysis = require("./src/analysis");
const packageJson = require("./package.json");
const styles = require("./src/rendered/styles.js");
const config = require("./config.json");
const del = require("del");

const requests_log = config.visits_root + "requests.json";
const existing_requests = JSON.parse(
  fs.readFileSync(requests_log, { flag: "a+" })
);

const agent = {
  name: "Apato (Visitor)",
  url: "https://github.com/allanberry/apato",
  version: packageJson.version,
  creator: "Allan Berry <allan.berry@gmail.com>",
};

let id;
let client;
const overwrite_existing = false;

/**
 * a Request is the standard interface for getting a visit from Visitor.
 * It requires either an existing ID (from an existing request), or a URL/Date combination.
 */
class Request {
  id;
  date;
  url;

  constructor(input = {}) {
    this.id = input.id ? input.id : this.mintID(input.url, input.date);

    this.date = input.date
      ? moment.utc(input.date).format()
      : this.parseDate(input.id);
    this.url = input.url ? input.url : this.determineURL(input.id);

    // fail if one of these conditions is not met
    assert.isOk(
      this.id || (this.date && this.url),
      'A Request must have either a valid "id" or a combination of valid "date" and "url" fields'
    );
  }

  mintID(url, date) {
    return utils.url_date_slug(url, date);
  }

  parseDate(id) {
    return moment.utc(id.slice(-14), utils.wayback_format).format();
  }

  determineURL(id) {
    const request = existing_requests.find((request) => request.id === id);
    return request.url;
  }
}

/**
 * Main
 */
async function main(url, date) {
  // initialize
  utils.log("info", {
    message: `Apato visitor run start.  Version ${packageJson.version} \n`,
  });

  // outside of try/catch because this would break everything if it failed.
  const browser = await puppeteer.launch();

  // set a client variable for shared usage later by visits
  client = await get_client();

  try {
    // // specific URLs
    // const urls = [
    //   // university libraries, e.g. for institutions with major library schools
    //   // "http://libraries.luc.edu/",
    //   // "http://library.princeton.edu/",
    //   // "http://www.lib.washington.edu/",
    //   // "http://www.library.ucla.edu/",
    //   // "http://www.library.utoronto.ca/",
    //   // "https://libraries.indiana.edu/",
    //   // "https://libraries.mit.edu/",
    //   // "https://library.depaul.edu/",
    //   // "https://library.harvard.edu/",
    //   // "https://library.iit.edu/",
    //   // "https://library.illinois.edu/",
    //   // "https://library.stanford.edu/",
    //   // "https://library.syr.edu/",
    //   // "https://library.uic.edu/",
    //   // "https://library.unc.edu/",
    //   // "https://library.wayne.edu/",
    //   // "https://oi.uchicago.edu/",
    //   // "https://www.lib.fsu.edu/",
    //   // "https://www.lib.ncsu.edu/",
    //   // "https://www.lib.umd.edu/",
    //   "https://www.lib.umich.edu/",
    //   "https://www.lib.utexas.edu/",
    //   "https://www.libraries.rutgers.edu/",
    //   "https://www.libraries.uc.edu/",
    //   "https://www.library.drexel.edu/",
    //   "https://www.library.northwestern.edu/",
    //   "https://www.library.pitt.edu/",
    //   "https://www.library.virginia.edu/",
    //   "https://www.library.wisc.edu/",

    //   // hbcus
    //   "http://library.howard.edu/library/",
    //   "http://sampson.jsums.edu/screens/OPAC.html",
    //   "http://www.dillard.edu/_academics/library/index.php",
    //   "http://www.library.ncat.edu/",
    //   "http://www.pvamu.edu/library/",
    //   "http://www.subr.edu/page/2441",
    //   "http://www.tnstate.edu/library/",
    //   "http://www.tsu.edu/academics/library/",
    //   "https://alabamam.ent.sirsi.net/client/en_US/default",
    //   "https://library.famu.edu/index",
    //   "https://library.morgan.edu/home",
    //   "https://library.nsu.edu/",
    //   "https://www.asurams.edu/academic-affairs/library/index.php",
    //   "https://www.auctr.edu/",
    //   "https://www.bowiestate.edu/library/",
    //   "https://www.desu.edu/academics/library",
    //   "https://www.gram.edu/library/",
    //   "https://www.nccu.edu/library",
    //   "https://www.uncfsu.edu/library",
    //   "https://www.wssu.edu/academics/cg-okelly-library/index.html",
    // ];
    const dates = [
      "1990-01-01",
      "1995-01-01",
      // "1996-01-01",
      // "1997-01-01",
      // "1998-01-01",
      // "1999-01-01",
      "2000-01-01",
      // "2001-01-01",
      // "2002-01-01",
      // "2003-01-01",
      // "2004-01-01",
      "2005-01-01",
      // "2006-01-01",
      // "2007-01-01",
      // "2008-01-01",
      // "2009-01-01",
      "2010-01-01",
      // "2011-01-01",
      // "2012-01-01",
      // "2013-01-01",
      // "2014-01-01",
      "2015-01-01",
      // "2016-01-01",
      // "2017-01-01",
      // "2018-01-01",
      // "2019-01-01",
      "2020-01-01",
      "2021-01-01",
    ];
    // for (const url of urls) {
    //   for (const date of dates) {
    //     // gets result from wayback machine
    //     await visit(browser, url, date);
    //   }
    // }

    // // get urls from downloaded initial data
    const urls = parse(await fsp.readFile("./data/initial/urls.csv"), {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
    })
      .filter((item) => item.include === "TRUE")
      .map((item) => item.url);
    for (const url of urls.reverse()) {
      for (const date of dates) {
        await visit(browser, url, date);
      }
      // console.log(request)
    }

    // recycle urls from requests.json file
    // const requests = require("./data/visits/requests.json");
    // const visit_pairs = [
    //   ...new Set(
    //     requests
    //       .filter((item) => item.status === "error")
    //       .map((item) => {
    //         return { date: item.date_requested, url: item.url };
    //       })
    //   ),
    // ];
    // for (const pair of visit_pairs) {
    //   await visit(browser, pair.url, pair.date);
    // }

    // const ids = [
    //   "edu_pvamu_3419439457_20200128144835",
    //   "edu_pvamu_3419439457_20201210095007",
    //   "edu_tnstate_2155376461_20200111020239",
    //   "edu_umich_lib_419354240_20100118121717",
    //   "edu_umich_lib_419354240_20210306010905",
    //   "net_sirsi_ent_alabamam_107598286_20210303104836",
    // ];
    // for (const id of ids) {
    //   const request = new Request({ id });
    //   await visit(browser, request.url, request.date);

    //   // console.log(request)
    // }

    // clean up
  } catch (error) {
    console.error(error);
  } finally {
    await browser.close();
    utils.log("info", {
      message: `Apato visitor run complete. \n`,
    });
  }
}

/**
 * Visit a URL on a particular date (using the Wayback Machine)
 */
async function visit(browser, url, date) {
  const date_accessed = moment.utc().format();
  const date_requested = date ? moment.utc(date).format() : undefined;
  const wayback = date ? await utils.get_wayback(url, date) : undefined;

  // manufacture an ID
  id = utils.url_date_slug(
    url,
    wayback && wayback.date_available ? wayback.date_available : date_accessed
  );

  // determine where files will be stored.
  const visit_path = `v${packageJson.version
    .split(".")
    .slice(0, 2)
    .join("_")}/${id}`;
  const visit_dir = config.visits_root + visit_path;

  try {
    // make sure visits directory exists
    await fsp.mkdir(visit_dir, {
      recursive: true,
    });

    utils.log("info", {
      id,
      message: "starting...",
      method: "app.visit",
    });

    if (check_if_exists(id) && !overwrite_existing) {
      utils.log("info", {
        id,
        message: "visit already exists; aborting",
        method: "app.visit",
      });

      const result = {
        id,
        url,
        date_requested,
        path: visit_path,
        visitor_version: packageJson.version,
        status: "exists",
      };
      log_request(result);
      return result;
    }

    let visit_data = {
      id,
      url,
      date_accessed,
      wayback,
      agent,
      client,
      raw: wayback
        ? await raw.main(id, wayback.url_raw)
        : await raw.main(id, url),
      rendered:
        wayback && wayback.url_rendered
          ? await rendered.main(
              id,
              browser,
              wayback.url_rendered,
              visit_path,
              date
            )
          : await rendered.main(id, browser, url, visit_path, date),
    };

    // analyze results, and inject back in
    visit_data["analysis"] = await analysis.main(id, browser, visit_data);

    // delete some (big) elements from "rendered",
    // delete visit_data.rendered.structure.data; // HTML content
    delete visit_data.rendered.styles.combined;
    visit_data.rendered.styles.list.forEach((item) => {
      delete item.data;
    });
    delete visit_data.rendered.scripts.combined;
    visit_data.rendered.scripts.list.forEach((item) => {
      delete item.data;
    });

    // validate visit
    // const v = new jsonschema.Validator;
    // const schema = await fsp.readFile("../schemas/visit.schema.json")
    // console.log(validate(visit_data, schema))

    await fsp.writeFile(
      `${visit_dir}/visit.json`,
      JSON.stringify(visit_data, null, 2),
      (error) => {
        if (error) throw error;
      }
    );

    utils.log("info", {
      id,
      message: "...complete",
      method: "app.visit",
    });

    // log and return result
    const result = {
      id,
      url,
      date_accessed,
      date_requested,
      date_available:
        wayback && wayback.date_available ? wayback.date_available : undefined,
      path: visit_path,
      visitor_version: packageJson.version,
      status: "complete",
    };
    log_request(result);
    return result;
  } catch (error) {
    utils.log("error", {
      error,
      id,
      method: "app.visit",
    });

    // embed error in result, and log
    const result = {
      id,
      url,
      date_accessed,
      date_requested,
      visitor_version: packageJson.version,
      status: "error",
      error: {
        name: error.name,
        message: error.message,
        method: "app.visit",
      },
    };
    log_request(result);

    // clean up
    del(visit_dir);
  }
}

async function get_client() {
  try {
    const response = await axios.get("https://api.myip.com", {
      timeout: 10000,
    });
    const ip = response.data.ip;
    const geo = await geoip.lookup(ip);
    return {
      ip,
      geo,
    };
  } catch (error) {
    utils.log("error", {
      error,
      id,
      method: "app.client",
    });
    return {
      id,
      error: {
        name: error.name,
        message: error.message,
        method: "app.client",
      },
    };
  }
}

/**
 * determine whether the visit data has already been collected
 */
function check_if_exists(id) {
  try {
    // needs to find ANY
    const completed_request = existing_requests.find((request) => {
      return (
        request.id === id &&
        request.status === "complete" &&
        request.visitor_version === packageJson.version
      );
    });

    if (completed_request) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Report request to log
 */
function log_request(report) {
  let data;
  try {
    const file = fs.readFileSync(requests_log, { flag: "a+" });
    data = JSON.parse(file);
  } catch (error) {
    data = [];
  }
  data.push(report);
  const output = JSON.stringify(data);
  fs.writeFileSync(requests_log, output, { encoding: "utf-8" });
}

/**
 * Get visit data from (already collected) ID
 */
function get_Visit() {
  return {};
}

main();
