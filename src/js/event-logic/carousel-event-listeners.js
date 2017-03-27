var events = require('./normalize-events.js');
var translate = require('../animation/translate');

function listeners(Carousel) {
  var dom = Carousel.dom,
      state = Carousel.state;

  dom.root.addEventListener(events.start, function(e) {
    state.dragging = true;
    state.drag.startpos = e.clientX;
  });

  dom.root.addEventListener(events.move, function(e) {
    if(!state.dragging) return;

    state.movedpos = e.clientX - state.drag.startpos;
    translate(dom.wrapper, state.drag.offset + state.movedpos);
  });

  dom.root.addEventListener(events.end, function(e) {
    state.dragging = false;
    state.offset = state.offset + state.movedpos;
  });

  dom.root.addEventListener('mouseleave', function(e) {
    state.dragging = false;
    state.offset = state.offset + state.movedpos;
  });

}

module.exports = listeners;
