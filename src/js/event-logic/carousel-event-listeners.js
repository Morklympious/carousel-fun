var events = require('./normalize-events.js');
var translate = require('../animation/translate');

function listeners(Carousel) { 
  var dom  = Carousel.dom,
      mousedown = {
        x: 0
      },
      state = {
        offset: 0,
        distance: 0
      }

  // find anchor point on down, subtract from mousemove.
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

module.exports = listeners; 
