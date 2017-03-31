/**
 * @module DOM
 */
var helpers = require("./helpers");

var _elements = helpers.elements,
    _unwrap   = helpers.unwrap;

/**
 * Finds an element by selector within a context. If child elements in 
 * element match selector, they are added to the return result
 * 
 * @param {Node} element - The element to search for children inside of
 * @param {string} selector - The CSS selector to match elements against
 * 
 * @returns {array|Node} A single element or collection of elements that match the query
 */
function find(element, selector) {
  return _unwrap(_elements(element.querySelectorAll(selector)));
}


// find the closest element that matches (includes self)
/**
 * Finds the closest parent element of element that matches selector
 * starting with the element this function was passed
 * 
 * @param {Node} element - The element from which to begin the search
 * @param {string} selector - The CSS selector to match elements against
 * 
 * @returns {Node} The first ancestor element that matches the query
 */
function closest(element, selector) {
  var current  = element;

  // Keep looking up the DOM if our current element doesn't match, stop at <html>
  while(current.matches && !current.matches(selector) && current.tagName !== "HTML") {
    current = current.parentNode;
  }

  return (current.matches(selector)) ? current : [];
}


module.exports = {
  find: find,
  closest: closest
};
