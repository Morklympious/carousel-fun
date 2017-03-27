var dom = require('./utilities/dom');
var translate = require('./animation/translate');
var events = require('./event-logic/normalize-events');


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


  C.dragging = false; 
  C.dom = {
    root: root,
    wrapper: dom.find(root, C.options.classes.wrapper),
    items: dom.find(root, C.options.classes.items),
  }

  /** Initialization code */
  C.init = init.bind(C, C);
  C.listeners = __listeners.bind(C);

  init(C, C.dom.items);
}

function init(Carousel, items) {
  var self    = Carousel,
      count   = items.length,
      spacing = Carousel.options.spacing.between;

  // Reflow / Resize slide elements based on:
  // - slides per view (need to use the wrapper width to determine width of items based on per-view)
  // - Number of total slides

  // Initialize Event listeners
  // - Need to have state for:
  //    - Drag/mousedown occurring
  //    - Last pixel position translated to (to stop jarring transitions. )


  items.forEach(function(item) {
    var dom = Carousel.dom,
        spv = Carousel.options.slidesPerView; 

    item.style.marginRight = spacing + "px";
    item.style.width = (dom.root.clientWidth - (spv - 1) * spacing) / spv + "px";
  });

  Carousel.dom.wrapper.style['width'] = ((items[0].clientWidth + spacing) * count) + "px"; 

  Carousel.listeners(); 
}

function __listeners() { 
var self = this,
    dom  = self.dom,
    mousedown = {
      x: 0
    },
    state = {
      offset: 0,
      distance: 0
    }

  // find anchor point on down, subtract from mousemove.
  var down = {
    x: 0
  }
  var offset = 0;
  var distance = 0;

  dom.root.addEventListener(events.start, function(e) {
    self.dragging = true;
    mousedown.x = e.clientX;
  });

  dom.root.addEventListener(events.move, function(e) {
    if(!self.dragging) return;

    state.distance = e.clientX - mousedown.x;
    translate(dom.wrapper, state.offset + state.distance);
  })

  dom.root.addEventListener(events.end, function(e) {
    self.dragging = false;
    state.offset = state.offset + state.distance;
  });

  dom.root.addEventListener('mouseleave', function(e) {
    self.dragging = false;
    state.offset = state.offset + state.distance;
  });

}

  // slide size is (carousel size - (slides-per-view - 1) * spacing) / slides-per-view;


module.exports = Carousel; 
