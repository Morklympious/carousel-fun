var events      = require('./normalization/normalize-drag-events'),
    coordinates = require('./normalization/event-coordinates'),
    translate   = require('../animation/translate');

// TODO: Make part of carousel.


function listeners() {

  var listen = this.dom.root.addEventListener,
      slides = this.dom.wrapper;



  var dragging = this.state.dragging,
      offsetPosition = this.state.offsetPosition,
      startPosition = this.state.startPosition,
      movedPosition = this.state.movedPosition;

  listen(events.start, function(e) {
      var position = coordinates(e);

      /** Beginning a drag */
      dragging = true;
      startPosition = position.x;
  });

  listen(events.move, function(e) {
      var position = coordinates(e);

      /** If we're not flagged as dragging, do nothing */
      if(!dragging) return;
      movedPosition = position.x - startPosition;

      translate(slides, offsetPosition + movedPosition)
  });

  listen(events.end, function(e) {
      offsetPosition = offsetPosition + movedPosition;

      /** Ending a drag */
      dragging = false;
  });
}

module.exports = listeners;
