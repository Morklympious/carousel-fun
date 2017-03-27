var dom = require('./utilities/dom');
var translate = require('./animation/translate');
var listeners = require('./event-logic/carousel-event-listeners');
var round = require('./utilities/round-number');


var defaults = {
  slidesPerView: 3,
  spacing: {
    between: 30
  },
  classes: {
    container: '.carousel-container',
    items: '.carousel-slide',
    wrapper: '.carousel-wrapper',
  }
};

function Carousel(root, opts) {
  var C = this;

  C.options = Object.assign({}, defaults, opts);

  C.dom = {
    root: root,
    wrapper: dom.find(root, C.options.classes.wrapper),
    items: dom.find(root, C.options.classes.items),
  }

  C.state = {
    dragging: false,
    drag: {
      /** At what position in the carousel did we begin to drag **/
      startpos: 0,

      /** how far did we move after starting the drag */
      movedpos: 0,

      /** what's the offset introduced via translation */
      offset: 0,
    }
  }

  init(C, C.dom.items);
  listeners(C);
}

function init(Carousel, items) {
  var count   = items.length,
      spacing = Carousel.options.spacing.between,
      spv     = Carousel.options.slidesPerView,

      /** Single Carousel Item */
      carouselItem = {
        margin: Carousel.options.spacing.between + "px",
        width: round((Carousel.dom.root.clientWidth - (spv - 1) * spacing) / spv) + "px"
      }

  // Reflow / Resize slide elements based on:
  // - slides per view (need to use the wrapper width to determine width of items based on per-view)
  // - Number of total slides

  // Initialize Event listeners
  // - Need to have state for:
  //    - Drag/mousedown occurring
  //    - Last pixel position translated to (to stop jarring transitions. )


  items.forEach(function(item) {
    var dom = Carousel.dom;

    item.style.marginRight = carouselItem.margin;
    item.style.width = carouselItem.width;
  });

  Carousel.dom.wrapper.style['width'] = ((items[0].clientWidth + spacing) * count) + "px";


}

module.exports = Carousel;
