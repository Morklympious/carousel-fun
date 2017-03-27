/** Module to normalize the event object across touch/desktop for dragging */
var supports = require('./support');

function coordinates(event) {
    return {
        x: supports.touch ? event.touches[0].clientX : event.clientX,
        y: supports.touch ? event.touches[0].clientY : event.clientY
    }
}

module.exports = coordinates;