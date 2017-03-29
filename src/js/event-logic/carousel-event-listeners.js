var events      = require('./normalization/normalize-drag-events'),
    coordinates = require('./normalization/event-coordinates'),
    translate   = require('../animation/translate');

/**
 * Helper function to make addEventListener less verbose
 */
function listenOn(element, event, fn) {
  return element.addEventListener(event, fn);
}


/**
 * Initialize all drag-based listeners
 */
function listeners() {
  var self = this;
  var root = self.root;
  var slides = self.viewport;

  listenOn(root, events.start, function(e) {
      var pos = coordinates(e);

      /** flag-a-drag, recording the x position of when we started */
      self.dragging = true;
      self.eStartPos = pos.x;
  });

  listenOn(root, events.move, function(e) {
    var pos = coordinates(e);
    var distance = pos.x - self.eStartPos

    /** If we're not flagged as dragging, do nothing */
    if(!self.dragging) return;
    
    translate(slides, self.translate + distance);
  });

  listenOn(root, events.end, function(e) {
    var pos = coordinates(e);
    
    /** unflag-a-drag, and let's record the x position of when we stopped */
    self.dragging = false;
    self.eEndPos = pos.x;
    
    /** 
    * We recorded the X position of our start and stop positions because we need to know:
    * 1. How far we translated (eEndPos - eStartPos)
    * 2. How much translate was already applied before we even started. 

    * If we translate again later, we'll know what value to begin translating from 
    */
    self.translate = self.translate + (self.eEndPos - self.eStartPos);

    console.log(self)
  });
}

module.exports = listeners;
