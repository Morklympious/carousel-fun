/**
 * A function to set inline CSS properties onto an element
 * @see classList
 * 
 * @example
 * var div = document.createElement("div");
 * 
 * css(div, {
 *   background: blue,
 *   fontSize: "18px"
 * });
 * 
 * //The div will now have inline styles of:
 * // - font-size: 18px;
 * // - background: blue; 
 * 
 * @param {Node} element - The element on which to remove one (or many, space separated) class(es)
 * @param {object} styles - The styles, in camel-case (if applicable), to set on the element
 * 
 * @return {Node} The element on which the class was set
 */
function css(element, styles) {
  var rule,
      val; 

  for(rule in styles) {
    val = styles[rule];
    element.style[rule] = val; 
  }

  return element; 
}

module.exports = {
  css: css
}