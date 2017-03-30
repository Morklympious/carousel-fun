var events      = require('./normalization/normalize-drag-events'),
    coordinates = require('./normalization/event-coordinates'),
    translate   = require('../animation/translate');

/**
 * Initialize all drag-based listeners
 */
function listeners() {
  var self = this;
  var root = self.root;
  var slides = self.viewport;

  /** When the user begins to drag */
  self.root.addEventListener(events.start, function(e) {
    var pos = coordinates(e);
    /** flag-a-drag, recording the x position of when we started */
    self.dragging = true;

    /** 
     * Necessary to make them both the same because holdover from previous
     * drags would otherwise make the carousel 'jump'
     */
    self.eStartPos = pos.x;
    self.eEndPos = pos.x;
  });

  /** When the user is dragging the carousel */
  self.root.addEventListener(events.move, function(e) {
    var pos = coordinates(e);
    var delta = self.eEndPos - self.eStartPos; 
    var distance = self.translate + delta;

    /** If we're not flagged as dragging, do nothing */
    if(!self.dragging) return;

    if(distance < self.minTranslate) {
      distance = self.minTranslate;
      self.boundedLow = true; 
    } else self.boundedLow = false; 

    if(distance > self.maxTranslate) {
      distance = self.maxTranslate;
      self.boundedHigh = true; 
    } else self.boundedHigh = false; 

    self.eEndPos = pos.x;
    translate(slides, distance);

    e.preventDefault();
    e.stopPropagation();
  });

  /** When the user has finished dragging */
  self.root.addEventListener(events.end, function(e) {
    /** unflag-a-drag */
    self.dragging = false;

    /** 
    * We recorded the X position of our start and stop positions because we need to know:
    * 1. How far we translated (eEndPos - eStartPos)
    * 2. How much translate was already applied before we even started. 

    * If we translate again later, we'll know what value to begin translating from 
    */
    if(self.boundedLow || self.boundedHigh) {
      self.translate = self.boundedLow ? self.minTranslate : self.maxTranslate
      self.eEndPos = 0;
      self.eStartPos = 0; 
      return;
    }
    self.translate = self.translate + (self.eEndPos - self.eStartPos);
  });
}

module.exports = listeners;
