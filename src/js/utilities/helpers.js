/**
 * Unwraps an element from an array if it's the only element in the array. This was created
 * to allow selectors that match to only a single DOM element to be interactive without having to
 * grab the first element of the returned collection array. 
 * 
 * @param {array} collection - The array of data
 * 
 * @return {any|array} the item as-is or an array of items
 */
function _unwrap(collection) {
  return collection.length === 1 ? collection[0] : collection; 
}

/**
 * Filters Element nodes of an array of Nodes. This filters out every node that is NOT and element node
 * (e.g. TextNode, CommentNode, AttributeNode, etc.) 
 * 
 * @param {array} collection - The array to search through for elements
 * 
 * @return {array} a new array containing only elements
 */
function _elements(collection) {
  var elements = [],
      ELEMENT  = 1; // Element node ID.   

  collection.forEach(function(node) {
    if(node.nodeType === ELEMENT) {
      elements.unshift(node);
    }
  });

  return elements;
}


function _merge(destination, source) {
  destination = destination || {}; 
  source = source || {};

  Object.keys(source).forEach(function(key) { destination[key] = source[key]; });
  return destination;
}

module.exports = {
  unwrap   : _unwrap,
  elements : _elements,
  merge    : _merge
};
