var dom = require('./utilities/dom');
var initializeListeners = require('./event-logic/carousel-event-listeners');

var defaults = {
  slidesPerView: 2,
  itemSpacing: 12,
  classes: {
    container: '.carousel-container',
    items: '.carousel-slide',
    wrapper: '.carousel-wrapper',
  }
};

function Carousel(root, opts) {
  var self = this;

  self.options = _merge(defaults, opts);
  self.dom = _refs(root, self.options);
  self.state = _state(self);

  initializeCarousel(self);
  initializeListeners(self);

}

function _merge(one, two) {
  return Object.assign({}, one, two);
}

/**
 * Setup Function: _refs
 *
 * Sets up important DOM references for a Carousel instance
 *
 * @param root {Element} - A DOM element representing the root element of Carousel
 * @param options {object} - The options object attached to the Carousel instance
 *
 * @return {object} - an object representing the root, wrapper, and items of a carousel.
 */
function _refs(root, options) {
  var classes = options.classes;

    return {
      root: root,
      wrapper: dom.find(root, classes.wrapper),
      items: dom.find(root, classes.items),
    }
}

function _state(Carousel) {
  return {
      bounds: {
        lower: 0,
        upper: 0
      },
      dragging: false,
      position: {
        start: 0,
        moved: 0,
        offset: 0
      }
  }
}

function _size(element, sizes) {
  var width = sizes.width,
      height = sizes.height;
}

/** TODO: refactor to look less like hot shit.  */
function initializeCarousel(Carousel) {
  var items   = Carousel.dom.items;
  var count   = items.length;
  var spacing = Carousel.options.itemSpacing;

  // if(Carousel.options.peek.right) {
  //   carouselItem.width = round(((Carousel.dom.root.clientWidth - (4 * spacing)) - (spv - 1) * spacing) / spv)
  // }

  var w = ((Carousel.dom.wrapper.clientWidth) - (Carousel.options.slidesPerView - 1) * spacing) / Carousel.options.slidesPerView;

  _setCarouselItemSize(Carousel);
  _setCarouselWrapperSize(Carousel);

  Carousel.dom.wrapper.style['width'] = ((w + spacing) * count) + (4 * spacing) + "px";
  Carousel.state.bounds.upper = (((w + spacing) * count) - w) ;
}

function _setCarouselItemSize(Carousel) {
  var root  = Carousel.dom.root;
  var items = Carousel.dom.items;
  var options = Carousel.options;
  var spv = options.slidesPerView;
  console.log(root.clientWidth);
  var spec = {
    marginRight: options.itemSpacing + "px",
    width: Math.floor(((root.clientWidth - 80) - (spv - 1) * options.itemSpacing) / spv) + "px"
  };

  items.forEach(function(item) {
    Object.assign(item.style, spec);
  });

}

function _setCarouselWrapperSize(Carousel) {
  var wrapperWidth = Carousel.dom.wrapper.clientWidth;
  var spv = (Carousel.options.slidesPerView - 1);
  var spaceBetweenItems = Carousel.options.itemSpacing;

  /**
   * The width of the (visible part of the carousel) wrapper, minus spv-1 (because of 0 indexing)
   * multiplied by the space each item needs after it divided by the total slides in a given view will
   * give us the width each slide needs to be
   */
  var w = (wrapperWidth - (spv - 1) * spaceBetweenItems) / spv;

}



module.exports = Carousel;
