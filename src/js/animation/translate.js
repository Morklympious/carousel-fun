function translate(element, distance) {
  var translation = 'translate3d(' + distance + 'px, 0, 0)'
  var style = element.style;

  style.WebkitTransform = translation;
  style.MozTransform = translation;
  style.OTransform = translation;
  style.msTransform = translation;
  style.transform = translation;
}

module.exports = translate;

