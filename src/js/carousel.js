var dom = require('./utilities/dom');
var listeners = require('./event-logic/carousel-event-listeners');
var defaults = require('./options/carousel-defaults');

function Carousel(root, opts) {
  var self = this;

  self.options = Object.assign({}, defaults, opts);

  /** DOM Elements */
  self.root = root;
  self.viewport = dom.find(root, self.options.classes.wrapper);
  self.items = dom.find(root, self.options.classes.items);

  /** State flags */
  self.dragging = false;

  /** Values for dragging */
  self.translate = 0;  
  self.eStartPos = 0;
  self.eEndPos = 0; 

  /** Methods */
  self.listeners = listeners.bind(self);
  self.initialize = initialize.bind(self);
  //initializeCarousel(self);

  self.initialize(); 
  self.listeners();
}

function _size(element, dimensions) {
  var width = dimensions.width || element.style.width,
      height = dimensions.height || element.style.height;

  element.style.width = width + 'px';
  element.style.height = height + 'px';
}

function initialize(Carousel) {
  var self = this; 

  var visibleWidth = self.viewport.clientWidth;
  var spv = self.options.slidesPerView;
  var itemSpacing = self.options.itemSpacing

  /** 
   * Visible viewport width minus the product of multiplying
   * the number of slides to show per-view (minus one because the rightmost
   * won't have right margins shown) by the right-margin each slide needs to space itself. 
   * 
   * Divided all by the slides per view and you get the total space (content + margin) 
   * each slide needs. 
   */
  var viewportSize = (visibleWidth - ((spv - 1) * itemSpacing)) / spv; 

  self.items.forEach(function(item) {
    item.style['margin-right'] = itemSpacing + 'px'; 
    _size(item, {
      width: Math.floor(viewportSize)
    });
  });

  _size(self.viewport, { width: (viewportSize * self.items.length) + self.items.length * itemSpacing});
  console.log(self.viewport);

  // Size Carousel Wrapper and Carousel Items
  // Set Carousel boundaries (upper and lower) 
}

module.exports = Carousel;
