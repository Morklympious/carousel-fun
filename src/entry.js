var m = require('mithril');


/*
   This CSS is now scoped to the things in this module via file-hash
   and accessible via css.your_class_name;

   This will output to site.css in dist/css as a bunch of classes with
   unique prefixes (jkfjei32jlsd_example) (so they target whichever element you want perfectly)
 */
var css = require('./css/carousel.css');

/*
  We require global CSS here without assigning because
  it allows browserify to run the 'modular-css' plugin.
  That plugin, while running, outputs a file that we link to through our site

  This will output to site.css in dist/css as is
  (no unique prefixes since it's required but unused)
  modular-css sees this and it just gets placed into site.css untouched.
*/
require('./css/global.css');

/*
  Explanation of stackpack that appears in browser.
  Note that this explanation is being rendered in a v-dom library
  known as 'Mithril', If you're using another vdom library, they
  should have similar paradigms for you to assign classes to a
  virtual dom element.

  You're free to do dot or bracket! No biggie! Just make sure You
  have ESLINT agree with you about it.

*/

var numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    slides  = numbers.map(function(number) {
      return m("div", {class: css["carousel-slide"]}, "Slide " + number);
    })

m.mount(global.document.getElementById('mount'), {
  view: function() {
    return m("div", {class: css["wrapper"]}, [
      m('div', {class: css["carousel-container"]}, [
        m("div", {class: css["carousel-wrapper"]}, slides)
      ])
    ]);
  }
});
