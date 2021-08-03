function main() {
  return [
    // "https://library.unt.edu/",
    // "https://library.illinois.edu/",
    "https://library.uic.edu/",
    // "https://www.libraries.rutgers.edu/",
  ].map((url) => ({
    url,
    date: "2010",
  }));

  // {
  //   url: "https://library.unt.edu/",
  //   date_requested: "2010",
  // },
}

module.exports = main;
