const moment = require("moment");
const colors = require("colors");

const logmessage = `[${moment.utc().format(moment.defaultFormat)}]`.gray;
const levels = ["info", "warn", "error", "debug"];

/**
 * Custom logging
 */
function log(message, level) {
  // print to console
  switch (level) {
    case "info":
      console.info(`${logmessage} - ${"info".green}: ${message}`);
      break;

    case "warn":
      console.warn(`${logmessage} - ${"warn".yellow}: ${message}`);
      break;

    case "error":
      console.error(`${logmessage} - ${"error".red}: ${message}`);
      break;

    default:
      // debug
      console.debug(`${logmessage} - ${"debug"}: ${message}`);
  }

  // print to file
  // TODO
}

function ellipsify(str, chars) {
  if (str.length > chars) {
    return str.substring(0, chars) + "...";
  } else {
    return str;
  }
}

/**
 * Centralized error processing
 */
function error(error, branch) {
  const standard_message = `${branch ? branch + " " : ""}${
    error.name
  }: "${ellipsify(error.message.replaceAll("\n", ""), 100)}"`;

  // do the deed
  const suppress_errors = [
    {
      name: "Error",
      message: "is an invalid expression",
    },
  ];

  if (suppress_errors.some((str) => error.name.match(str) && error.message.match())) {
    /* vendors contains the element we're looking for */
    log(standard_message, "warn");
  } else {
    log(standard_message, "error");
    console.error(error);
  }

  return {
    branch,
    status: "error",
    error: {
      name: error.name,
      message: error.message,
    },
  };
}

module.exports = {
  log,
  error,
};
