var merge = require('lodash.merge');

var dom = require('./utilities/dom');
var element = require('./utilities/element');

var listeners = require('./event-logic/carousel-drag-listeners');
var defaults = require('./options/carousel-defaults');


function Carousel(root, opts) {
  var self = this;

  self.options = merge({}, defaults, opts);

  /** DOM Elements */
  self.root = root;
  self.viewport = dom.find(root, self.options.classes.wrapper);
  self.items = dom.find(root, self.options.classes.items);

  /** State flags */
  self.dragging = false;
  

  /** Values for dragging */
  self.translate = 0;  
  self.maxTranslate = 0; 
  self.minTranslate = 0;
  self.dragStartPos = 0;
  self.dragEndPos = 0; 
  

  /** Methods */
  self.listeners = listeners.bind(self);
  self.initialize = initialize.bind(self);
  
  self.initialize(); 
  self.listeners();
}

function initialize() {
  var self = this; 

  /** Width, slides-per-view, and margin spacing between items */
  var xSize   = _width(self.root);
  var spv     = self.options.slidesPerView; 
  var spacing = self.options.itemSpacing;
  var itemCount = self.items.length;

  var singleItemWidth = ((xSize - ((spv - 1) * spacing)) / spv) - 80; 
  var totalItemsWidth = itemCount * singleItemWidth; 
  var totalGutterWidth = itemCount * spacing

  self.items.forEach(function(item) {
    element.css(item, {
      marginRight: spacing + 'px',
      width: Math.floor(singleItemWidth) + 'px',
    });
  });

  element.css(self.viewport, { 
    width: totalItemsWidth + totalGutterWidth + 'px'
  });

  // Set Carousel boundaries (upper and lower) 
  self.maxTranslate = 0;
  self.minTranslate = -(totalItemsWidth + totalGutterWidth) + (self.root.clientWidth);
}

function _width(element, width) {
  return width ? element.style.width = width : element.clientWidth; 
}


module.exports = Carousel;
