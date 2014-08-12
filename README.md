FlowCarousel
============

Responsive paginated high-performance HTML5 carousel with AngularJS support.

**#	The new carousel component should:**
1	be able to render any number of columns without noticable performance penalty
2	accept either a simple array or a data source object which reports how many items it has and has async deferred getters for ranges of data
3	support asynchronous data loading
4	be navigatable using arrows
5	be navigatable using mouse
6	be navigatable using touch gestures
7	be navigatable using provided API
8	be responsive (the number of displayed columns depends on the width of the container)
9	animations should be smooth and use GPU acceleration
10	notify the user that new data is loading
11	the user should still be able to navigate to the next page even if the data for it has not yet loaded
12	update the UI when the referenced data changes (the data source object can notify of such event)
13	configurable number of pages should be prerendered before and after the current page
14	automatically scroll to the right page when the user uses mouse/touch to navigate the carousel
15	enable scrolling slightly past the last/first page and bounce back to the correct page
16	enable showing/hiding the navigation buttons on component hover
17	enable rendering the content of it using plain javascript callbacks (async)
18	enable using angular as the javascript renderer callback
19	enable adding and removing items on the fly without having to rebuild the entire component or causing flicker
20	enable plugging in various animation strategies
21	be mobile first
22	fires events that other plugins can listen (init, destroy, nav start, nav end, content loading, content loaded)
23	support ie8???
24	be abe to present vertical data without "empty gaps" on pages
25	be unit-testable
26	be validated with jshint
27	be usable as a jquery plugin
28	be able to initialize at a requested position
29	have option to set, how many items to scroll
30	have option to continous scrolling (from last page to first with next button)
31	be able to lazy-load images as they come into view
32	be able to animate in the freshly-created columns
33	be covered with documentation in jsdoc format
34	use grunt for building minimized version and running tests
35	support CommonJS module pattern
36	support RequireJS AMD
37	work without AMD