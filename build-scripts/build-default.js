var build = require("./build-base");


function _build() {
  /**
   * We really only need to build and copy stuff for default.
   * This is the lowest common denominator for building a full
   * unoptomized site.
   */
  build.output();
  build.bundle();
}

// When called directly, this file builds,
// Otherwise, the fn is exported as an API
_build();

module.exports = _build;
