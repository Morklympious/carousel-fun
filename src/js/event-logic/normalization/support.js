//TODO: put in a support module
module.exports = {
    touch: !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch),
    pointers: window.navigator.pointerEnabled,
    mspointers: window.navigator.msPointerEnabled,
};