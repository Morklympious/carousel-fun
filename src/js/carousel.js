var dom = require('./utilities/dom');
var translate = require('./animation/translate');
var listeners = require('./event-logic/carousel-event-listeners');
var round = require('./utilities/round-number');


var defaults = {
  slidesPerView: 4,
  peek: {
    right: true,
    left: false,
  },
  spacing: {
    between: 12
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
    startPosition: 0,
    movedPosition: 0,
    offsetPosition: 0
  }

  init(C, C.dom.items);
  listeners.call(this);
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

  items.forEach(function(item) {
    var dom = Carousel.dom;

    item.style.marginRight = carouselItem.margin;
    item.style.width = carouselItem.width;
  });

  Carousel.dom.wrapper.style['width'] = ((items[0].clientWidth + spacing) * count) + "px";
}

module.exports = Carousel;
