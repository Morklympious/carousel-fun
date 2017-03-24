var dom = require('./utilities/dom');
var translate = require('./translate');
var events = require('./events');


function Carousel(root, opts) {

  var defaults = {
    visibles: 3,
    spacing: {
      between: 30
    },
    classes: {
      container: '.carousel-container',
      items: '.carousel-slide',
      wrapper: '.carousel-wrapper',
    }
  };

  this.options = Object.assign({}, defaults, opts);

  this.dragging = false;

  this.root = root;
  this.wrapper = dom.find(root, this.options.classes.wrapper)
  this.items = dom.find(root, this.options.classes.items);

  /** Initialization code */
  this.init = __init.bind(this);
  this.listeners = __listeners.bind(this);

  this.init(this.items);
}

function __init(items) {
  var self = this;

  items.forEach(function(item) {
    var spacing = self.options.spacing.between
    console.log('client width', self.root.clientWidth, 'visibles', self.options.visibles, 'spacing betweetn', spacing, 'width', ((self.root.clientWidth - ((self.options.visibles - 1) * spacing) / self.options.visibles) + "px"));
    item.style['margin-right'] = spacing + "px";
    item.style['width'] = ((self.root.clientWidth - ((self.options.visibles - 1) * spacing) / self.options.visibles) + "px");
  });

  this.listeners();
}

function __listeners() {
  var self = this,
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

  self.root.addEventListener(events.start, function(e) {
    self.dragging = true;
    mousedown.x = e.clientX;
  });

  self.root.addEventListener(events.move, function(e) {
    if(!self.dragging) return;

    state.distance = e.clientX - mousedown.x;
    translate(self.wrapper, state.offset + state.distance);
  })

  self.root.addEventListener(events.end, function(e) {
    self.dragging = false;
    state.offset = state.offset + state.distance;
  });

  self.root.addEventListener('mouseleave', function(e) {
    self.dragging = false;
    state.offset = state.offset + state.distance;
  });

}

  // slide size is (carousel size - (slides-per-view - 1) * spacing) / slides-per-view;


module.exports = Carousel;
