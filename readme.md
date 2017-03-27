# Carousel-fun
I've been investigating ways to make a carousel that isn't complete garbage on mobile. 

My most recent thoughts on the matter is that programmatically setting slides CSS is the way to go, as it allows for functionality to be broken into small iotas and called as appropriate (e.g. when screen size changes, when a reflow or repaint occurs, or if the developer needs to reinitialize some or all parts of the logic). I've gotten a small `translate` approach going, but there will need to be more enforcement around something close to a lifecycle for this component. 

Ideally, we'd be able to hook functionality in at various points in the lifecycle, e.g.:

- `onslidedrag`
- `onslidesnap`
- `onsomething`

ad infinitum until we're pleased with the level of flexibility this approach can achieve. 