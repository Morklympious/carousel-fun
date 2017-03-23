var dom = require('./utilities/dom');


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
  console.log(self.options)

  items.forEach(function(item) {
    var spacing = self.options.spacing.between

    item.style['margin-right'] = spacing + "px";
    item.style['width'] = (self.root.clientWidth - (self.options.visibles - 1) * spacing) / self.options.visibles + "px";
  });

  this.listeners(); 
}

function __listeners() {
  var events = window.evts(); 
  var self = this; 

  self.root.addEventListener(events.start, function(e) {
    self.dragging = true; 
  });

  self.root.addEventListener(events.move, function(e) {
    if(!self.dragging) return; 
    console.log('ay');
    window.motion.translate(e.currentTarget, e.clientX - e.currentTarget.offsetWidth / 2);
  })

  self.root.addEventListener(events.end, function(e) {

    self.dragging = false; 
  })


}

  // slide size is (carousel size - (slides-per-view - 1) * spacing) / slides-per-view;


module.exports = Carousel; 
