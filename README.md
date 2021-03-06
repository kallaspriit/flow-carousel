FlowCarousel
============

**Responsive paginated high-performance HTML5 carousel with AngularJS support.**

#The FlowCarousel should:#
- be able to render any number of columns without noticable performance penalty
- accept either a simple array or a data source object which reports how many items it has and has async deferred getters for ranges of data
- support asynchronous data loading
- be navigatable using arrows
- be navigatable using mouse
- be navigatable using touch gestures
- be navigatable using provided API
- be responsive (the number of displayed columns depends on the width of the container)
- animations should be smooth and use GPU acceleration
- notify the user that new data is loading
- the user should still be able to navigate to the next page even if the data for it has not yet loaded
- update the UI when the referenced data changes (the data source object can notify of such event)
- configurable number of pages should be prerendered before and after the current page
- automatically scroll to the right page when the user uses mouse/touch to navigate the carousel
- enable scrolling slightly past the last/first page and bounce back to the correct page
- enable showing/hiding the navigation buttons on component hover
- enable rendering the content of it using plain javascript callbacks (async)
- enable using angular as the javascript renderer callback
- enable adding and removing items on the fly without having to rebuild the entire component or causing flicker
- enable plugging in various animation strategies
- be mobile first
- fires events that other plugins can listen (init, destroy, nav start, nav end, content loading, content loaded)
- support ie8???
- be abe to present vertical data without "empty gaps" on pages
- be unit-testable
- be validated with jshint
- be usable as a jquery plugin
- be able to initialize at a requested position
- have option to set, how many items to scroll
- have option to continous scrolling (from last page to first with next button)
- be able to lazy-load images as they come into view
- be able to animate in the freshly-created columns
- be covered with documentation in jsdoc format
- use grunt for building minimized version and running tests
- support CommonJS module pattern
- support RequireJS AMD
- work without AMD
- support multiple instances on the same page
- include AngularJS directive example

#Installing#
You need **node package manager** (npm) and **grunt** to build the library yourself.
```
> npm install
> grunt
```

If your setup does not have grunt installed then you can do that via npm by
```
> npm install -g grunt-cli
```

#Implementation progress#
1. main project structure (npm, grunt) ✓
2. AMD support (requirejs) ✓
3. distribution build support (r.js, almond) ✓
4. unit testing support (karma + jasmine) ✓
5. code linting (jshint) ✓
6. documentation generation (yuidoc) ✓
7. configuration management ✓
8. abstract and array data sources ✓
9. abstract renderer ✓
10. multi-orientation support ✓
11. margin support ✓
12. testing fixtures support ✓
- existing html renderer
- jQuery plugin interface

#Class diagram#
![Class diagram](https://raw.githubusercontent.com/kallaspriit/flow-carousel/master/doc/class-diagram.png "Class diagram")