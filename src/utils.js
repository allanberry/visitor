const fs = require("fs");
const { URL } = require("url");
const moment = require("moment");
const cheerio = require("cheerio");
const slugify = require("slugify");

// The 'colors' module modifies the string prototype.
require("colors");

const wayback_format = "YYYYMMDDHHmmss";

/**
 * Report to command line
 */
// const logmessage = `[${moment.utc().format(moment.defaultFormat)}]`.gray;
// const log = {
//   info: (message) => {
//     console.info(`${logmessage} - ${"info".green}: ${message}`);
//   },
//   warn: (message) => {
//     console.warn(`${logmessage} - ${"warn".yellow}: ${message}`);
//   },
//   error: (message) => {
//     console.error(`${logmessage} - ${"error".red}: ${message}`);
//   },
// };

/**
 * Read from a JSONL file into an array of JS objects
 */
function readJSONL(srcfile) {
  const data = fs.readFileSync(srcfile);
  return data
    .toString()
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
}

/**
 * Create a random universal identifier (UUID4)
 * Hat tip https://stackoverflow.com/a/2117523/652626
 */
function uuid(simple = true) {
  if (!simple) {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        var r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }
  return "xxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Create a simple, predictable hash
 * Hat tip https://stackoverflow.com/a/7616484/652626
 */
function hashCode(str) {
  var hash = 0,
    i,
    chr;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash >>> 0;
}

/**
 * Create a slug, which works for combined urls and dates
 */
function url_date_slug(url, date = null) {
  const u = new URL(decodeURI(url));
  const f = "YYYYMMDDHHmmss";
  const d = date ? moment.utc(date).format(f) : moment.utc().format(f);

  let hostname = u.hostname.replace("www.", "").split(".").reverse();

  // "vid" is specific to Ex Libris Primo URLs, a primary use case
  hostname = u.searchParams.has("vid")
    ? hostname.concat(u.searchParams.get("vid"))
    : hostname;

  return slugify([hostname.join("_"), hashCode(url), d].join("_"), {
    replacement: "_",
    remove: /\:/gi,
  });
}

/**
 * create full unambiguous CSS selector for any element, using Cheerio
 * @input Cheerio element
 * @output String
 */
function get_selector(element) {
  const element_name_full = get_ids(element)
    ? `${element.tagName}${get_ids(element)}`
    : element.tagName;

  /**
   * for any cheerio (jquery) element, get any associated ids or classes as a string
   */
  function get_ids(element) {
    const siblings = cheerio(element).parent().children(element.tagName);

    let ordinal;
    siblings.each((i, elem) => {
      if (elem === element) {
        ordinal = i + 1;
      }
    });

    let selector = "";
    const id = cheerio(element).attr("id");
    const classNames = cheerio(element).attr("class");

    if (siblings.length > 1 && ordinal) {
      selector += `:nth-of-type(${ordinal})`;
    }
    if (id) {
      selector += "#" + id.trim();
    }
    if (classNames) {
      selector += "." + classNames.trim().split(" ").join(".");
    }
    return selector;
  }

  return cheerio(element)
    .parents()
    .get()
    .map((parent) => {
      const ids = get_ids(parent);
      return ids ? `${parent.tagName}${ids}` : parent.tagName;
    })
    .reverse()
    .concat([element_name_full])
    .join(">");
}

/**
 * Filter object by key
 */
// function filter_object(obj, predicate) {
//   return Object.fromEntries(
//     Object.entries(obj).filter(([key, value]) => key === "I")
//   );
// }

/**
 * Determine if an object is empty.
 */
function is_empty(obj) {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
}

/**
 * for any cheerio (jquery) element, get any associated ids or classes as a string
 */
// function get_ids(element) {
//   const siblings = cheerio(element).parent().children(element.tagName);

//   let ordinal;
//   siblings.each((i, elem) => {
//     if (elem === element) {
//       ordinal = i + 1;
//     }
//   });

//   let selector = "";
//   const id = cheerio(element).attr("id");
//   const classNames = cheerio(element).attr("class");

//   if (siblings.length > 1 && ordinal) {
//     selector += `:nth-of-type(${ordinal})`;
//   }
//   if (id) {
//     selector += "#" + id.trim();
//   }
//   if (classNames) {
//     selector += "." + classNames.trim().split(" ").join(".");
//   }
//   return selector;
// }


module.exports = {
  get_selector,
  is_empty,
  // log,
  readJSONL,
  url_date_slug,
  uuid,
  wayback_format,
};