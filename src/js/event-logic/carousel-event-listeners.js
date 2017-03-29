var events      = require('./normalization/normalize-drag-events'),
    coordinates = require('./normalization/event-coordinates'),
    translate   = require('../animation/translate');

/**
 * Helper function to make addEventListener less verbose
 */
function listenOn(element, event, fn) {
  return element.addEventListener(event, fn);
}

function bounded(value, lower, upper) {
  return (lower <= value && value <= upper);
}

function ondragstart(Carousel, root, state) {
  listenOn(root, events.start, function(e) {
      var pos = coordinates(e);

      /** Beginning a drag */
      state.dragging = true;
      state.position.start = pos.x;
      console.log(state);
  });
}

function ondragmove(Carousel, root, state) {
  var slides = Carousel.dom.wrapper;

  listenOn(root, events.move, function(e) {
    var pos = coordinates(e),
        newPosition = state.position.offset + state.position.moved;

    /** If we're not flagged as dragging, do nothing */
    if(!state.dragging) return;

    state.position.moved = pos.x - state.position.start;

    console.log(state.position.offset, state.position.moved)
    if(bounded(newPosition, -state.bounds.upper, state.bounds.lower)) {
      translate(slides, state.position.offset + state.position.moved)
    }

  });
}

function ondragend(Carousel, root, state) {
  listenOn(root, events.end, function(e) {
     state.dragging = false;
     state.position.offset =state.position.offset + state.position.moved;
  });
}

/**
 * Initialize all drag-based listeners
 */
function initializeListeners(Carousel) {
  var root = Carousel.dom.root;

  ondragstart(Carousel, root, Carousel.state);
  ondragmove(Carousel, root, Carousel.state);
  ondragend(Carousel, root, Carousel.state);
}

module.exports = initializeListeners;
