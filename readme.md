# Carousel-fun
I've been investigating ways to make a carousel that isn't complete garbage on mobile.

## 2/20/2017

The carousel is an important component and as such requires heavy consideration as to the implementation and use-cases herein.

The first task for the carousel is actually pretty simple, it looks like we're going with a carousel that has

- Right / Left arrow sliders (to be used by desktop users)
- Free scrolling (to be used by mobile users)
- Consistent peek view (on the right, but left peek view shouldn't be precluded by design)

The plan is to make a Stateless Carousel (if possible) and work on these basic features.


## 2/22/2017

2/22

I've been brainstorming different ways I can set up state. Programmatically I want the carousel to be able to do a few things with its API:

- Advance / Retreat the current carousel view by 1 (or more) item(s).
- Keep track of which carousel item is currently at the leftmost section of the viewport.
- Keep track of the distance from the edge of the carousel viewport to the left edge of the next available carousel item (for transitions regardless of resizing).

I plan to grab and assign these values after the component mounts to the DOM, afterward I'll set up a handler (debounced, so we're not flooding the browser with event triggers) that will update the carousel as resizes occur.

# 2/24/2017

It's been a couple of days and there are still strategies I'm struggling with. There are two paradigms that I've walked forward with:

- Mobile will have free scroll
- Desktop will have buttons to control its scroll

The issue here becomes "how, in a React.js component, can I keep track of the carousel state if on desktop I'm allowing only arrow navigation (no scroll) but on mobile I'm allowing this wild wild west of scrolling"

The answer is to use a listener for scrolling, but that logic reeks of spaghetti code and horrible math and generally isn't clean or understandable. I would have to listen to the carousel element scroll, and then

1. Store its current scroll position,
2. Analyze how far it scrolled
3. Change state based on those two numbers

All just so if it gets sized between desktop and mobile there are no disparities.

It's very difficult to create a Carousel that has two entirely different paradigms of navigation at two different sizes.

This was a failed week, but it has given a lot of perspective on what should be done architecturally for a component like this.
Going forward, the idea is to unify the carousel traversal paradigm, giving priority to touch gestures, translating input in to callable functions that control the carousel, and then adding buttons for those carousels on desktop (while they still retain their swipeability)

# 2/27/2017
I've looked at several carousel implementations over the weekend that have given me a lot of good insight into the way they work. Since our browser stack is so forgiving, I'm going to take an approach similar to one found in another carousel technology called "Swiper".

It essentially uses `translate3d` to move the carousel based on mouse movements or touch events if they're supported. This gives a nice way forward: I essentially have to do a few things before I can play around with the concept:

1. Normalize mousedown / pointer events to know when something is being held to be dragged
2. Understand the math behind making a carousel and its slides move.

### Inconsistencies in events
Since part of the goal is to have a carousel that is draggable on multiple platforms (chief of which are mobile/webview and desktop). There are some inconsistencies in both the events that mobile/desktop use as well as the way those events have to be handled.

Touch and webview devices are ostensibly on a touch device, meaning they use the `touchstart`, `touchmove` and `touchend` properties. Whereas the Desktop uses mouse events `mousedown`, `mousemove`, `mouseup`.

If you're looking at some versions of Internet Explorer, you end up having to deal with a nonstandard api of `pointerdown`, `pointermove`, and `pointerup`. EVEN THEN. Sometimes that's not supported, and so there's a vendor-prefixed version that Microsoft definitely supports: `mspointerdown`, etc.

My implementation idea involves branching logic based on feature detection:

```js
/**
 * Retrieve Desktop events that enable drag in a standard object format
 * fallback to using the AWFUL AND DEAD pointer events if we're in IE.
 */
function _nontouch() {
  var pointers = supports.pointers;
  var mspointers = supports.mspointers;

  var standard = {
    start: 'mousedown',
    move: 'mousemove',
    end: 'mouseup'
  },

  pointer = {
    start: mspointers ? 'pointerdown' : 'MSPointerDown',
    move: mspointers ? 'pointermove' : 'MSPointerMove',
    end: mspointers ? 'pointerup' : 'MSPointerUp'
  };

  return pointers ? pointer : standard;
}

function _touch() {
    return {
        start: 'touchstart',
        move: 'touchmove',
        end: 'touchend',
    }
}

```

This will allow me to create a callable function that can branch and return the appropriate set of normalized events based on the environment at runtime

After I figure these things out I can start fleshing out some more robust concepts / lifecycle methods as they relate to the carousel.

# 3/27/2017

My most recent thoughts on the matter is that programmatically setting slides CSS is the way to go, as it allows for functionality to be broken into small iotas and called as appropriate (e.g. when screen size changes, when a reflow or repaint occurs, or if the developer needs to reinitialize some or all parts of the logic). I've gotten a small `translate` approach going, but there will need to be more enforcement around something close to a lifecycle for this component.

Ideally, we'd be able to hook functionality in at various points in the lifecycle, e.g.:

- `onslidedrag`
- `onslidesnap`
- `onsomething`

ad infinitum until we're pleased with the level of flexibility this approach can achieve.
