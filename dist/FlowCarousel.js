(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        //Allow using this built library as an AMD module
        //in another project. That other project will only
        //see this AMD call, not the internal modules in
        //the closure below.
        define([], factory);
    } else {
        //Browser globals case. Just assign the
        //result to a property on the global.
        root.FlowCarousel = factory();
    }
}(this, function () {/**
 * @license almond 0.2.9 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                name = baseParts.concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("almond", function(){});

define('jquery',[
	'jquery'
], function() {
	

	/**
	 * Provides a way to include jquery without actually including it in the build.
	 *
	 * Expects that jQuery is already loaded.
	 */
	return window.jQuery;
});
define('Deferred',[
	'jquery'
], function($) {
	

	/**
	 * Provides utility functionality.
	 *
	 * Uses the jQuery deferred implementation.
	 *
	 * @class Deferred
	 * @constructor
	 */
	var Deferred = $.Deferred;

	// proxy to jQuery when()
	Deferred.when = $.when;

	return Deferred;
});
define('AbstractNavigator',[
], function() {
	

	/**
	 * Abstract navigator base class.
	 *
	 * Use navigators to navigate the carousel using mouse, touch, keyboard, ui, urls etc.
	 *
	 * @class AbstractNavigator
	 * @constructor
	 */
	function AbstractNavigator() {
		this._carousel = null;
	}

	/**
	 * Initiated the navigator.
	 *
	 * This is called automatically by the carousel and calls _setup() in turn that the subclasses should implement.
	 *
	 * @method init
	 * @param {FlowCarousel} carousel The carousel component
	 */
	AbstractNavigator.prototype.init = function(carousel) {
		this._carousel = carousel;

		this._setup();
	};

	/**
	 * Called by the carousel on destroy.
	 *
	 * @method destroy
	 */
	AbstractNavigator.prototype.destroy = function() {
		// do nothing by default
	};

	/**
	 * Called by the init to set up the navigator.
	 *
	 * @method _setup
	 * @protected
	 */
	AbstractNavigator.prototype._setup = function() {
		throw new Error('Not implemented');
	};

	return AbstractNavigator;
});
define('Util',[
], function() {
	

	/**
	 * Provides utility functionality.
	 *
	 * @class Util
	 * @constructor
	 */
	return {

		/**
		 * Returns whether given arguments is an object (and not an array nor null).
		 *
		 * @method isObject
		 * @param {*} arg Arguments to check
		 * @return {boolean}
		 * @static
		 */
		isObject: function(arg) {
			return typeof arg === 'object' && arg !== null;
		},

		/**
		 * Returns whether given arguments is an array (and not a object nor null).
		 *
		 * @method isArray
		 * @param {*} arg Arguments to check
		 * @return {boolean}
		 * @static
		 */
		isArray: function(arg) {
			return Object.prototype.toString.call(arg) === '[object Array]';
		},

		/**
		 * Returns whether given object contains given value.
		 *
		 * @method objectHasValue
		 * @param {object} obj Object to check
		 * @param {*} value Value to search for
		 * @return {boolean}
		 */
		objectHasValue: function(obj, value) {
			var prop;

			for (prop in obj) {
				if(obj.hasOwnProperty(prop) && obj[prop] === value) {
					return true;
				}
			}

			return false;
		},

		/**
		 * Parses a css transform matrix.
		 *
		 * Input is something along the way of "matrix(1, 0, 0, 1, -1877, 0)" or a 3D matrix like
		 * "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -100, 0, 0, 1)"
		 *
		 * Returns objects with keys x, y.
		 *
		 * @method parseTransformMatrix
		 * @param {string} matrix Matrix to parse
		 * @return {object}
		 */
		parseTransformMatrix: function(matrix) {
			var offset,
				itemIndexes,
				trimmed,
				noWhitespace,
				items,
				result;

			/* istanbul ignore next */
			/*if (matrix === 'none') {
				return {
					x: 0,
					y: 0
				};
			}*/

			// TODO remove the istanbul ignore once karma coverage fixes not counting these lines
			/* istanbul ignore next */
			if (matrix.substring(0, 8) === 'matrix3d') { // IE uses matrix3d
				offset = 9;
				itemIndexes = [12, 13];
			} else if (matrix.substring(0, 6) === 'matrix') { // webkit, safari, opera
				offset = 7;
				itemIndexes = [4, 5];
			} else if (matrix.substring(0, 11) === 'translate3d') { // Safari uses translate3d sometimes
				offset = 12;
				itemIndexes = [0, 1];
			} else {
				throw new Error('Unsupported matrix format "' + matrix + '"');
			}

			trimmed = matrix.substr(offset).substr(0, matrix.length - offset - 1);
			noWhitespace = trimmed.replace(/ +/g, '');
			items = noWhitespace.split(/,/);

			result = {
				x: parseInt(items[itemIndexes[0]], 10),
				y: parseInt(items[itemIndexes[1]], 10)
			};

			return result;
		},

		/**
		 * Removes CSS classes from current element that have the given prefix.
		 *
		 * @method removeElementClassesPrefixedWith
		 * @param {DOMElement} element Element to modify
		 * @param {string} cssPrefix The CSS prefix
		 */
		removeElementClassesPrefixedWith: function(element, cssPrefix) {
			var wrapClasses = $(element).prop('class').split(' '),
				filteredClasses = [],
				i;

			for (i = 0; i < wrapClasses.length; i++) {
				if (wrapClasses[i].substr(0, cssPrefix.length) !== cssPrefix) {
					filteredClasses.push(wrapClasses[i]);
				}
			}

			$(element).prop('class', filteredClasses.join(' '));
		},

		/**
		 * Returns a clone of given object.
		 *
		 * @param {object} obj Object to clone
		 * @return {object}
		 */
		cloneObj: function(obj) {
			return JSON.parse(JSON.stringify(obj));
		}
	};
});
define('KeyboardNavigator',[
	'AbstractNavigator',
	'Util'
], function(AbstractNavigator, Util) {
	

	/**
	 * Keyboard navigator.
	 *
	 * @class KeyboardNavigator
	 * @extends AbstractNavigator
	 * @param {object} config Navigator configuration
	 * @constructor
	 */
	function KeyboardNavigator(config) {
		AbstractNavigator.call(this);

		this._config = config;
		this._mode = null;
		this._mouseEntered = false;

		this._eventListeners = {
			mouseenter: this._onRawMouseEnter.bind(this),
			mouseleave: this._onRawMouseLeave.bind(this),
			keydown: this._onRawKeyDown.bind(this),
		};

		this.setMode(config.mode || KeyboardNavigator.Mode.NAVIGATE_PAGE);
	}

	KeyboardNavigator.prototype = Object.create(AbstractNavigator.prototype);

	/**
	 * List of supported navigation modes.
	 *
	 * @property Mode
	 * @type {object}
	 * @param {string} Mode.NAVIGATE_PAGE='navigate-page' The navigation keys navigate one page at a time
	 * @param {string} Mode.NAVIGATE_ITEM='navigate-item' The navigation keys navigate one item at a time
	 */
	KeyboardNavigator.Mode = {
		NAVIGATE_PAGE: 'navigate-page',
		NAVIGATE_ITEM: 'navigate-item'
	};

	/**
	 * Returns current keyboard navigator mode.
	 *
	 * The mode is either {{#crossLink "KeyboardNavigator/Mode/NAVIGATE_PAGE:property"}}{{/crossLink}} or
	 * {{#crossLink "KeyboardNavigator/Mode/NAVIGATE_ITEM:property"}}{{/crossLink}} meaning that the arrow keys change
	 * either the page or navigate one item at a time.
	 *
	 * @method setMode
	 * @param {KeyboardNavigator/Mode:property} mode Mode to use
	 */
	KeyboardNavigator.prototype.setMode = function(mode) {
		if (!Util.objectHasValue(KeyboardNavigator.Mode, mode)) {
			throw new Error('Invalid mode "' + mode + '" provided');
		}

		this._mode = mode;
	};

	/**
	 * Returns current keyboard navigator mode.
	 *
	 * The mode is either {{#crossLink "KeyboardNavigator/Mode/NAVIGATE_PAGE:property"}}{{/crossLink}} or
	 * {{#crossLink "KeyboardNavigator/Mode/NAVIGATE_ITEM:property"}}{{/crossLink}} meaning that the arrow keys change
	 * either the page or navigate one item at a time.
	 *
	 * @method getMode
	 * @return {KeyboardNavigator/Mode:property}
	 */
	KeyboardNavigator.prototype.getMode = function() {
		return this._mode;
	};

	/**
	 * Called by the init to set up the navigator.
	 *
	 * @method _setup
	 * @protected
	 */
	KeyboardNavigator.prototype._setup = function() {
		var $mainWrap = $(this._carousel.getMainWrap()),
			$window = $(window);

		// make sure that the mouse if over the main wrap element
		$mainWrap
			.on('mouseenter', this._eventListeners.mouseenter)
			.on('mouseleave', this._eventListeners.mouseleave);

		// listen for key down events
		$window.on('keydown', this._eventListeners.keydown);
	};

	/**
	 * Called by the carousel on destroy.
	 *
	 * @method destroy
	 */
	KeyboardNavigator.prototype.destroy = function() {
		var $mainWrap = $(this._carousel.getMainWrap()),
			$window = $(window);

		// remove the event listeners
		$mainWrap
			.off('mouseenter', this._eventListeners.mouseenter)
			.off('mouseleave', this._eventListeners.mouseleave);

		$window.off('keydown', this._eventListeners.keydown);
	};

	/**
	 * Called on mouse enter event.
	 *
	 * @method _onRawMouseEnter
	 * @param {Event} e Mouse event
	 * @private
	 */
	KeyboardNavigator.prototype._onRawMouseEnter = function(/*e*/) {
		this._mouseEntered = true;
	};

	/**
	 * Called on mouse enter event.
	 *
	 * @method _onRawMouseLeave
	 * @param {Event} e Mouse event
	 * @private
	 */
	KeyboardNavigator.prototype._onRawMouseLeave = function(/*e*/) {
		this._mouseEntered = false;
	};

	/**
	 * Called on key down event.
	 *
	 * @method _onRawKeyDown
	 * @param {Event} e Key event
	 * @private
	 */
	KeyboardNavigator.prototype._onRawKeyDown = function(e) {
		var result = this._onKeyDown(e.keyCode);

		if (result === false) {
			e.preventDefault();
		}

		return result;
	};

	/**
	 * Called on key down even for anywhere in the document.
	 *
	 * @method _onKeyDown
	 * @param {number} keyCode Key press key-code.
	 * @return {boolean} Should the key event be propagated further
	 * @private
	 */
	KeyboardNavigator.prototype._onKeyDown = function(keyCode) {
		var keyCodes;

		// don't do anything if the mouse is not over given component
		if (!this._mouseEntered) {
			return;
		}

		// the keycodes are based on carousel orientation (left-right arrows for horizontal and up-down for vertical)
		switch (this._carousel.getOrientation()) {
			case this._carousel.Config.Orientation.HORIZONTAL:
				keyCodes = {
					previous: 37, // arrow left
					next: 39 // arrow right
				};
			break;

			case this._carousel.Config.Orientation.VERTICAL:
				keyCodes = {
					previous: 38, // arrow up
					next: 40 // arrow down
				};
			break;
		}

		// navigate using the key-codes defined above
		switch (keyCode) {
			case keyCodes.next:
				if (this._mode === KeyboardNavigator.Mode.NAVIGATE_PAGE) {
					this._carousel.navigateToNextPage();
				} else if (this._mode === KeyboardNavigator.Mode.NAVIGATE_ITEM) {
					this._carousel.navigateToNextItem();
				}

				return false;

			case keyCodes.previous:
				if (this._mode === KeyboardNavigator.Mode.NAVIGATE_PAGE) {
					this._carousel.navigateToPreviousPage();
				} else if (this._mode === KeyboardNavigator.Mode.NAVIGATE_ITEM) {
					this._carousel.navigateToPreviousItem();
				}

				return false;
		}

		return true;
	};

	return KeyboardNavigator;
});
define('DragNavigator',[
	'AbstractNavigator',
	'Util'
], function(AbstractNavigator, Util) {
	

	/**
	 * Drag navigator.
	 *
	 * @class DragNavigator
	 * @extends AbstractNavigator
	 * @param {object} config Navigator configuration
	 * @constructor
	 */
	function DragNavigator(config) {
		AbstractNavigator.call(this);

		this._config = config;
		this._mode = null;
		this._active = false;
		this._stoppedExistingAnimation = false;
		this._startedDragging = false;
		this._startDragPosition = null;
		this._startOppositePosition = null;
		this._startCarouselPosition = null;
		this._startHoverItemIndex = null;
		this._startTargetElement = null;
		this._startWindowScrollTop = null;
		this._lastDragPosition = null;
		this._lastOppositePosition = null;
		this._lastMoveTime = null;
		this._lastMoveDeltaTime = null;
		this._lastDeltaDragPosition = null;
		this._accumulatedMagnitude = {
			main: 0,
			opposite: 0
		};
		this._eventListeners = {
			start: this._onRawStart.bind(this),
			move: this._onRawMove.bind(this),
			end: this._onRawEnd.bind(this),
			dragStart: this._onRawDragStart.bind(this)
		};
		this._firstMoveEvent = true;
		this._lastDragDirection = 1;

		this.setMode(config.mode || DragNavigator.Mode.NAVIGATE_PAGE);
	}

	DragNavigator.prototype = Object.create(AbstractNavigator.prototype);

	/**
	 * List of supported navigation modes.
	 *
	 * @property Mode
	 * @type {object}
	 * @param {string} Mode.NAVIGATE_PAGE='navigate-page' The navigation keys navigate one page at a time
	 * @param {string} Mode.NAVIGATE_ITEM='navigate-item' The navigation keys navigate one item at a time
	 */
	DragNavigator.Mode = {
		NAVIGATE_PAGE: 'navigate-page',
		NAVIGATE_ITEM: 'navigate-item'
	};

	/**
	 * Returns current drag navigator mode.
	 *
	 * The mode is either {{#crossLink "DragNavigator/Mode/NAVIGATE_PAGE:property"}}{{/crossLink}} or
	 * {{#crossLink "DragNavigator/Mode/NAVIGATE_ITEM:property"}}{{/crossLink}} meaning that the arrow keys change
	 * either the page or navigate one item at a time.
	 *
	 * @method setMode
	 * @param {DragNavigator/Mode:property} mode Mode to use
	 */
	DragNavigator.prototype.setMode = function(mode) {
		if (!Util.objectHasValue(DragNavigator.Mode, mode)) {
			throw new Error('Invalid mode "' + mode + '" provided');
		}

		this._mode = mode;
	};

	/**
	 * Returns current drag navigator mode.
	 *
	 * The mode is either {{#crossLink "DragNavigator/Mode/NAVIGATE_PAGE:property"}}{{/crossLink}} or
	 * {{#crossLink "DragNavigator/Mode/NAVIGATE_ITEM:property"}}{{/crossLink}} meaning that the arrow keys change
	 * either the page or navigate one item at a time.
	 *
	 * @method getMode
	 * @return {DragNavigator/Mode:property}
	 */
	DragNavigator.prototype.getMode = function() {
		return this._mode;
	};

	/**
	 * Called by the init to set up the navigator.
	 *
	 * @method _setup
	 * @protected
	 */
	DragNavigator.prototype._setup = function() {
		var $mainWrap = $(this._carousel.getMainWrap()),
			$scrollerWrap = $(this._carousel.getScrollerWrap()),
			$window = $(window);

		// listen for mouse/touch down, move and up/leave events
		$scrollerWrap.on('mousedown touchstart', this._eventListeners.start);
		$window.on('mousemove touchmove', this._eventListeners.move);
		$window.on('mouseup touchend touchcancel', this._eventListeners.end);

		// intercept drag start event
		$mainWrap.on('dragstart', this._eventListeners.dragStart);
	};

	/**
	 * Called by the carousel on destroy.
	 *
	 * @method destroy
	 */
	DragNavigator.prototype.destroy = function() {
		var $mainWrap = $(this._carousel.getMainWrap()),
			$scrollerWrap = $(this._carousel.getScrollerWrap()),
			$window = $(window);

		// listen for mouse/touch down, move and up/leave events
		$scrollerWrap.off('mousedown touchstart', this._eventListeners.start);
		$window.off('mousemove touchmove', this._eventListeners.move);
		$window.off('mouseup touchend touchcancel', this._eventListeners.end);
		$mainWrap.off('dragstart', this._eventListeners.dragStart);
	};

	/**
	 * Called on drag start event.
	 *
	 * @method _onRawStart
	 * @param {Event} e Raw event
	 * @return {boolean} Should the event propagate
	 * @private
	 */
	DragNavigator.prototype._onRawStart = function(e) {
		if (e.which !== 1 && e.type !== 'touchstart') {
			return true;
		}

		var orientation = this._carousel.getOrientation(),
			horizontal = orientation === this._carousel.Config.Orientation.HORIZONTAL,
			isTouchEvent = e.type === 'touchstart',
			x = isTouchEvent ? e.originalEvent.changedTouches[0].pageX : e.pageX,
			y = isTouchEvent ? e.originalEvent.changedTouches[0].pageY : e.pageY,
			targetElement = e.target,
			result;

		result = this._begin(horizontal ? x : y, horizontal ? y : x, targetElement);

		if (result === false) {
			e.preventDefault();

			return false;
		} else {
			return true;
		}
	};

	/**
	 * Called on drag move event.
	 *
	 * @method _onRawMove
	 * @param {Event} e Raw event
	 * @return {boolean} Should the event propagate
	 * @private
	 */
	DragNavigator.prototype._onRawMove = function(e) {
		var orientation = this._carousel.getOrientation(),
			horizontal = orientation === this._carousel.Config.Orientation.HORIZONTAL,
			isTouchEvent = e.type === 'touchmove',
			result,
			x,
			y;

		// stop if not active
		if (!this._active) {
			return true;
		}

		// only move the carousel when the left mouse button is pressed
		if (e.which !== 1 && e.type !== 'touchmove') {
			result = this._end(e.target, isTouchEvent);
		} else {
			x = isTouchEvent ? e.originalEvent.changedTouches[0].pageX : e.pageX;
			y = isTouchEvent ? e.originalEvent.changedTouches[0].pageY : e.pageY;

			result = this._move(horizontal ? x : y, horizontal ? y : x);
		}

		if (result === false) {
			e.preventDefault();

			return false;
		} else {
			return true;
		}
	};

	/**
	 * Called on drag end event.
	 *
	 * @method _onRawEnd
	 * @param {Event} e Raw event
	 * @return {boolean} Should the event propagate
	 * @private
	 */
	DragNavigator.prototype._onRawEnd = function(e) {
		var isTouchEvent = e.type === 'touchend' || e.type === 'touchcancel',
			result,
			targetElement;

		// stop if not active
		if (!this._active) {
			return true;
		}

		// quit if invalid event
		if (e.which !== 1 && e.type !== 'touchend' && e.type !== 'touchcancel') {
			return true;
		}

		targetElement = e.target;

		result = this._end(targetElement, isTouchEvent);

		/* istanbul ignore else */
		if (result === false) {
			e.preventDefault();

			return false;
		} else {
			return true;
		}
	};

	/**
	 * Called on main wrap drag start event.
	 *
	 * @method _onRawDragStart
	 * @param {Event} e Drag start event
	 * @private
	 */
	DragNavigator.prototype._onRawDragStart = function(/*e*/) {
		// cancel start drag event so images, links etc couldn't be dragged
        return false;
	};

	/**
	 * Begins the navigation.
	 *
	 * @method _begin
	 * @param {number} dragPosition Drag position
	 * @param {number} oppositePosition Drag opposite position (y for horizontal, x for vertical)
	 * @param {DOMElement} targetElement The element that was under the cursor when drag started
	 * @return {boolean} Should the event propagate
	 * @private
	 */
	DragNavigator.prototype._begin = function(dragPosition, oppositePosition, targetElement) {
		targetElement = targetElement || null;

		this._active = true;
		this._startDragPosition = dragPosition;
		this._startOppositePosition = oppositePosition;
		this._lastDragPosition = dragPosition; // it's possible that the move event never occurs so set it here alrady
		this._lastOppositePosition = oppositePosition; // same for this
		this._lastMoveTime = (new Date()).getTime();
		this._startCarouselPosition = this._carousel.getAnimator().getCurrentPosition();
		this._startHoverItemIndex = this._carousel.getHoverItemIndex();
		this._startWindowScrollTop = $(window).scrollTop();
		this._accumulatedMagnitude = {
			main: 0,
			opposite: 0
		};
		this._firstMoveEvent = true;

		// disable all children click events for the duration of the dragging
		if (targetElement !== null) {
			this._startTargetElement = targetElement;

			this._disableClickHandlers(targetElement);
		}

		// if already animating then stop the animation at current position
		if (this._carousel.isAnimating()) {
			this._carousel.getAnimator().animateToPosition(this._startCarouselPosition, true, true);

			this._stoppedExistingAnimation = true;
			this._startedDragging = true;
		}

		// notify the carousel that dragging has begun
		this._carousel._onDragBegin(
			this._startDragPosition,
			this._startOppositePosition,
			this._startCarouselPosition,
			this._startWindowScrollTop
		);

		// disable default functionality
		//return false;

		// do not let the event propagate if we stopped an existing animation
		if (this._stoppedExistingAnimation) {
			return false;
		} else {
			return true;
		}
	};

	/**
	 * Called on mouse/finger move.
	 *
	 * @method _move
	 * @param {number} dragPosition Drag position
	 * @param {number} oppositePosition Drag opposite position (y for horizontal, x for vertical)
	 * @return {boolean} Should the event propagate
	 * @private
	 */
	DragNavigator.prototype._move = function(dragPosition, oppositePosition) {
		/* istanbul ignore if */
		if (!this._active) {
			return true;
		}

		// compare motion in the carousel and the opposite direction
		var deltaDragPosition = dragPosition - this._startDragPosition,
			moveDelta = this._lastDragPosition - dragPosition,
			currentTime = (new Date()).getTime();
			//deltaDragOppositePosition = oppositePosition - this._startOppositePosition,
			//currentWindowScrollTop = $(window).scrollTop(),
			//windowScrollTopDifference = this._startWindowScrollTop - currentWindowScrollTop;

		this._accumulatedMagnitude.main += Math.abs(moveDelta);
		this._accumulatedMagnitude.opposite += Math.abs(this._lastOppositePosition - oppositePosition);

		if (this._lastMoveTime !== null) {
			this._lastMoveDeltaTime = currentTime - this._lastMoveTime;
		}

		if (this._lastDragPosition !== null) {
			this._lastDeltaDragPosition = dragPosition - this._lastDragPosition;
		}

		// store the last drag direction, don't change if if no move delta detected
		if (moveDelta > 0) {
			this._lastDragDirection = -1;
		} else if (moveDelta < 0) {
			this._lastDragDirection = 1;
		}

		// we need last move position in the _end() handler
		this._lastDragPosition = dragPosition;
		this._lastOppositePosition = oppositePosition;
		this._lastMoveTime = currentTime;

		// if the carousel is dragged more in the opposite direction then cancel and propagate
		// this allows drag-navigating the page from carousel elements even if dead-band is exceeded
		if (
			this._accumulatedMagnitude.main > 0
			&& this._accumulatedMagnitude.main < this._accumulatedMagnitude.opposite
			&& !this._startedDragging
		) {
			this._end();

			return true;
		}

		// we have started dragging, do not give up the control any more
		this._startedDragging = true;

		// if the first move event takes more than 200ms then Android Chrome cancels the scroll, avoid this by returning
		// quickly on the first event
		if (this._firstMoveEvent) {
			this._firstMoveEvent = false;

			return false;
		}

		// calculate the position
		var newPosition = this._startCarouselPosition + deltaDragPosition,
			applyPosition = newPosition,
			itemSize = this._carousel.getItemSize(),
			totalSize = this._carousel.getTotalSize(),
			itemCountOnLastPage = this._carousel.getItemCountOnLastPage(),
			edgeMultiplier = this._config.overEdgeDragPositionMultiplier,
			minLimit = 0,
			maxLimit = -totalSize + itemCountOnLastPage * itemSize;

		// create smooth limit at the edges applying the drag motion partially
		if (newPosition > minLimit) {
			applyPosition = (this._startCarouselPosition + deltaDragPosition) * edgeMultiplier;
		} else if (newPosition < maxLimit) {
			applyPosition = this._startCarouselPosition + (deltaDragPosition * edgeMultiplier);
		}

		// use the animator to move to calculated position instantly
		this._carousel.getAnimator().animateToPosition(applyPosition, true, true);

		return false;
	};

	/**
	 * Called on gesture end.
	 *
	 * @method _end
	 * @param {DOMElement} targetElement The element that the drag ended on
	 * @param {boolean} [isTouchEvent=false] Is this a touch event
	 * @return {boolean} Should the event propagate
	 * @private
	 */
	DragNavigator.prototype._end = function(targetElement, isTouchEvent) {
		/* istanbul ignore if */
		if (!this._active) {
			return true;
		}

		isTouchEvent = typeof isTouchEvent === 'boolean' ? isTouchEvent : false;

		var currentPosition = this._carousel.getAnimator().getCurrentPosition(),
			totalDeltaDragPosition = this._lastDragPosition - this._startDragPosition,
			deltaDragOppositePosition = this._lastOppositePosition - this._startOppositePosition,
			dragMagnitude = Math.sqrt(Math.pow(totalDeltaDragPosition, 2) + Math.pow(deltaDragOppositePosition, 2)),
			ignoreClickThreshold = this._config.ignoreClickThreshold,
			performNavigation = Math.abs(totalDeltaDragPosition) > 0 || this._stoppedExistingAnimation,
			deltaDragPositionMagnitude = Math.abs(this._lastDeltaDragPosition),
			dragSpeedPixelsPerMillisecond = deltaDragPositionMagnitude / this._lastMoveDeltaTime,
			propagate = false,
			performClick,
			closestIndex,
			endHoverItemIndex;

		// we have to perform the navigation if the carousel was dragged in the main direction
		if (performNavigation) {
			// navigate to closest item or page depending on selected mode
			switch (this._mode) {
				case DragNavigator.Mode.NAVIGATE_PAGE:
					closestIndex = this._carousel.getClosestPageIndexAtPosition(
						currentPosition,
						this._lastDragDirection
					);

					this._carousel.navigateToPage(closestIndex, false, true, dragSpeedPixelsPerMillisecond);
				break;

				case DragNavigator.Mode.NAVIGATE_ITEM:
					closestIndex = this._carousel.getClosestItemIndexAtPosition(
						currentPosition,
						this._lastDragDirection
					);

					this._carousel.navigateToItem(closestIndex, false, true, dragSpeedPixelsPerMillisecond);
				break;
			}
		}

		// for touch events we don't have the hover indexes
		if (isTouchEvent) {
			performClick = targetElement !== null
				&& targetElement === this._startTargetElement
				&& dragMagnitude < ignoreClickThreshold;
		} else {
			endHoverItemIndex = this._carousel.getHoverItemIndex();

			performClick = this._startHoverItemIndex !== null
				&& targetElement !== null
				&& targetElement === this._startTargetElement
				&& endHoverItemIndex === this._startHoverItemIndex
				&& dragMagnitude < ignoreClickThreshold;
		}

		// restore the element click handler if drag stopped on the same element and was dragged very little
		if (performClick) {
			this._restoreClickHandlers(targetElement);

			this._dragStartHoverItemIndex = null;

			// make sure the event propagates so the correct listeners get fired
			propagate = true;
		}

		// notify the carousel that dragging has begun
		this._carousel._onDragEnd(
			this._mode,
			this._startDragPosition,
			this._lastDragPosition,
			totalDeltaDragPosition,
			closestIndex,
			this._lastDragDirection,
			targetElement
		);

		// reset
		this._active = false;
		this._stoppedExistingAnimation = false;
		this._startedDragging = false;
		this._startDragPosition = null;
		this._startOppositePosition = null;
		this._startCarouselPosition = null;
		this._startWindowScrollTop = null;
		this._lastDragPosition = null;
		this._lastMoveTime = null;
		this._lastMoveDeltaTime = null;
		this._lastDeltaDragPosition = null;
		this._accumulatedMagnitude = {
			main: 0,
			opposite: 0
		};
		this._firstMoveEvent = true;

		return propagate;
	};

	/**
	 * Disables normal click handler for given element.
	 *
	 * @method _disableClickHandlers
	 * @param {DOMElement} clickedElement Element to disable click events on
	 * @private
	 */
	DragNavigator.prototype._disableClickHandlers = function(clickedElement) {
		var disabledDataName = this._carousel.getConfig().cssPrefix + 'click-disabled',
			$clickedElement = $(clickedElement),
			$closestLink = $clickedElement.closest('A'),
			$disableElement = $clickedElement,
			isAlreadyDisabled,
			mainWrapClass,
			linkHasCarouselParent;

		// disable the closest A if possible
		if ($closestLink.length > 0) {
			mainWrapClass = '.' + this._carousel.getConfig().getClassName('wrap');
			linkHasCarouselParent = $closestLink.closest(mainWrapClass).length > 0;

			if (linkHasCarouselParent) {
				$disableElement = $closestLink;
			}
		}

		isAlreadyDisabled = $disableElement.data(disabledDataName);

		if (isAlreadyDisabled !== true) {
			var currentEventHandlers = $._data($disableElement[0], 'events'),
				clickHandlerFunctions = [],
				currentClickHandlers,
				i;

			// extract the existing click event handlers if got any
			if (
				Util.isObject(currentEventHandlers)
				&& Util.isArray(currentEventHandlers.click)
				&& currentEventHandlers.click.length > 0
			) {
				// extract the current clickhandler functions
				currentClickHandlers = currentEventHandlers.click;

				for (i = 0; i < currentClickHandlers.length; i++) {
					clickHandlerFunctions.push(currentClickHandlers[i].handler);
				}

				// store the original click handlers
				$disableElement.data('original-click-handlers', clickHandlerFunctions);

				// remove the current click handlers and add the ignore handler
				$disableElement.off('click');
			}

			// add an ignoring click handler
			$disableElement.on('click', this._ignoreEvent);

			$disableElement.data(disabledDataName, true);

			// mark it disabled to be easy to find for restoring
			$disableElement.attr('data-disabled', 'true');
		}
	};

	/**
	 * Calls the original click handlers for given element.
	 *
	 * @method _restoreClickHandlers
	 * @param {DOMElement} clickedElement Element to disable click events on
	 * @private
	 */
	DragNavigator.prototype._restoreClickHandlers = function(clickedElement) {
		var disabledDataName = this._carousel.getConfig().cssPrefix + 'click-disabled',
			$clickedElement = $(clickedElement),
			$restoreElement = null,
			$closestLink;

		// find the disabled element
		if ($clickedElement.attr('data-disabled') === 'true') {
			$restoreElement = $clickedElement;
		} else {
			$closestLink = $clickedElement.closest('A');

			if ($closestLink.length > 0 && $closestLink.attr('data-disabled') === 'true') {
				$restoreElement = $closestLink;
			}
		}

		// this should generally not happen
		if ($restoreElement === null) {
			return;
		}

		var originalClickHandlers = $restoreElement.data('original-click-handlers'),
			i;

		// remove the ignore handler
		$restoreElement.off('click');

		// restore the old click handlers if present
		if (Util.isArray(originalClickHandlers)) {
			// restore the original click handlers
			for (i = 0; i < originalClickHandlers.length; i++) {
				$restoreElement.on('click', originalClickHandlers[i].bind(clickedElement));
			}
		}

		// remove the disabled state
		$restoreElement.data(disabledDataName, false);
		$restoreElement.attr('data-disabled', null);

		/*var $clickedElement = $(clickedElement),
			disabledDataName = this._carousel.getConfig().cssPrefix + 'click-disabled',
			isDisabled = $clickedElement.data(disabledDataName);

		if (isDisabled === true) {
			// fetch the original click handlers
			var originalClickHandlers = $clickedElement.data('original-click-handlers'),
				i;

			// remove the ignore handler
			$clickedElement.off('click');

			// restore the old click handlers if present
			if (Util.isArray(originalClickHandlers)) {
				// restore the original click handlers
				for (i = 0; i < originalClickHandlers.length; i++) {
					$clickedElement.on('click', originalClickHandlers[i].bind(clickedElement));

					//originalClickHandlers[i].call(element);
				}
			}

			$clickedElement.data(disabledDataName, false);
		}*/
	};

	/**
	 * Ignores given jQuery event.
	 *
	 * TODO don't know how to unit-test this yet
	 *
	 * @method _ignoreEvent
	 * @param {jQuery.Event} e jQuery event
	 * @return {boolean} Should the event propagate
	 * @private
	 */
	/* istanbul ignore next */
	DragNavigator.prototype._ignoreEvent = function(e) {
		e.preventDefault();
		e.stopPropagation();

		return false;
	};

	return DragNavigator;
});
define('SlideshowNavigator',[
	'AbstractNavigator',
	'Util'
], function(AbstractNavigator, Util) {
	

	/**
	 * Automatic slideshow navigator.
	 *
	 * @class SlideshowNavigator
	 * @extends AbstractNavigator
	 * @param {object} config Navigator configuration
	 * @constructor
	 */
	function SlideshowNavigator(config) {
		AbstractNavigator.call(this);

		this._config = config;
		this._mode = null;
		this._delayTimeout = null;
		this._playing = false;
		this._mouseEntered = false;

		this._eventListeners = {
			mouseenter: this._onRawMouseEnter.bind(this),
			mouseleave: this._onRawMouseLeave.bind(this)
		};

		this.setMode(config.mode || SlideshowNavigator.Mode.NAVIGATE_PAGE);
	}

	SlideshowNavigator.prototype = Object.create(AbstractNavigator.prototype);

	/**
	 * List of supported navigation modes.
	 *
	 * @property Mode
	 * @type {object}
	 * @param {string} Mode.NAVIGATE_PAGE='navigate-page' Navigate one page at a time
	 * @param {string} Mode.NAVIGATE_ITEM='navigate-item' Navigate one item at a time
	 */
	SlideshowNavigator.Mode = {
		NAVIGATE_PAGE: 'navigate-page',
		NAVIGATE_ITEM: 'navigate-item'
	};

	/**
	 * Returns current slideshow navigator mode.
	 *
	 * The mode is either {{#crossLink "SlideshowNavigator/Mode/NAVIGATE_PAGE:property"}}{{/crossLink}} or
	 * {{#crossLink "SlideshowNavigator/Mode/NAVIGATE_ITEM:property"}}{{/crossLink}} meaning that slideshow changes
	 * either the page or navigate one item at a time.
	 *
	 * @method setMode
	 * @param {SlideshowNavigator/Mode:property} mode Mode to use
	 */
	SlideshowNavigator.prototype.setMode = function(mode) {
		if (!Util.objectHasValue(SlideshowNavigator.Mode, mode)) {
			throw new Error('Invalid mode "' + mode + '" provided');
		}

		this._mode = mode;
	};

	/**
	 * Returns current slideshow navigator mode.
	 *
	 * The mode is either {{#crossLink "SlideshowNavigator/Mode/NAVIGATE_PAGE:property"}}{{/crossLink}} or
	 * {{#crossLink "SlideshowNavigator/Mode/NAVIGATE_ITEM:property"}}{{/crossLink}} meaning that slideshow changes
	 * either the page or navigate one item at a time.
	 *
	 * @method getMode
	 * @return {SlideshowNavigator/Mode:property}
	 */
	SlideshowNavigator.prototype.getMode = function() {
		return this._mode;
	};

	/**
	 * Called by the init to set up the navigator.
	 *
	 * @method _setup
	 * @protected
	 */
	SlideshowNavigator.prototype._setup = function() {
		var $mainWrap = $(this._carousel.getMainWrap());

		// make sure that the mouse if over the main wrap element
		$mainWrap
			.on('mouseenter', this._eventListeners.mouseenter)
			.on('mouseleave', this._eventListeners.mouseleave);

		this._carousel.on(this._carousel.Event.NAVIGATED_TO_ITEM, this._onNavigatedToItem.bind(this));

		this.start();
	};

	/**
	 * Called by the carousel on destroy.
	 *
	 * @method destroy
	 */
	SlideshowNavigator.prototype.destroy = function() {
		var $mainWrap = $(this._carousel.getMainWrap());

		this.stop();

		// remove the event listeners
		$mainWrap
			.off('mouseenter', this._eventListeners.mouseenter)
			.off('mouseleave', this._eventListeners.mouseleave);
	};

	/**
	 * Returns whether the slideshow is currently playing.
	 *
	 * @method isActive
	 */
	SlideshowNavigator.prototype.isPlaying = function() {
		return this._playing;
	};

	/**
	 * Starts the automatic slideshow.
	 *
	 * @method start
	 */
	SlideshowNavigator.prototype.start = function() {
		if (this.isPlaying()) {
			this.stop();
		}

		this._playing = true;

		this._scheduleNextChange();
	};

	/**
	 * Starts the automatic slideshow.
	 *
	 * @method start
	 */
	SlideshowNavigator.prototype.stop = function() {
		if (this._delayTimeout !== null) {
			window.clearTimeout(this._delayTimeout);

			this._delayTimeout = null;
		}

		this._playing = false;
	};

	/**
	 * Schedules the next change event.
	 *
	 * @method _scheduleNextChange
	 * @private
	 */
	SlideshowNavigator.prototype._scheduleNextChange = function() {
		if (!this.isPlaying()) {
			return;
		}

		var interval = this._config.interval;

		// clear existing
		if (this._delayTimeout !== null) {
			window.clearTimeout(this._delayTimeout);

			this._delayTimeout = null;
		}

		// perform action after timeout and schedule another one
		this._delayTimeout = window.setTimeout(function() {
			if (this._carousel === null || !this._carousel.isInitiated()) {
				return;
			}

			this._performChange();
			this._scheduleNextChange();
		}.bind(this), interval);
	};

	/**
	 * Performs the change event.
	 *
	 * @method _performChange
	 * @private
	 */
	SlideshowNavigator.prototype._performChange = function() {
		// don't control the carousel when user is hovering it
		if (this._mouseEntered) {
			return;
		}

		var instantRollover = this._config.instantRollover;

		if (this._mode === SlideshowNavigator.Mode.NAVIGATE_PAGE) {
			if (this._carousel.getPageCount() > 0) {
				if (this._carousel.isLastPage()) {
					this._carousel.navigateToPage(0, instantRollover);
				} else {
					this._carousel.navigateToNextPage();
				}
			}
		} else if (this._mode === SlideshowNavigator.Mode.NAVIGATE_ITEM) {
			if (this._carousel.getItemCount() > 0) {
				if (this._carousel.isLastItem()) {
					this._carousel.navigateToItem(0, instantRollover);
				} else {
					this._carousel.navigateToNextItem();
				}
			}
		}
	};

	/**
	 * Called on mouse enter event.
	 *
	 * @method _onRawMouseEnter
	 * @param {Event} e Mouse event
	 * @private
	 */
	SlideshowNavigator.prototype._onRawMouseEnter = function(/*e*/) {
		this._mouseEntered = true;
	};

	/**
	 * Called on mouse enter event.
	 *
	 * @method _onRawMouseLeave
	 * @param {Event} e Mouse event
	 * @private
	 */
	SlideshowNavigator.prototype._onRawMouseLeave = function(/*e*/) {
		this._mouseEntered = false;

		// re-schedule the change event for consistent timing
		this._scheduleNextChange();
	};

	/**
	 * Called when user navigated to a new item.
	 *
	 * @method _onNavigatedToItem
	 * @private
	 */
	SlideshowNavigator.prototype._onNavigatedToItem = function() {
		// re-schedule the change event for consistent timing
		this._scheduleNextChange();
	};

	return SlideshowNavigator;
});
define('InterfaceNavigator',[
	'AbstractNavigator',
	'Util'
], function(AbstractNavigator, Util) {
	

	/**
	 * Build a user interface for navigating the carousel.
	 *
	 * @class InterfaceNavigator
	 * @extends AbstractNavigator
	 * @param {object} config Navigator configuration
	 * @constructor
	 */
	function InterfaceNavigator(config) {
		AbstractNavigator.call(this);

		this._config = config;
		this._mode = null;
		this._mouseEntered = false;

		this._eventListeners = {
			mouseenter: this._onRawMouseEnter.bind(this),
			mouseleave: this._onRawMouseLeave.bind(this)
		};

		this.setMode(config.mode || InterfaceNavigator.Mode.NAVIGATE_PAGE);
	}

	InterfaceNavigator.prototype = Object.create(AbstractNavigator.prototype);

	/**
	 * List of supported navigation modes.
	 *
	 * @property Mode
	 * @type {object}
	 * @param {string} Mode.NAVIGATE_PAGE='navigate-page' Navigate one page at a time
	 * @param {string} Mode.NAVIGATE_ITEM='navigate-item' Navigate one item at a time
	 */
	InterfaceNavigator.Mode = {
		NAVIGATE_PAGE: 'navigate-page',
		NAVIGATE_ITEM: 'navigate-item'
	};

	/**
	 * Returns current interface navigator mode.
	 *
	 * The mode is either {{#crossLink "InterfaceNavigator/Mode/NAVIGATE_PAGE:property"}}{{/crossLink}} or
	 * {{#crossLink "InterfaceNavigator/Mode/NAVIGATE_ITEM:property"}}{{/crossLink}} meaning that slideshow changes
	 * either the page or navigate one item at a time.
	 *
	 * @method setMode
	 * @param {InterfaceNavigator/Mode:property} mode Mode to use
	 */
	InterfaceNavigator.prototype.setMode = function(mode) {
		if (!Util.objectHasValue(InterfaceNavigator.Mode, mode)) {
			throw new Error('Invalid mode "' + mode + '" provided');
		}

		this._mode = mode;
	};

	/**
	 * Returns current interface navigator mode.
	 *
	 * The mode is either {{#crossLink "InterfaceNavigator/Mode/NAVIGATE_PAGE:property"}}{{/crossLink}} or
	 * {{#crossLink "InterfaceNavigator/Mode/NAVIGATE_ITEM:property"}}{{/crossLink}} meaning that buttons change
	 * either the page or navigate one item at a time.
	 *
	 * @method getMode
	 * @return {InterfaceNavigator/Mode:property}
	 */
	InterfaceNavigator.prototype.getMode = function() {
		return this._mode;
	};

	/**
	 * Called by the init to set up the navigator.
	 *
	 * @method _setup
	 * @protected
	 */
	InterfaceNavigator.prototype._setup = function() {
		var $mainWrap = $(this._carousel.getMainWrap());

		// make sure that the mouse if over the main wrap element
		$mainWrap
			.on('mouseenter', this._eventListeners.mouseenter)
			.on('mouseleave', this._eventListeners.mouseleave);

		this._carousel.on(this._carousel.Event.NAVIGATING_TO_ITEM, this._onNavigatingToItem.bind(this));
		this._carousel.on(this._carousel.Event.LAYOUT_CHANGED, this._onLayoutChanged.bind(this));

		this._redraw();
	};

	/**
	 * Build the user interface.
	 *
	 * @method _redraw
	 * @protected
	 */
	InterfaceNavigator.prototype._redraw = function() {
		var cssPrefix = this._carousel.getConfig().cssPrefix,
			className = {
				wrap: cssPrefix + 'interface',
				itemChoice: cssPrefix + 'item-choice'
			},
			itemCount = this._config.mode === 'navigate-page'
				? this._carousel.getPageCount()
				: this._carousel.getItemCount(),
			$mainWrap = $(this._carousel.getMainWrap()),
			$interfaceWrap = $('<div/>', {
				'class': className.wrap
			}),
			$itemChoiceWrap = $('<ul/>', {
				'class': className.itemChoice
			}).appendTo($interfaceWrap),
			$itemChoiceElement,
			i;

		// remove existing interface if exists
		$mainWrap.find('.' + className.wrap).remove();

		if (itemCount > 1) {
			// create the item choice items
			for (i = 0; i < itemCount; i++) {
				$itemChoiceElement = $('<li/>').text(i + 1).appendTo($itemChoiceWrap);

				$itemChoiceElement.click(function (index, e) {
					this._onItemChoiceClick(e.target, index);
				}.bind(this, i));
			}

			// add the new one
			$mainWrap.append($interfaceWrap);

			// set the initially active element
			this._updateActiveItemChoice();
		}
	};

	/**
	 * Called when any of the item choice elements are clicked.
	 *
	 * @method _onItemChoiceClick
	 * @param {DOMElement} element Clicked element
	 * @param {number} index Item index
	 * @protected
	 */
	InterfaceNavigator.prototype._onItemChoiceClick = function(element, index) {
		if (this._mode === InterfaceNavigator.Mode.NAVIGATE_PAGE) {
			this._carousel.navigateToPage(index);
		} else if (this._mode === InterfaceNavigator.Mode.NAVIGATE_ITEM) {
			this._carousel.navigateToItem(index);
		}
	};

	/**
	 * Called by the carousel on destroy.
	 *
	 * @method destroy
	 */
	InterfaceNavigator.prototype.destroy = function() {
		var cssPrefix = this._carousel.getConfig().cssPrefix,
			className = {
				wrap: cssPrefix + 'interface',
			},
			$mainWrap = $(this._carousel.getMainWrap()),
			$interfaceWrap = $mainWrap.find('.' + className.wrap);

		// remove the interface element
		$interfaceWrap.remove();

		// remove the event listeners
		$mainWrap
			.off('mouseenter', this._eventListeners.mouseenter)
			.off('mouseleave', this._eventListeners.mouseleave);
	};

	/**
	 * Performs the change event.
	 *
	 * @method _performChange
	 * @private
	 */
	/*InterfaceNavigator.prototype._performChange = function() {
		// don't control the carousel when user is hovering it
		if (this._mouseEntered) {
			return;
		}

		var instantRollover = this._config.instantRollover;

		if (this._mode === InterfaceNavigator.Mode.NAVIGATE_PAGE) {
			if (this._carousel.getPageCount() > 0) {
				if (this._carousel.isLastPage()) {
					this._carousel.navigateToPage(0, instantRollover);
				} else {
					this._carousel.navigateToNextPage();
				}
			}
		} else if (this._mode === InterfaceNavigator.Mode.NAVIGATE_ITEM) {
			if (this._carousel.getItemCount() > 0) {
				if (this._carousel.isLastItem()) {
					this._carousel.navigateToItem(0, instantRollover);
				} else {
					this._carousel.navigateToNextItem();
				}
			}
		}
	};*/

	/**
	 * Called on mouse enter event.
	 *
	 * @method _onRawMouseEnter
	 * @param {Event} e Mouse event
	 * @private
	 */
	InterfaceNavigator.prototype._onRawMouseEnter = function(/*e*/) {
		this._mouseEntered = true;
	};

	/**
	 * Called on mouse enter event.
	 *
	 * @method _onRawMouseLeave
	 * @param {Event} e Mouse event
	 * @private
	 */
	InterfaceNavigator.prototype._onRawMouseLeave = function(/*e*/) {
		this._mouseEntered = false;
	};

	/**
	 * Called when user navigated to a new item.
	 *
	 * @method _onNavigatingToItem
	 * @private
	 */
	InterfaceNavigator.prototype._onNavigatingToItem = function() {
		this._updateActiveItemChoice();
	};

	/**
	 * Gives the right element the active item class.
	 *
	 * @method _updateActiveItemChoice
	 * @private
	 */
	InterfaceNavigator.prototype._updateActiveItemChoice = function() {
		var cssPrefix = this._carousel.getConfig().cssPrefix,
			className = {
				wrap: cssPrefix + 'interface',
				itemChoice: cssPrefix + 'item-choice',
				isActive: cssPrefix + 'active-item-choice'
			},
			$mainWrap = $(this._carousel.getMainWrap()),
			$interfaceWrap = $mainWrap.find('.' + className.wrap),
			$itemChoiceWrap = $interfaceWrap.find('.' + className.itemChoice),
			targetItemIndex = this._carousel.getTargetItemIndex(),
			$itemChoiceElement,
			itemIndex;

		if (this._mode === InterfaceNavigator.Mode.NAVIGATE_PAGE) {
			itemIndex = this._carousel.getItemPageIndex(targetItemIndex);
		} else if (this._mode === InterfaceNavigator.Mode.NAVIGATE_ITEM) {
			itemIndex = targetItemIndex;
		}

		$itemChoiceElement = $itemChoiceWrap.find('LI:eq(' + itemIndex + ')');

		$itemChoiceWrap.find('LI.' + className.isActive).removeClass(className.isActive);
		$itemChoiceElement.addClass(className.isActive);
	};

	/**
	 * Called when the carousel layout changes.
	 *
	 * @method _onLayoutChanged
	 * @private
	 */
	InterfaceNavigator.prototype._onLayoutChanged = function() {
		this._redraw();
	};

	return InterfaceNavigator;
});
define('Config',[
	'jquery',
	'Deferred',
	'KeyboardNavigator',
	'DragNavigator',
	'SlideshowNavigator',
	'InterfaceNavigator',
], function($, Deferred, KeyboardNavigator, DragNavigator, SlideshowNavigator, InterfaceNavigator) {
	

	/**
	 * Provides configuration.
	 *
	 * @class Config
	 * @constructor
	 */
	function Config() {

		/**
		 * Carousel orientation to use.
		 *
		 * One of {{#crossLink "Config/Orientation:property"}}{{/crossLink}}.
		 *
		 * Defaults to horizontal.
		 *
		 * @property orientation
		 * @type {Config/Orientation:property}
		 * @default Config.Orientation.VERTICAL
		 */
		this.orientation = Config.Orientation.HORIZONTAL;

		/**
		 * The size mode to use, defaults to matching item sizes to wrap size.
		 *
		 * @property sizeMode
		 * @type {Config/SizeMode:property}
		 * @default Config.SizeMode.MATCH_WRAP
		 */
		this.sizeMode = Config.SizeMode.MATCH_WRAP;

		/**
		 * Item margin to use.
		 *
		 * @property margin
		 * @type {number}
		 * @default 0
		 */
		this.margin = 0;

		/**
		 * Should placeholders be generated while loading actual items.
		 *
		 * @property usePlaceholders
		 * @type boolean
		 * @default true
		 */
		this.usePlaceholders = true;

		/**
		 * Should responsive layout be used by default.
		 *
		 * @property useResponsiveLayout
		 * @type boolean
		 * @default true
		 */
		this.useResponsiveLayout = true;

		/**
		 * Number of items to render side-by-side when not using responsive layout.
		 *
		 * This parameter is ignored when using responsive layout strategy.
		 *
		 * @property itemsPerPage
		 * @type number
		 * @default 5
		 */
		this.itemsPerPage = 5;

		/**
		 * The index of the element to scroll to at startup.
		 *
		 * Set to a number value of valid range to enable.
		 *
		 * Defaults to showing the first element.
		 *
		 * Set either this or the {{#crossLink "Config/startPageIndex:property"}}{{/crossLink}} property, setting both
		 * throws error.
		 *
		 * @property startItemIndex
		 * @type {number}
		 * @default null
		 */
		this.startItemIndex = null;

		/**
		 * The index of the page to scroll to at startup.
		 *
		 * Set to a number value of valid range to enable.
		 *
		 * Defaults to showing the first element.
		 *
		 * Set either this or the {{#crossLink "Config/startItemIndex:property"}}{{/crossLink}} property, setting both
		 * throws error.
		 *
		 * @property startPageIndex
		 * @type {number}
		 * @default null
		 */
		this.startPageIndex = null;

		/**
		 * If item or page start index is set then should it animate to it or should the position be set immediately.
		 *
		 * Applies to both {{#crossLink "Config/startIndex:property"}}{{/crossLink}} and
		 * {{#crossLink "Config/startPageIndex:property"}}{{/crossLink}}.
		 *
		 * By default the position is set without animation.
		 *
		 * @property animateToStartIndex
		 * @type {boolean}
		 * @default false
		 */
		this.animateToStartIndex = false;

		/**
		 * When using the {{#crossLink "Config/startItemIndex:property"}}{{/crossLink}} property, should the carousel
		 * try to center on this item index rather than making it the first one.
		 *
		 * @property centerStartItemIndex
		 * @type {boolean}
		 * @default false
		 */
		this.centerStartItemIndex = false;

		/**
		 * Should items that are navigated out of the rendering range given by
		 * {{#crossLink "Config/getRenderRange"}}{{/crossLink}} be removed.
		 *
		 * This ensures that there are never too many elements in the DOM but when navigating back to these items, they
		 * have to be re-generated.
		 *
		 * Set this to true to always remove out of range items, false to never remove them and null to let the
		 * carousel decide based on the number of items.
		 *
		 * @default removeOutOfRangeItems
		 * @type {boolean|null}
		 * @default null
		 */
		this.removeOutOfRangeItems = null;

		/**
		 * If {{#crossLink "Config/removeOutOfRangeItems:property"}}{{/crossLink}} is not set to a boolean value then
		 * this value is used to decide whether to remove out of range items or not so if the number of items in the
		 * dataset is smaller then this, out of range items are not destroyed.
		 *
		 * @property removeOutOfRangeItemsThreshold
		 * @type {number}
		 * @default 30
		 */
		this.removeOutOfRangeItemsThreshold = 30;

		/**
		 * List of default responsive layout breakpoint.
		 *
		 * The list should be ordered from the smallest size to the largest.
		 *
		 * @property responsiveBreakpoints
		 * @type array
		 * @default true
		 */
		this.responsiveBreakpoints = [{
			size: 0,
			itemsPerPage: 1
		}, {
			size: 320,
			itemsPerPage: 2
		}, {
			//size: 768,
			size: 560, // TODO remove
			itemsPerPage: 3
		}, {
			size: 1224,
			itemsPerPage: 4
		}, {
			size: 1824,
			itemsPerPage: 5
		}];

		/**
		 * The interval at which to check for carousel wrap size changes so responsive layout could be applied.
		 *
		 * Value is in milliseconds.
		 *
		 * @property responsiveLayoutListenerInterval
		 * @type {number}
		 * @default 100
		 */
		this.responsiveLayoutListenerInterval = 100;

		/**
		 * How long to wait for the wrap size to stay the same before starting the responsive layout routine.
		 *
		 * This is useful so when the user is resizing the browser window then the carousel won't try to re-layout
		 * itself on every frame but rather waits for the size to normalize.
		 *
		 * Value is in milliseconds.
		 *
		 * @property responsiveLayoutDelay
		 * @type {number}
		 * @default 300
		 */
		this.responsiveLayoutDelay = 500;

		/**
		 * List of navigators to use with their configuration and factories.
		 *
		 * The "createInstance(carousel)" factory method gets the carousel instance as its only parameter and should
		 * either return a navigator instance directly or a deferred promise that will be resolved with a navigator
		 * instance.
		 *
		 * @property navigators
		 * @type {object}
		 */
		this.navigators = {
			keyboard: {
				enabled: true,
				mode: 'navigate-page',
				createInstance: function(carousel) {
					return new KeyboardNavigator(carousel.getConfig().navigators.keyboard);
				}
			},
			drag: {
				enabled: true,
				mode: 'navigate-page',
				overEdgeDragPositionMultiplier: 0.2,
				ignoreClickThreshold: 10,
				createInstance: function(carousel) {
					return new DragNavigator(carousel.getConfig().navigators.drag);
				}
			},
			slideshow: {
				enabled: false,
				mode: 'navigate-page',
				interval: 3000,
				instantRollover: true,
				createInstance: function(carousel) {
					return new SlideshowNavigator(carousel.getConfig().navigators.slideshow);
				}
			},
			interface: {
				enabled: false,
				mode: 'navigate-page',
				createInstance: function(carousel) {
					return new InterfaceNavigator(carousel.getConfig().navigators.slideshow);
				}
			}
		};

		/**
		 * Default animator configuration.
		 *
		 * @property defaultAnimator
		 * @param {number} defaultAnimator.defaultAnimationSpeed=2 Default animation speed in pixels per millisecond
		 * @param {number} defaultAnimator.minAnimationSpeed=1 Minimum animation speed in pixels per millisecond
		 * @param {number} defaultAnimator.maxAnimationSpeed=10 Maximum animation speed in pixels per millisecond
		 */
		this.defaultAnimator = {
			defaultAnimationSpeed: 4,
			minAnimationSpeed: 1,
			maxAnimationSpeed: 10
		};

		/**
		 * Configuration for the animation shown when user tries to navigate past the first or last item.
		 *
		 * @property limitAnimation
		 * @type {object}
		 * @param {boolean} limitAnimation.enabled Should the limit animation be shown
		 * @param {number} limitAnimation.movePixels How many pixels to animate past the end
		 * @param {number} limitAnimation.moveDuration Duration of the animation
		 */
		this.limitAnimation = {
			enabled: true,
			movePixels: 30,
			moveDuration: 150
		};

		/**
		 * The css classes prefix to use.
		 *
		 * The same prefix is also used when assigning custom carousel-specific data to the element.
		 *
		 * @property cssPrefix
		 * @type {string}
		 * @default 'flow-carousel-'
		 */
		this.cssPrefix = 'flow-carousel-';

		/**
		 * CSS class names to use.
		 *
		 * The class name is combined with the {{#crossLink "Config/cssPrefix:property"}}{{/crossLink}} property
		 * so if the prefix is "flow-carousel-" and the wrap class is "wrap" then the main wrap will get the
		 * "flow-carousel-wrap" class.
		 *
		 * @property cssClasses
		 * @param {string} cssClasses.wrap='wrap' Assigned to the main wrap element
		 * @param {string} cssClasses.items='items' Assigned to the items wrap element in the main wrap
		 * @param {string} cssClasses.scroller='scroller' Assigned to the animated scroller wrap in the items wrap
		 * @param {string} cssClasses.item='item' Assigned to each item wrapper containing the actual item
		 * @param {string} cssClasses.itemHover='item-hover' Assigned to item wrapper on hover and removed on mouse out
		 * @param {string} cssClasses.placeholder='placeholder' Assigned to each item wrapper that is a placeholder
		 * @param {string} cssClasses.matchWrap='match-wrap' Assigned to main wrap when using the wrap size match mode
		 * @param {string} cssClasses.matchLargestItem='match-largest-item' Assigned to main wrap when matching the wrap
		 * 				   size to the largest item size
		 * @param {string} cssClasses.horizontal='horizontal' Assigned to main wrap for horizontal orientation
		 * @param {string} cssClasses.vertical='vertical' Assigned to main wrap for vertical orientation
		 * @param {string} cssClasses.animateTransform='animate-transform' With this class added the transforms get
		 * 				   animated as well
		 * @param {string} cssClasses.initiating='initiating' Assigned to main wrap during initialization procedure
		 * @param {string} cssClasses.loading='loading' Assigned to main wrap during loading of items
		 * @param {string} cssClasses.rendering='rendering' Assigned to main wrap during rendering of items
		 * @type {object}
		 */
		this.cssClasses = {
			wrap: 'wrap',
			items: 'items',
			scroller: 'scroller',
			item: 'item',
			placeholder: 'placeholder',
			itemHover: 'item-hover',
			matchWrap: 'match-wrap',
			matchLargestItem: 'match-largest-item',
			horizontal: 'horizontal',
			vertical: 'vertical',
			animateTransform: 'animate-transform',
			initiating: 'initiating',
			loading: 'loading',
			rendering: 'rendering'
		};

		/**
		 * The carousel instance is registered as the main wrap data with the dataTarget name.
		 *
		 * @property dataTarget
		 * @type {string}
		 * @default 'flow-carousel'
		 */
		this.dataTarget = 'flow-carousel';

		/**
		 * Optional custom data source to use.
		 *
		 * As a special case, a simple array can be provided as data source which is converted to use
		 * {{#crossLink "ArrayDataSource"}}{{/crossLink}} implementation.
		 *
		 * If none is provided then the {{#crossLink "HtmlDataSource"}}{{/crossLink}} is used.
		 *
		 * @property renderer
		 * @type {AbstractRenderer|array}
		 * @default null
		 */
		this.dataSource = null;

		/**
		 * Optional custom renderer to use.
		 *
		 * If none is provided then the {{#crossLink "HtmlRenderer"}}{{/crossLink}} is used.
		 *
		 * @property renderer
		 * @type {AbstractRenderer}
		 * @default null
		 */
		this.renderer = null;

		/**
		 * Optional custom animator to use.
		 *
		 * Should be an instance of {{#crossLink "AbstractAnimator"}}{{/crossLink}}.
		 *
		 * If none is provided then the {{#crossLink "DefaultAnimator"}}{{/crossLink}} is used.
		 *
		 * @property animator
		 * @type {AbstractAnimator}
		 * @default null
		 */
		this.animator = null;

		/**
		 * Returns the range of items that should be rendered given current item index and items per page.
		 *
		 * By default returns one page before the current page and one after but one may choose to override it.
		 *
		 * @method getRenderRange
		 * @param {number} currentItemIndex Currently scrolled position index
		 * @param {number} itemsPerPage How many items are shown on a page
		 * @param {number} itemCount How many items there are in total
		 * @return {object} Render range with start and end keys
		 * @private
		 */
		this.getRenderRange = function(currentItemIndex, itemsPerPage, itemCount) {
			return {
				start: Math.max(currentItemIndex - itemsPerPage, 0),
				end: Math.min(currentItemIndex + itemsPerPage * 2 - 1, itemCount - 1)
			};
		};
	}

	/**
	 * Enumeration of possible carousel orientations.
	 *
	 * @property Orientation
	 * @type {object}
	 * @param {string} Orientation.HORIZONTAL='horizontal' Horizontal orientation
	 * @param {string} Orientation.VERTIAL='vertical' Vertical orientation
	 * @static
	 */
	Config.Orientation = {
		HORIZONTAL: 'horizontal',
		VERTICAL: 'vertical'
	};

	/**
	 * There are two different strategies for setting the size of the wrap and the items:
	 * > MATCH_WRAP - the size of the items is set to match the wrap size
	 * > MATCH_LARGEST_ITEM - the size of the wrap is set to match the largest item
	 *
	 * @property SizeMode
	 * @type {object}
	 * @param {string} Orientation.MATCH_WRAP='match-wrap' Items size is based on wrap size
	 * @param {string} Orientation.MATCH_LARGEST_ITEM='match-largest-item' Wrap size is based on items size
	 * @static
	 */
	Config.SizeMode = {
		MATCH_WRAP: 'match-wrap',
		MATCH_LARGEST_ITEM: 'match-largest-item'
	};

	/**
	 * Extends the base default configuration properties with user-defined values.
	 *
	 * Performs a deep-extend.
	 *
	 * @method extend
	 * @param {object} userConfig
	 */
	Config.prototype.extend = function(userConfig) {
		$.extend(true, this, userConfig);
	};

	/**
	 * Returns the number of items to render side-by-side based on the wrap size and
	 * {{#crossLink "Config/responsiveBreakpoints:property"}}{{/crossLink}} setting.
	 *
	 * @method getItemsPerPage
	 * @param {number} wrapSize Wrap size to base the calculation on
	 */
	Config.prototype.getItemsPerPage = function(wrapSize) {
		var i,
			breakpoint;

		if (!this.useResponsiveLayout) {
			return this.itemsPerPage;
		}

		// TODO could be cached
		for (i = this.responsiveBreakpoints.length - 1; i >= 0; i--) {
			breakpoint = this.responsiveBreakpoints[i];

			if (breakpoint.size <= wrapSize) {
				return breakpoint.itemsPerPage;
			}
		}

		return this.responsiveBreakpoints[0].itemsPerPage;
	};

	/**
	 * Returns class name to use by type.
	 *
	 * The class name is constructed by combining the value of {{#crossLink "Config/cssPrefix:property"}}{{/crossLink}}
	 * and the mapping in {{#crossLink "Config/cssClasses:property"}}{{/crossLink}}.
	 *
	 * Throws error if invalid class name type is requested.
	 *
	 * @method getClassName
	 * @param {string} type Class name type, one of the keys in cssClasses
	 * @return {string}
	 */
	Config.prototype.getClassName = function(type) {
		if (typeof(this.cssClasses[type]) === 'undefined') {
			throw new Error('Unknown CSS class type "' + type + '" requested');
		}

		return this.cssPrefix + this.cssClasses[type];
	};

	return Config;
});
define('AbstractDataSource',[
], function() {
	

	/**
	 * Data source interface.
	 *
	 * @class AbstractDataSource
	 * @constructor
	 */
	function AbstractDataSource() {}

	/**
	 * Returns the number of items in the dataset.
	 *
	 * @method getItemCount
	 * @return {number}
	 */
	AbstractDataSource.prototype.getItemCount = function() {
		throw new Error('Not implemented');
	};

	/**
	 * Returns whether given data source is asynchronous or not.
	 *
	 * If the data source is asynchronous then placeholders are generated by default while the real data is loading.
	 *
	 * Defaults to false so make sure to override this in your async data sources.
	 *
	 * @method isAsynchronous
	 * @return {boolean}
	 */
	AbstractDataSource.prototype.isAsynchronous = function() {
		return false;
	};

	/**
	 * Fetches given range of items from the dataset.
	 *
	 * This operation can be asynchronous and thus returns a promise that will be resolved once the data becomes
	 * available or rejected when an error occurs.
	 *
	 * By default the range is the entire dataset.
	 *
	 * Throws error if invalid range is requested.
	 *
	 * @method getItems
	 * @param {number} [startIndex=0] Range start index to fetch
	 * @param {number} [endIndex=length] Range end index to fetch
	 * @return {Deferred.Promise}
	 */
	AbstractDataSource.prototype.getItems = function(startIndex, endIndex) {
		void(startIndex, endIndex);

		throw new Error('Not implemented');
	};

	/**
	 * Called by the carousel on destroy.
	 *
	 * @method destroy
	 */
	AbstractDataSource.prototype.destroy = function() {
		// do nothing by default
	};

	return AbstractDataSource;
});
define('ArrayDataSource',[
	'AbstractDataSource',
	'Deferred'
], function(AbstractDataSource, Deferred) {
	

	/**
	 * Data source interface.
	 *
	 * @class ArrayDataSource
	 * @extends AbstractDataSource
	 * @constructor
	 */
	function ArrayDataSource(data) {
		AbstractDataSource.call(this);

		this._data = data || [];
	}

	ArrayDataSource.prototype = Object.create(AbstractDataSource.prototype);

	/**
	 * Sets new data to use.
	 *
	 * @method setData
	 * @param {array} data New data
	 */
	ArrayDataSource.prototype.setData = function(data) {
		this._data = data;
	};

	/**
	 * Returns the number of items in the dataset.
	 *
	 * @method getItemCount
	 * @return {number}
	 */
	ArrayDataSource.prototype.getItemCount = function() {
		return this._data.length;
	};

	/**
	 * Fetches given range of items from the dataset.
	 *
	 * This operation can be asynchronous and thus returns a promise that will be resolved once the data becomes
	 * available or rejected when an error occurs.
	 *
	 * By default the range is the entire dataset.
	 *
	 * Throws error if invalid range is requested.
	 *
	 * @method getItems
	 * @param {number} [startIndex=0] Range start index to fetch
	 * @param {number} [endIndex=length] Range end index to fetch
	 * @return {Deferred.Promise}
	 */
	ArrayDataSource.prototype.getItems = function(startIndex, endIndex) {
		var deferred = new Deferred();

		startIndex = typeof startIndex === 'number' ? startIndex : 0;
		endIndex = typeof endIndex === 'number' ? endIndex : this._data.length - 1;

		// validate index range
		if (startIndex < 0) {
			throw new Error('Invalid negative start index "' + startIndex + '" requested');
		} else if (endIndex > this._data.length - 1) {
			throw new Error(
				'Too large end index "' + endIndex + '" requested, there are only ' + this._data.length + ' items'
			);
		}

		// resolve the deferred immediately as array data source is syncronous
		deferred.resolve(this._data.slice(startIndex, endIndex + 1));

		return deferred.promise();
	};

	return ArrayDataSource;
});
define('HtmlDataSource',[
	'jquery',
	'AbstractDataSource',
	'Deferred'
], function($, AbstractDataSource, Deferred) {
	

	/**
	 * Data source interface.
	 *
	 * @class HtmlDataSource
	 * @extends AbstractDataSource
	 * @constructor
	 */
	function HtmlDataSource(wrap) {
		AbstractDataSource.call(this);

		this._wrap = wrap;
		this._data = this._setupData(this._wrap);
	}

	HtmlDataSource.prototype = Object.create(AbstractDataSource.prototype);

	/**
	 * Returns the number of items in the dataset.
	 *
	 * @method getItemCount
	 * @return {number}
	 */
	HtmlDataSource.prototype.getItemCount = function() {
		return this._data.length;
	};

	/**
	 * Fetches given range of items from the dataset.
	 *
	 * This operation can be asynchronous and thus returns a promise that will be resolved once the data becomes
	 * available or rejected when an error occurs.
	 *
	 * By default the range is the entire dataset.
	 *
	 * Throws error if invalid range is requested.
	 *
	 * @method getItems
	 * @param {number} [startIndex=0] Range start index to fetch
	 * @param {number} [endIndex=length] Range end index to fetch
	 * @return {Deferred.Promise}
	 */
	HtmlDataSource.prototype.getItems = function(startIndex, endIndex) {
		var deferred = new Deferred();

		startIndex = typeof startIndex === 'number' ? startIndex : 0;
		endIndex = typeof endIndex === 'number' ? endIndex : this._data.length - 1;

		// validate index range
		if (startIndex < 0) {
			throw new Error('Invalid negative start index "' + startIndex + '" requested');
		} else if (endIndex > this._data.length - 1) {
			throw new Error(
				'Too large end index "' + endIndex + '" requested, there are only ' + this._data.length + ' items'
			);
		}

		// resolve the deferred immediately as array data source is syncronous
		deferred.resolve(this._data.slice(startIndex, endIndex + 1));

		return deferred.promise();
	};

	/**
	 * Extracts the HTML item elements from the given wrap and uses them as data.
	 *
	 * @method _setupData
	 * @param {DOMElement} wrap Wrap to get items from
	 * @return {array}
	 */
	HtmlDataSource.prototype._setupData = function(wrap) {
		var elements = [];

		$(wrap).children().each(function(index, element) {
			elements.push(element);

			// detach the original element from the dom
			$(element).detach();
		});

		return elements;
	};

	return HtmlDataSource;
});
define('AbstractAnimator',[
], function() {
	

	/**
	 * Animator interface.
	 *
	 * @class AbstractAnimator
	 * @constructor
	 * @param {FlowCarousel} carousel The carousel component
	 */
	function AbstractAnimator(carousel) {
		void(carousel);
	}

	/**
	 * Returns current absolute position.
	 *
	 * @method getCurrentPosition
	 * @return {number}
	 */
	AbstractAnimator.prototype.getCurrentPosition = function() {
		throw new Error('Not implemented');
	};

	/**
	 * Animates the carousel to given item index position.
	 *
	 * @method animateToItem
	 * @param {number} itemIndex Index of the item
	 * @param {boolean} [instant=false] Should the navigation be instantaneous and not use animation
	 * @return {Deferred.Promise}
	 */
	AbstractAnimator.prototype.animateToItem = function(itemIndex, instant) {
		void(itemIndex, instant);

		throw new Error('Not implemented');
	};

	/**
	 * Animates the carousel to given absolute position.
	 *
	 * One can set either a custom animation speed in pixels per millisecond or custom animation duration in
	 * milliseconds. If animation duration is set then animation speed is ignored.
	 *
	 * @method animateToPosition
	 * @param {number} position Requested position
	 * @param {boolean} [instant=false] Should the navigation be instantaneous and not use animation
	 * @param {boolean} [noDeferred=false] Does not create a deferred if set to true
	 * @param {number} [animationSpeed] Animation speed in pixels per millisecond
	 * @param {number} [animationDuration] Optional animation duration in milliseconds
	 * @return {Deferred.Promise}
	 */
	AbstractAnimator.prototype.animateToPosition = function(
		position,
		instant,
		noDeferred,
		animationSpeed,
		animationDuration
	) {
		void(position, instant, noDeferred, animationSpeed, animationDuration);

		throw new Error('Not implemented');
	};

	/**
	 * Called by the carousel once it's structure has been initiated.
	 *
	 * @method onCarouselElementReady
	 */
	AbstractAnimator.prototype.onCarouselElementReady = function() {
		// do nothing by default
	};

	/**
	 * Called by the carousel on destroy.
	 *
	 * @method destroy
	 */
	AbstractAnimator.prototype.destroy = function() {
		// do nothing by default
	};

	return AbstractAnimator;
});
define('DefaultAnimator',[
	'jquery',
	'AbstractAnimator',
	'Config',
	'Util',
	'Deferred'
], function($, AbstractAnimator, Config, Util, Deferred) {
	

	// requestAnimationFrame polyfill
	(function () {
		var lastTime = 0,
			vendors = ['webkit', 'moz'],
			x;

		for (x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
			window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];

			window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
				|| window[vendors[x] + 'CancelRequestAnimationFrame'];
		}

		if (!window.requestAnimationFrame) {
			window.requestAnimationFrame = function(callback/*, element*/) {
				var currTime = new Date().getTime(),
					timeToCall = Math.max(0, 16 - (currTime - lastTime)),
					id = window.setTimeout(function () {
						callback(currTime + timeToCall);
					},
					timeToCall);

				lastTime = currTime + timeToCall;

				return id;
			};
		}

		if (!window.cancelAnimationFrame) {
			window.cancelAnimationFrame = function(id) {
				clearTimeout(id);
			};
		}
	}());

	/**
	 * Data source interface.
	 *
	 * @class DefaultAnimator
	 * @extends AbstractAnimator
	 * @constructor
	 * @param {FlowCarousel} carousel The carousel component
	 */
	function DefaultAnimator(carousel) {
		AbstractAnimator.call(this, carousel);

		this._carousel = carousel;
		this._activeDeferred = null;
		this._transitionEndListenerCreated = false;
		this._isUsingAnimatedTransform = true;
		this._eventListeners = {
			transitionEnd: this._onRawTransitionEnd.bind(this)
		};
	}

	DefaultAnimator.prototype = Object.create(AbstractAnimator.prototype);

	/**
	 * Called by the carousel on destroy.
	 *
	 * @method destroy
	 */
	DefaultAnimator.prototype.destroy = function() {
		var $scrollerWrap = $(this._carousel.getScrollerWrap());

		// remove the transition end listener
		$scrollerWrap.off(
			'transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd',
			this._eventListeners.transitionEnd
		);
	};

	/**
	 * Returns current absolute position.
	 *
	 * @method getCurrentPosition
	 * @return {number}
	 */
	DefaultAnimator.prototype.getCurrentPosition = function() {
		var $scrollerWrap = $(this._carousel.getScrollerWrap()),
			transformMatrix = $scrollerWrap.css('transform'),
			transformOffset = Util.parseTransformMatrix(transformMatrix),
			orientation = this._carousel.getOrientation();

		if (orientation === Config.Orientation.HORIZONTAL) {
			return transformOffset.x;
		} else {
			return transformOffset.y;
		}
	};

	/**
	 * Animates the carousel to given item index position.
	 *
	 * @method animateToItem
	 * @param {number} itemIndex Index of the item
	 * @param {boolean} [instant=false] Should the navigation be instantaneous and not use animation
	 * @param {number} [animationSpeed] Optional animation speed in pixels per millisecond
	 * @return {Deferred.Promise}
	 */
	DefaultAnimator.prototype.animateToItem = function(itemIndex, instant, animationSpeed) {
		var position = this._carousel.getItemPositionByIndex(itemIndex);

		return this.animateToPosition(position, instant, false, animationSpeed);
	};

	/**
	 * Animates the carousel to given absolute position.
	 *
	 * One can set either a custom animation speed in pixels per millisecond or custom animation duration in
	 * milliseconds. If animation duration is set then animation speed is ignored.
	 *
	 * @method animateToPosition
	 * @param {number} position Requested position
	 * @param {boolean} [instant=false] Should the navigation be instantaneous and not use animation
	 * @param {boolean} [noDeferred=false] Does not create a deferred if set to true
	 * @param {number} [animationSpeed=2] Optional animation speed in pixels per millisecond
	 * @param {number} [animationDuration] Optional animation duration in milliseconds
	 * @return {Deferred.Promise}
	 */
	DefaultAnimator.prototype.animateToPosition = function(
		position,
		instant,
		noDeferred,
		animationSpeed,
		animationDuration
	) {
		var config = this._carousel.getConfig().defaultAnimator;

		instant = typeof instant === 'boolean' ? instant : false;
		noDeferred = typeof noDeferred === 'boolean' ? noDeferred : false;
		animationSpeed = typeof animationSpeed === 'number' ? animationSpeed : config.defaultAnimationSpeed;

		// limit the animation speed to configured range
		animationSpeed = Math.min(Math.max(animationSpeed, config.minAnimationSpeed), config.maxAnimationSpeed);

		/* istanbul ignore if */
		if (!this._transitionEndListenerCreated && instant !== true) {
			throw new Error('Requested non-instant animation before transition end listener was created');
		}

		var deferred = noDeferred ? null : new Deferred(),
			orientation = this._carousel.getOrientation(),
			$scrollerWrap = $(this._carousel.getScrollerWrap()),
			//animateTransformClass = this._carousel.getConfig().getClassName('animateTransform'),
			currentPosition,
			deltaPosition,
			translateCommand;

		// make sure the position is a full integer
		position = Math.floor(position);

		// resolve existing deferred if exists
		/* istanbul ignore if */
		if (this._activeDeferred !== null) {
			this._activeDeferred.resolve();
			this._activeDeferred = null;
		}

		// don't waste power on current position if not using deferred
		if (noDeferred !== true) {
			currentPosition = this.getCurrentPosition();
			deltaPosition = position - currentPosition;
		}

		// the translate command is different for horizontal and vertical carousels
		if (orientation === Config.Orientation.HORIZONTAL) {
			translateCommand = 'translate3d(' + position + 'px,0,0)';
		} else {
			translateCommand = 'translate3d(0,' + position + 'px,0)';
		}

		// add a class that enables transitioning transforms if instant is not required
		if (instant === true && this._isUsingAnimatedTransform) {
			//$scrollerWrap.removeClass(animateTransformClass);

			$scrollerWrap.css('transition-duration', '0ms');
			//$scrollerWrap[0].style.animationDuration = 0;
			//$scrollerWrap[0].classList.remove(animateTransformClass)

			this._isUsingAnimatedTransform = false;
		} else if (instant === false/* && !this._isUsingAnimatedTransform*/) {
			//$scrollerWrap.addClass(animateTransformClass);
			//$scrollerWrap[0].classList.add(animateTransformClass)

			//$scrollerWrap.css('transition-duration', '200ms');
			//$scrollerWrap[0].style.animationDuration = '200ms';

			// calculate animation duration from speed and delta position if not set manually
			if (typeof animationDuration !== 'number') {
				animationDuration = Math.abs(deltaPosition) / animationSpeed;
			}

			$scrollerWrap.css('transition-duration', animationDuration + 'ms');

			this._isUsingAnimatedTransform = true;
		}

		// for instant animations, set the transform at once, otherwise use animation frame
		if (instant) {
			$scrollerWrap.css('transform', translateCommand);
		} else {
			// apply the translate, use requestAnimationFrame for smoother results
			window.requestAnimationFrame(function () {
				$scrollerWrap.css('transform', translateCommand);
			});
		}

		//$scrollerWrap.css('transform', translateCommand);

		// remove the deferred overhead where not required
		if (noDeferred) {
			return;
		}

		// if the position is same as current then resolve immediately
		if (instant || (noDeferred !== true && position === currentPosition)) {
			deferred.resolve();
		} else {
			this._activeDeferred = new Deferred();

			this._activeDeferred.done(function() {
				this._activeDeferred = null;

				deferred.resolve();
			}.bind(this));
		}

		return deferred.promise();
	};

	/**
	 * Called by the carousel once it's structure has been initiated.
	 *
	 * @method onCarouselInitiated
	 */
	DefaultAnimator.prototype.onCarouselElementReady = function() {
		this._setupTransitionEndListener();
	};

	/**
	 * Starts listening for transition end event on the scroller wrap.
	 *
	 * @method _setupTransitionEndListener
	 * @private
	 */
	DefaultAnimator.prototype._setupTransitionEndListener = function() {
		var $scrollerWrap = $(this._carousel.getScrollerWrap());

		$scrollerWrap.on(
			'transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd',
			this._eventListeners.transitionEnd
		);

		this._transitionEndListenerCreated = true;
	};

	/**
	 * Called on transition end event.
	 *
	 * @method _onRawTransitionEnd
	 * @param {Event} e Raw event
	 * @private
	 */
	DefaultAnimator.prototype._onRawTransitionEnd = function(/*e*/) {
		// resolve the active deferred if exists
		this._resolveDeferred();
	};

	/**
	 * Resolves currently active deferred if available and sets it to null.
	 *
	 * @method _resolveDeferred
	 * @private
	 */
	DefaultAnimator.prototype._resolveDeferred = function() {
		if (this._activeDeferred === null) {
			return;
		}

		this._activeDeferred.resolve();
	};

	return DefaultAnimator;
});
define('ScrollAnimator',[
	'jquery',
	'AbstractAnimator',
	'Config',
	'Deferred'
], function($, AbstractAnimator, Config, Deferred) {
	

	// requestAnimationFrame polyfill
	(function () {
		var lastTime = 0,
			vendors = ['webkit', 'moz'],
			x;

		for (x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
			window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];

			window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
				|| window[vendors[x] + 'CancelRequestAnimationFrame'];
		}

		if (!window.requestAnimationFrame) {
			window.requestAnimationFrame = function(callback/*, element*/) {
				var currTime = new Date().getTime(),
					timeToCall = Math.max(0, 16 - (currTime - lastTime)),
					id = window.setTimeout(function () {
						callback(currTime + timeToCall);
					},
					timeToCall);

				lastTime = currTime + timeToCall;

				return id;
			};
		}

		if (!window.cancelAnimationFrame) {
			window.cancelAnimationFrame = function(id) {
				clearTimeout(id);
			};
		}
	}());

	/**
	 * Data source interface.
	 *
	 * @class ScrollAnimator
	 * @extends AbstractAnimator
	 * @constructor
	 * @param {FlowCarousel} carousel The carousel component
	 */
	function ScrollAnimator(carousel) {
		AbstractAnimator.call(this, carousel);

		this._animationSpeed = 200;
		this._carousel = carousel;
	}

	ScrollAnimator.prototype = Object.create(AbstractAnimator.prototype);

	/**
	 * Called by the carousel once it's structure has been initiated.
	 *
	 * @method onCarouselInitiated
	 */
	ScrollAnimator.prototype.onCarouselElementReady = function() {
		//add css class to indicate the type of this animator
		$(this._carousel.getMainWrap()).addClass(this._carousel.getConfig().cssPrefix + 'scroll-animator');
	};

	/**
	 * Returns current absolute position.
	 *
	 * @method getCurrentPosition
	 * @return {number}
	 */
	ScrollAnimator.prototype.getCurrentPosition = function() {
		var $scrollerWrap = $(this._carousel.getItemsWrap()),
			orientation = this._carousel.getOrientation();

		if (orientation === Config.Orientation.HORIZONTAL) {
			return $scrollerWrap.scrollLeft() * -1;
		} else {
			return $scrollerWrap.scrollTop() * -1;
		}
	};

	/**
	 * Animates the carousel to given item index position.
	 *
	 * @method animateToItem
	 * @param {number} itemIndex Index of the item
	 * @param {boolean} [instant=false] Should the navigation be instantaneous and not use animation
	 * @return {Deferred.Promise}
	 */
	ScrollAnimator.prototype.animateToItem = function(itemIndex, instant) {
		var position = this._carousel.getItemPositionByIndex(itemIndex);

		return this.animateToPosition(position, instant);
	};

	/**
	 * Animates the carousel to given absolute position.
	 *
	 * @method animateToPosition
	 * @param {number} position Requested position
	 * @param {boolean} [instant=false] Should the navigation be instantaneous and not use animation
	 * @param {boolean} [noDeferred=false] Does not create a deferred if set to true
	 * @return {Deferred.Promise}
	 */
	ScrollAnimator.prototype.animateToPosition = function(position, instant, noDeferred) {
		instant = typeof instant === 'boolean' ? instant : false;
		noDeferred = typeof noDeferred === 'boolean' ? noDeferred : false;

		var deferred = noDeferred ? null : new Deferred(),
			orientation = this._carousel.getOrientation();

		// make sure the position is a full integer
		position = Math.floor(position) * -1;

		// decide to use scrollLeft or scrollTop based on carousel orientation
		if (orientation === Config.Orientation.HORIZONTAL) {
			this._animateToLeftPosition(position, instant).done(function(){
				if (noDeferred !== true) {
					deferred.resolve();
				}
			});
		} else {
			this._animateToTopPosition(position, instant).done(function(){
				if (noDeferred !== true) {
					deferred.resolve();
				}
			});
		}

		if (noDeferred !== true) {
			return deferred.promise();
		}
	};

	/**
	 * Animates the carousel to given absolute position from left.
	 *
	 * @method _animateToLeftPosition
	 * @param {number} position Requested position
	 * @param {boolean} instant Should the navigation be instantaneous and not use animation
	 * @return {Deferred.Promise}
	 * @private
	 */
	ScrollAnimator.prototype._animateToLeftPosition = function(position, instant) {
		var $scrollerWrap = $(this._carousel.getItemsWrap()),
			deferred = new Deferred();

		if (instant === true) {
			// apply the scroll, use requestAnimationFrame for smoother results
			window.requestAnimationFrame(function () {
				//debugger
				$scrollerWrap.scrollLeft(position);
				deferred.resolve();
			});
		} else {
			//animate with jquery
			$scrollerWrap.animate({
				scrollLeft: position
			}, this._animationSpeed, function() {
				deferred.resolve();
			}.bind(this));
		}

		return deferred.promise();
	};

	/**
	 * Animates the carousel to given absolute position from top.
	 *
	 * @method _animateToTopPosition
	 * @param {number} position Requested position
	 * @param {boolean} instant Should the navigation be instantaneous and not use animation
	 * @return {Deferred.Promise}
	 * @private
	 */
	ScrollAnimator.prototype._animateToTopPosition = function(position, instant) {
		var $scrollerWrap = $(this._carousel.getItemsWrap()),
			deferred = new Deferred();

		if (instant === true) {
			// apply the scroll, use requestAnimationFrame for smoother results
			window.requestAnimationFrame(function () {
				$scrollerWrap.scrollTop(position);
				deferred.resolve();
			});
		} else {
			//animate with jquery
			$scrollerWrap.animate({
				scrollTop: position
			}, this._animationSpeed, function() {
				deferred.resolve();
			}.bind(this));
		}

		return deferred.promise();
	};

	return ScrollAnimator;
});
define('AbstractRenderer',[
	'jquery'
], function($) {
	

	/**
	 * Abstract renderer base class.
	 *
	 * @class AbstractRenderer
	 * @constructor
	 */
	function AbstractRenderer() {}

	/**
	 * Renders a carousel item.
	 *
	 * The data can be either a object of key-value pairs or an existing dom element to modify.
	 *
	 * Rendering an item can be asynchronous so a promise is returned.
	 *
	 * @method renderItem
	 * @param {Config} config Carousel configuration
	 * @param {number} index Item position index
	 * @param {object|DOMElement} data Item data object or existing dom element
	 * @return {Deferred.Promise}
	 */
	AbstractRenderer.prototype.renderItem = function(config, index, data) {
		void(config, index, data);

		throw new Error('Not implemented');
	};

	/**
	 * Renders a loading item placeholder.
	 *
	 * By default returns a simple div with the
	 * {{#crossLink "Config/cssClasses/placeholder:property"}}{{/crossLink}} class.
	 *
	 * You may override this in your custom renderer.
	 *
	 * @method renderPlaceholder
	 * @param {Config} config Carousel configuration
	 * @param {number} index Item position index
	 * @return {DOMElement}
	 */
	AbstractRenderer.prototype.renderPlaceholder = function(config, index) {
		void(index);

		return $('<div></div>')[0];
	};

	/**
	 * Destroys a carousel item.
	 *
	 * By default just removes the element using jQuery, but inheriting classes may choose to do something fancier.
	 *
	 * @method destroyItem
	 * @param {DOMElement} element DOM element to destroy
	 */
	AbstractRenderer.prototype.destroyItem = function(element) {
		$(element).remove();
	};

	/**
	 * Restores the initial contents of the carousel if possible.
	 *
	 * @method restoreInitialContents
	 * @param {AbstractDataSource} dataSource Data source to use
	 * @param {DOMElement} wrap Wrap to populate
	 */
	AbstractRenderer.prototype.restoreInitialContents = function(dataSource, wrap) {
		// don't do anything by default
		void(dataSource, wrap);
	};

	/**
	 * Called by the carousel on destroy.
	 *
	 * @method destroy
	 */
	AbstractRenderer.prototype.destroy = function() {
		// do nothing by default
	};

	return AbstractRenderer;
});
define('HtmlRenderer',[
	'AbstractRenderer',
	'Deferred'
], function(AbstractRenderer, Deferred) {
	

	/**
	 * The default renderer for already existing HTML elements.
	 *
	 * @class HtmlRenderer
	 * @extends AbstractRenderer
	 * @constructor
	 */
	function HtmlRenderer() {
		AbstractRenderer.call(this);
	}

	HtmlRenderer.prototype = Object.create(AbstractRenderer.prototype);

	/**
	 * Renders a carousel item.
	 *
	 * The data can be either a object of key-value pairs or an existing dom element to modify.
	 *
	 * Rendering an item can be asynchronous so a promise is returned.
	 *
	 * The data is an already existing DOMElement for HtmlRenderer.
	 *
	 * @method renderItem
	 * @param {Config} config Carousel configuration
	 * @param {number} index Item position index
	 * @param {object|DOMElement} element Item data object or existing dom element
	 * @return {Deferred.Promise}
	 */
	HtmlRenderer.prototype.renderItem = function(config, index, element) {
		var deferred = new Deferred();

		// html renderer is synchronous so resolve the promise immediately
		deferred.resolve(element);

		return deferred.promise();
	};

	/**
	 * Restores the initial contents of the carousel if possible.
	 *
	 * @method restoreInitialContents
	 * @param {AbstractDataSource} dataSource Data source to use
	 * @param {DOMElement} wrap Wrap to populate
	 */
	HtmlRenderer.prototype.restoreInitialContents = function(dataSource, wrap) {
		// fetch all items and append them to the wrap
		dataSource.getItems().done(function(items) {
			$(items).each(function(index, element) {
				var existingStyle = $(element).attr('style');

				// remove the added display: block
				if (typeof(existingStyle) === 'string') {
					$(element).attr('style', existingStyle.replace('display: block;', ''));
				}

				$(wrap).append(element);
			});
		});
	};

	return HtmlRenderer;
});
/*!
 * EventEmitter v4.2.7 - git.io/ee
 * Oliver Caldwell
 * MIT license
 * @preserve
 */

(function () {
	

	/**
	 * Class for managing events.
	 * Can be extended to provide event functionality in other classes.
	 *
	 * @class EventEmitter Manages event registering and emitting.
	 */
	function EventEmitter() {}

	// Shortcuts to improve speed and size
	var proto = EventEmitter.prototype;
	var exports = this;
	var originalGlobalValue = exports.EventEmitter;

	/**
	 * Finds the index of the listener for the event in it's storage array.
	 *
	 * @param {Function[]} listeners Array of listeners to search through.
	 * @param {Function} listener Method to look for.
	 * @return {Number} Index of the specified listener, -1 if not found
	 * @api private
	 */
	function indexOfListener(listeners, listener) {
		var i = listeners.length;
		while (i--) {
			if (listeners[i].listener === listener) {
				return i;
			}
		}

		return -1;
	}

	/**
	 * Alias a method while keeping the context correct, to allow for overwriting of target method.
	 *
	 * @param {String} name The name of the target method.
	 * @return {Function} The aliased method
	 * @api private
	 */
	function alias(name) {
		return function aliasClosure() {
			return this[name].apply(this, arguments);
		};
	}

	/**
	 * Returns the listener array for the specified event.
	 * Will initialise the event object and listener arrays if required.
	 * Will return an object if you use a regex search. The object contains keys for each matched event. So /ba[rz]/ might return an object containing bar and baz. But only if you have either defined them with defineEvent or added some listeners to them.
	 * Each property in the object response is an array of listener functions.
	 *
	 * @param {String|RegExp} evt Name of the event to return the listeners from.
	 * @return {Function[]|Object} All listener functions for the event.
	 */
	proto.getListeners = function getListeners(evt) {
		var events = this._getEvents();
		var response;
		var key;

		// Return a concatenated array of all matching events if
		// the selector is a regular expression.
		if (evt instanceof RegExp) {
			response = {};
			for (key in events) {
				if (events.hasOwnProperty(key) && evt.test(key)) {
					response[key] = events[key];
				}
			}
		}
		else {
			response = events[evt] || (events[evt] = []);
		}

		return response;
	};

	/**
	 * Takes a list of listener objects and flattens it into a list of listener functions.
	 *
	 * @param {Object[]} listeners Raw listener objects.
	 * @return {Function[]} Just the listener functions.
	 */
	proto.flattenListeners = function flattenListeners(listeners) {
		var flatListeners = [];
		var i;

		for (i = 0; i < listeners.length; i += 1) {
			flatListeners.push(listeners[i].listener);
		}

		return flatListeners;
	};

	/**
	 * Fetches the requested listeners via getListeners but will always return the results inside an object. This is mainly for internal use but others may find it useful.
	 *
	 * @param {String|RegExp} evt Name of the event to return the listeners from.
	 * @return {Object} All listener functions for an event in an object.
	 */
	proto.getListenersAsObject = function getListenersAsObject(evt) {
		var listeners = this.getListeners(evt);
		var response;

		if (listeners instanceof Array) {
			response = {};
			response[evt] = listeners;
		}

		return response || listeners;
	};

	/**
	 * Adds a listener function to the specified event.
	 * The listener will not be added if it is a duplicate.
	 * If the listener returns true then it will be removed after it is called.
	 * If you pass a regular expression as the event name then the listener will be added to all events that match it.
	 *
	 * @param {String|RegExp} evt Name of the event to attach the listener to.
	 * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.addListener = function addListener(evt, listener) {
		var listeners = this.getListenersAsObject(evt);
		var listenerIsWrapped = typeof listener === 'object';
		var key;

		for (key in listeners) {
			if (listeners.hasOwnProperty(key) && indexOfListener(listeners[key], listener) === -1) {
				listeners[key].push(listenerIsWrapped ? listener : {
					listener: listener,
					once: false
				});
			}
		}

		return this;
	};

	/**
	 * Alias of addListener
	 */
	proto.on = alias('addListener');

	/**
	 * Semi-alias of addListener. It will add a listener that will be
	 * automatically removed after it's first execution.
	 *
	 * @param {String|RegExp} evt Name of the event to attach the listener to.
	 * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.addOnceListener = function addOnceListener(evt, listener) {
		return this.addListener(evt, {
			listener: listener,
			once: true
		});
	};

	/**
	 * Alias of addOnceListener.
	 */
	proto.once = alias('addOnceListener');

	/**
	 * Defines an event name. This is required if you want to use a regex to add a listener to multiple events at once. If you don't do this then how do you expect it to know what event to add to? Should it just add to every possible match for a regex? No. That is scary and bad.
	 * You need to tell it what event names should be matched by a regex.
	 *
	 * @param {String} evt Name of the event to create.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.defineEvent = function defineEvent(evt) {
		this.getListeners(evt);
		return this;
	};

	/**
	 * Uses defineEvent to define multiple events.
	 *
	 * @param {String[]} evts An array of event names to define.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.defineEvents = function defineEvents(evts) {
		for (var i = 0; i < evts.length; i += 1) {
			this.defineEvent(evts[i]);
		}
		return this;
	};

	/**
	 * Removes a listener function from the specified event.
	 * When passed a regular expression as the event name, it will remove the listener from all events that match it.
	 *
	 * @param {String|RegExp} evt Name of the event to remove the listener from.
	 * @param {Function} listener Method to remove from the event.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.removeListener = function removeListener(evt, listener) {
		var listeners = this.getListenersAsObject(evt);
		var index;
		var key;

		for (key in listeners) {
			if (listeners.hasOwnProperty(key)) {
				index = indexOfListener(listeners[key], listener);

				if (index !== -1) {
					listeners[key].splice(index, 1);
				}
			}
		}

		return this;
	};

	/**
	 * Alias of removeListener
	 */
	proto.off = alias('removeListener');

	/**
	 * Adds listeners in bulk using the manipulateListeners method.
	 * If you pass an object as the second argument you can add to multiple events at once. The object should contain key value pairs of events and listeners or listener arrays. You can also pass it an event name and an array of listeners to be added.
	 * You can also pass it a regular expression to add the array of listeners to all events that match it.
	 * Yeah, this function does quite a bit. That's probably a bad thing.
	 *
	 * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add to multiple events at once.
	 * @param {Function[]} [listeners] An optional array of listener functions to add.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.addListeners = function addListeners(evt, listeners) {
		// Pass through to manipulateListeners
		return this.manipulateListeners(false, evt, listeners);
	};

	/**
	 * Removes listeners in bulk using the manipulateListeners method.
	 * If you pass an object as the second argument you can remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
	 * You can also pass it an event name and an array of listeners to be removed.
	 * You can also pass it a regular expression to remove the listeners from all events that match it.
	 *
	 * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to remove from multiple events at once.
	 * @param {Function[]} [listeners] An optional array of listener functions to remove.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.removeListeners = function removeListeners(evt, listeners) {
		// Pass through to manipulateListeners
		return this.manipulateListeners(true, evt, listeners);
	};

	/**
	 * Edits listeners in bulk. The addListeners and removeListeners methods both use this to do their job. You should really use those instead, this is a little lower level.
	 * The first argument will determine if the listeners are removed (true) or added (false).
	 * If you pass an object as the second argument you can add/remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
	 * You can also pass it an event name and an array of listeners to be added/removed.
	 * You can also pass it a regular expression to manipulate the listeners of all events that match it.
	 *
	 * @param {Boolean} remove True if you want to remove listeners, false if you want to add.
	 * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add/remove from multiple events at once.
	 * @param {Function[]} [listeners] An optional array of listener functions to add/remove.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.manipulateListeners = function manipulateListeners(remove, evt, listeners) {
		var i;
		var value;
		var single = remove ? this.removeListener : this.addListener;
		var multiple = remove ? this.removeListeners : this.addListeners;

		// If evt is an object then pass each of it's properties to this method
		if (typeof evt === 'object' && !(evt instanceof RegExp)) {
			for (i in evt) {
				if (evt.hasOwnProperty(i) && (value = evt[i])) {
					// Pass the single listener straight through to the singular method
					if (typeof value === 'function') {
						single.call(this, i, value);
					}
					else {
						// Otherwise pass back to the multiple function
						multiple.call(this, i, value);
					}
				}
			}
		}
		else {
			// So evt must be a string
			// And listeners must be an array of listeners
			// Loop over it and pass each one to the multiple method
			i = listeners.length;
			while (i--) {
				single.call(this, evt, listeners[i]);
			}
		}

		return this;
	};

	/**
	 * Removes all listeners from a specified event.
	 * If you do not specify an event then all listeners will be removed.
	 * That means every event will be emptied.
	 * You can also pass a regex to remove all events that match it.
	 *
	 * @param {String|RegExp} [evt] Optional name of the event to remove all listeners for. Will remove from every event if not passed.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.removeEvent = function removeEvent(evt) {
		var type = typeof evt;
		var events = this._getEvents();
		var key;

		// Remove different things depending on the state of evt
		if (type === 'string') {
			// Remove all listeners for the specified event
			delete events[evt];
		}
		else if (evt instanceof RegExp) {
			// Remove all events matching the regex.
			for (key in events) {
				if (events.hasOwnProperty(key) && evt.test(key)) {
					delete events[key];
				}
			}
		}
		else {
			// Remove all listeners in all events
			delete this._events;
		}

		return this;
	};

	/**
	 * Alias of removeEvent.
	 *
	 * Added to mirror the node API.
	 */
	proto.removeAllListeners = alias('removeEvent');

	/**
	 * Emits an event of your choice.
	 * When emitted, every listener attached to that event will be executed.
	 * If you pass the optional argument array then those arguments will be passed to every listener upon execution.
	 * Because it uses `apply`, your array of arguments will be passed as if you wrote them out separately.
	 * So they will not arrive within the array on the other side, they will be separate.
	 * You can also pass a regular expression to emit to all events that match it.
	 *
	 * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
	 * @param {Array} [args] Optional array of arguments to be passed to each listener.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.emitEvent = function emitEvent(evt, args) {
		var listeners = this.getListenersAsObject(evt);
		var listener;
		var i;
		var key;
		var response;

		for (key in listeners) {
			if (listeners.hasOwnProperty(key)) {
				i = listeners[key].length;

				while (i--) {
					// If the listener returns true then it shall be removed from the event
					// The function is executed either with a basic call or an apply if there is an args array
					listener = listeners[key][i];

					if (listener.once === true) {
						this.removeListener(evt, listener.listener);
					}

					response = listener.listener.apply(this, args || []);

					if (response === this._getOnceReturnValue()) {
						this.removeListener(evt, listener.listener);
					}
				}
			}
		}

		return this;
	};

	/**
	 * Alias of emitEvent
	 */
	proto.trigger = alias('emitEvent');

	/**
	 * Subtly different from emitEvent in that it will pass its arguments on to the listeners, as opposed to taking a single array of arguments to pass on.
	 * As with emitEvent, you can pass a regex in place of the event name to emit to all events that match it.
	 *
	 * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
	 * @param {...*} Optional additional arguments to be passed to each listener.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.emit = function emit(evt) {
		var args = Array.prototype.slice.call(arguments, 1);
		return this.emitEvent(evt, args);
	};

	/**
	 * Sets the current value to check against when executing listeners. If a
	 * listeners return value matches the one set here then it will be removed
	 * after execution. This value defaults to true.
	 *
	 * @param {*} value The new value to check for when executing listeners.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.setOnceReturnValue = function setOnceReturnValue(value) {
		this._onceReturnValue = value;
		return this;
	};

	/**
	 * Fetches the current value to check against when executing listeners. If
	 * the listeners return value matches this one then it should be removed
	 * automatically. It will return true by default.
	 *
	 * @return {*|Boolean} The current value to check for or the default, true.
	 * @api private
	 */
	proto._getOnceReturnValue = function _getOnceReturnValue() {
		if (this.hasOwnProperty('_onceReturnValue')) {
			return this._onceReturnValue;
		}
		else {
			return true;
		}
	};

	/**
	 * Fetches the events object and creates one if required.
	 *
	 * @return {Object} The events storage object.
	 * @api private
	 */
	proto._getEvents = function _getEvents() {
		return this._events || (this._events = {});
	};

	/**
	 * Reverts the global {@link EventEmitter} to its previous value and returns a reference to this version.
	 *
	 * @return {Function} Non conflicting EventEmitter class.
	 */
	EventEmitter.noConflict = function noConflict() {
		exports.EventEmitter = originalGlobalValue;
		return EventEmitter;
	};

	// Expose the class either via AMD, CommonJS or the global object
	if (typeof define === 'function' && define.amd) {
		define('EventEmitter',[],function () {
			return EventEmitter;
		});
	}
	else if (typeof module === 'object' && module.exports){
		module.exports = EventEmitter;
	}
	else {
		this.EventEmitter = EventEmitter;
	}
}.call(this));

define('Exporter',[
], function() {
	

	/**
	 * Returns a function that accepts the carousel component as parameter and registers it to various systems
	 * such as RequireJS AMD and AngularJS module if possible.
	 */
	return {
		export: function (FlowCarousel) {
			// support require.js style AMD
			if (typeof window.define === 'function' && window.define.amd) {
				window.define('FlowCarousel', [], function () {
					return FlowCarousel;
				});
			}

			// register AngularJS module
			/*if (typeof window.angular === 'object') {
				window.angular.module('FlowCarousel', [])
					.factory('flowCarousel', function() {
						return FlowCarousel;
					});
			}*/

			// register under window
			window.FlowCarousel = FlowCarousel;
		}
	};
});
define('FlowCarousel',[
	'jquery',
	'Config',
	'AbstractDataSource',
	'ArrayDataSource',
	'HtmlDataSource',
	'AbstractAnimator',
	'DefaultAnimator',
	'ScrollAnimator',
	'AbstractRenderer',
	'HtmlRenderer',
	'AbstractNavigator',
	'Deferred',
	'Util',
	'EventEmitter',
	'Exporter'
], function(
	$,
	Config,
	AbstractDataSource,
	ArrayDataSource,
	HtmlDataSource,
	AbstractAnimator,
	DefaultAnimator,
	ScrollAnimator,
	AbstractRenderer,
	HtmlRenderer,
	AbstractNavigator,
	Deferred,
	Util,
	EventEmitter,
	Exporter
) {
	

	/**
	 * FlowCarousel main class.
	 *
	 * Responsive paginated high-performance HTML5 carousel with AngularJS support.
	 *
	 * https://github.com/kallaspriit/flow-carousel
	 *
	 * @class FlowCarousel
	 * @extends EventEmitter
	 * @constructor
	 * @author Priit Kallas <priit@stagnationlab.com>
	 * @copyright Stagnation Lab
	 * @licence MIT
	 */
	function FlowCarousel() {
		/**
		 * Component version number.
		 *
		 * @property version
		 * @type string
		 */
		this.version = '0.1.0';

		/**
		 * The index of nth carousel was created (0 for first, 1 for next etc..).
		 *
		 * @property _id
		 * @type {number}
		 * @private
		 */
		this._id = FlowCarousel.instanceCount;

		/**
		 * Set to true once the component is initiated and to false once it's destroyed.
		 *
		 * @property _initiated
		 * @type {boolean}
		 * @default false
		 * @private
		 */
		this._initiated = false;

		/**
		 * Set to true once the component is destroyed, no methods are valid to call after this.
		 *
		 * @property _destroyed
		 * @type {boolean}
		 * @default false
		 * @private
		 */
		this._destroyed = false;

		/**
		 * Carousel configuration.
		 *
		 * @property _config
		 * @type Config
		 * @default Config
		 * @private
		 */
		this._config = new Config();

		/**
		 * Data source to use.
		 *
		 * Data source is only set when the carousel is initiated with data or it's set with
		 * {{#crossLink "FlowCarousel/setDataSource"}}{{/crossLink}}.
		 *
		 * @property _dataSource
		 * @type {AbstractDataSource}
		 * @default null
		 * @private
		 */
		this._dataSource = null;

		/**
		 * Renderer used to render the data.
		 *
		 * @property _renderer
		 * @type {AbstractRenderer}
		 * @default null
		 * @private
		 */
		this._renderer = null;

		/**
		 * Animator to use.
		 *
		 * @property _animator
		 * @type {AbstractAnimator}
		 * @default null
		 * @private
		 */
		this._animator = null;

		/**
		 * Map of navigators used to navigate the component.
		 *
		 * Use the config to set built-in navigators to use or add a custom one using
		 * {{#crossLink "FlowCarousel/addNavigator"}}{{/crossLink}}.
		 *
		 * @type {AbstractNavigator[]}
		 * @private
		 * @default {}
		 */
		this._navigators = {};

		/**
		 * The top wrap elements jQuery object.
		 *
		 * @property _mainWrap
		 * @type {DOMElement}
		 * @default null
		 * @private
		 */
		this._mainWrap = null;

		/**
		 * Wrap for the items that contains the {{#crossLink "FlowCarousel/_scrollerWrap:property"}}{{/crossLink}}
		 * which in turn contains the actual item wrappers and items.
		 *
		 * @property _itemsWrap
		 * @type {DOMElement}
		 * @default null
		 * @private
		 */
		this._itemsWrap = null;

		/**
		 * This is the wrap that's animated on navigation and contains the carousel element wraps.
		 *
		 * @property _scrollerWrap
		 * @type {DOMElement}
		 * @default null
		 * @private
		 */
		this._scrollerWrap = null;

		/**
		 * Is the carousel currently animating.
		 *
		 * @property _isAnimating
		 * @type {boolean}
		 * @default false
		 * @private
		 */
		this._isAnimating = false;

		/**
		 * Is the carousel currently being dragged.
		 *
		 * @property _isDragged
		 * @type {boolean}
		 * @default false
		 * @private
		 */
		this._isDragged = false;

		/**
		 * Target item position index.
		 *
		 * This is set when animating to an index is requested.
		 *
		 * @property _targetItemIndex
		 * @type {number}
		 * @default 0
		 * @private
		 */
		this._targetItemIndex = 0;

		/**
		 * Current item position index.
		 *
		 * This is updated once the animation completes.
		 *
		 * @property _currentItemIndex
		 * @type {number}
		 * @default 0
		 * @private
		 */
		this._currentItemIndex = 0;

		/**
		 * Item index of the last centered item.
		 *
		 * @property _lastCenterItemIndex
		 * @type {number|null}
		 * @default null
		 * @private
		 */
		this._lastCenterItemIndex = null;

		/**
		 * Index of currently-hovered item or null if not hovering any items.
		 *
		 * @property _hoverItemIndex
		 * @type {number|null}
		 * @default null
		 * @private
		 */
		this._hoverItemIndex = null;

		/**
		 * List of item indexes that have been rendered.
		 *
		 * @property _renderedItemIndexes
		 * @type {array}
		 * @private
		 */
		this._renderedItemIndexes = [];

		/**
		 * List of placeholder indexes that have been rendered.
		 *
		 * TODO consider getting rid of this index list
		 *
		 * @property _renderedPlaceholderIndexes
		 * @type {array}
		 * @private
		 */
		this._renderedPlaceholderIndexes = [];

		/**
		 * Mapping of renderer item indexes to their dom elements.
		 *
		 * @property _itemIndexToElementMap
		 * @type {object}
		 * @default {}
		 * @private
		 */
		this._itemIndexToElementMap = {};

		/**
		 * Map of delayed tasks used by {{#crossLink "FlowCarousel/_performDelayed"}}{{/crossLink}}.
		 *
		 * @property _delayedTasks
		 * @type {object}
		 * @private
		 */
		this._delayedTasks = {};

		/**
		 * The deferred promise to the currently loading itemset.
		 *
		 * @property _getItemsPromise
		 * @type {Deferred.Promise|null}
		 * @private
		 */
		this._getItemsPromise = null;

		/**
		 * The deferred promise to the current animation.
		 *
		 * Set to null if no animation is playing.
		 *
		 * @property _activeAnimationDeferred
		 * @type {Deferred.Promise|null}
		 * @private
		 */
		this._activeAnimationDeferred = null;

		/**
		 * Has the {{#crossLink "FlowCarousel/Event/STARTUP_ITEMS_RENDERED:property"}}{{/crossLink}} event bee emitted.
		 *
		 * @property _startupItemsRenderedEmitted
		 * @type {boolean}
		 * @default false
		 * @private
		 */
		this._startupItemsRenderedEmitted = false;

		/**
		 * The last obesrved largest child size.
		 *
		 * @property _lastLargestChildSize
		 * @type {number|null}
		 * @default null
		 * @private
		 */
		this._lastLargestChildSize = null;

		/**
		 * Various cached sizes and values that do not need to be always calculated.
		 *
		 * @property _cache
		 * @type {object}
		 * @param {number|null} wrapSize The cached main wrap size
		 * @param {number|null} wrapOppositeSize The cached main wrap opposite size
		 * @private
		 */
		this._cache = {
			wrapSize: null,
			wrapOppositeSize: null
		};

		/**
		 * List of event listeners bound to the FlowCarousel instance.
		 *
		 * @property _eventListeners
		 * @type {object}
		 * @private
		 */
		this._eventListeners = {
			onWindowResize: this._onWindowResize.bind(this)
		};

		/**
		 * Empty clone of the cache used for resetting it.
		 *
		 * @property _emptyCache
		 * @type {object}
		 * @private
		 */
		this._emptyCache = Util.cloneObj(this._cache);

		/**
		 * Should caches be used when possible.
		 *
		 * @property _useCache
		 * @type {boolean}
		 * @default true
		 * @private
		 */
		this._useCache = true;

		/**
		 * Reference to the Event list.
		 *
		 * Useful for when you have an instance of the carousel but no reference to the class.
		 *
		 * @property Event
		 * @type FlowCarousel.Event
		 */
		this.Event = FlowCarousel.Event;

		/**
		 * Reference to the Config class.
		 *
		 * Useful for when you have an instance of the carousel but no reference to the class.
		 *
		 * @property Config
		 * @type FlowCarousel.Config
		 */
		this.Config = FlowCarousel.Config;

		// increment the instance count
		FlowCarousel.instanceCount++;
	}

	FlowCarousel.prototype = Object.create(EventEmitter.prototype);

	/**
	 * Number of instances that have been created in total.
	 *
	 * @property instanceCount
	 * @type {number}
	 * @default 0
	 * @static
	 */
	FlowCarousel.instanceCount = 0;

	/**
	 * Number of instances that are currently live meaning they have been initialized but not destroyed.
	 *
	 * @property liveCount
	 * @type {number}
	 * @default 0
	 * @static
	 */
	FlowCarousel.liveCount = 0;

	// The main FlowCarousel classes are referenced under the main FlowCarousel class so that only the main
	// class is registered in the global namespace.

	/**
	 * Reference to the {{#crossLink "Config"}}{{/crossLink}} class.
	 *
	 * Useful to access the enumerations in the configuration class.
	 *
	 * @property Config
	 * @type {Config}
	 */
	FlowCarousel.Config = Config;

	/**
	 * Reference to the {{#crossLink "AbstractDataSource"}}{{/crossLink}} class.
	 *
	 * @property AbstractDataSource
	 * @type {Config}
	 */
	FlowCarousel.AbstractDataSource = AbstractDataSource;

	/**
	 * Reference to the {{#crossLink "ArrayDataSource"}}{{/crossLink}} class.
	 *
	 * @property ArrayDataSource
	 * @type {Config}
	 */
	FlowCarousel.ArrayDataSource = ArrayDataSource;

	/**
	 * Reference to the {{#crossLink "HtmlDataSource"}}{{/crossLink}} class.
	 *
	 * @property HtmlDataSource
	 * @type {Config}
	 */
	FlowCarousel.HtmlDataSource = HtmlDataSource;

	/**
	 * Reference to the {{#crossLink "AbstractRenderer"}}{{/crossLink}} class.
	 *
	 * @property AbstractRenderer
	 * @type {Config}
	 */
	FlowCarousel.AbstractRenderer = AbstractRenderer;

	/**
	 * Reference to the {{#crossLink "HtmlRenderer"}}{{/crossLink}} class.
	 *
	 * @property HtmlRenderer
	 * @type {Config}
	 */
	FlowCarousel.HtmlRenderer = HtmlRenderer;

	/**
	 * Reference to the {{#crossLink "AbstractAnimator"}}{{/crossLink}} class.
	 *
	 * @property AbstractAnimator
	 * @type {Config}
	 */
	FlowCarousel.AbstractAnimator = AbstractAnimator;

	/**
	 * Reference to the {{#crossLink "DefaultAnimator"}}{{/crossLink}} class.
	 *
	 * @property DefaultAnimator
	 * @type {Config}
	 */
	FlowCarousel.DefaultAnimator = DefaultAnimator;

	/**
	 * Reference to the {{#crossLink "ScrollAnimator"}}{{/crossLink}} class.
	 *
	 * @property ScrollAnimator
	 * @type {Config}
	 */
	FlowCarousel.ScrollAnimator = ScrollAnimator;

	/**
	 * Reference to the {{#crossLink "AbstractNavigator"}}{{/crossLink}} class.
	 *
	 * @property AbstractNavigator
	 * @type {Config}
	 */
	FlowCarousel.AbstractNavigator = AbstractNavigator;

	/**
	 * Reference to the {{#crossLink "Deferred"}}{{/crossLink}} class.
	 *
	 * @property Deferred
	 * @type {Config}
	 */
	FlowCarousel.Deferred = Deferred;

	/**
	 * Possible size modes used by {{#crossLink "FlowCarousel/_getWrapSize"}}{{/crossLink}}.
	 *
	 * @property SizeMode
	 * @type {object}
	 * @param {string} SizeMode.INNER='inner' Inner size
	 * @param {string} SizeMode.OUTER='outer' Outer size
	 * @private
	 * @static
	 */
	FlowCarousel.SizeMode = {
		INNER: 'inner',
		OUTER: 'outer'
	};

	/**
	 * List of possible events emitted by the carousel.
	 *
	 * The event system uses the Wolfy87 EventEmitter implementation https://github.com/Wolfy87/EventEmitter.
	 *
	 * You can subscribe to events using carousel.addListener(carousel.Event.INITIATED, function() { ... }); etc
	 *
	 * The [startIndex, endIndex] syntax shows the parameters passed to the callback.
	 *
	 * @property Event
	 * @param {string} Event.INITIATING='initiating' Emitted when starting initiation
	 * @param {string} Event.INITIATED='initiated' Emitted after completing initiation
	 * @param {string} Event.STARTUP_ITEMS_RENDERED='startup-items-rendered' Emitted after rendering the first data
	 * @param {string} Event.LOADING_ITEMS='loading-items' [startIndex, endIndex, items] Emitted when starting to load a
	 * 				   new set of items
	 * @param {string} Event.LOADED_ITEMS='loaded-items' [startIndex, endIndex, items] Emitted when a new set of items
	 * 				   was loaded
	 * @param {string} Event.ABORTED_ITEMS='aborted-items' [startIndex, endIndex] Emitted when loading a range of items
	 * 				   was aborted
	 * @param {string} Event.RENDERED_ITEMS='rendered-items' [startIndex, endIndex, elements] Emitted when a new set of
	 * 				   items was rendered
	 * @param {string} Event.DESTROYED_ITEMS='destroyed-items' [itemIndexes] Emitted when a set of items was destroyed
	 * @param {string} Event.NAVIGATING_TO_ITEM='navigating-to-item' [itemIndex, instant] Emitted when starting to
	 * 				   navigate to a carousel item index
	 * @param {string} Event.NAVIGATED_TO_ITEM='navigated-to-item' [itemIndex, instant] Emitted when finished
	 * 				   navigate to a carousel item index including animation
	 * @param {string} Event.NAVIGATING_TO_PAGE='navigating-to-page' [pageIndex, instant] Emitted when starting to
	 * 				   navigate to a carousel item index
	 * @param {string} Event.NAVIGATED_TO_PAGE='navigated-to-page' [pageIndex, instant] Emitted when finished
	 * 				   navigate to a carousel item index including animation
	 * @param {string} Event.LAYOUT_CHANGED='layout-changed' Emitted when the layout is re-calculated
	 * @param {string} Event.DRAG_BEGIN='drag-begin' [startPosition, dragOppositePosition, carouselPosition] Emitted
	 * 				   when the drag navigator begins to drag the scroller
	 * @param {string} Event.DRAG_END='drag-end' [navigationMode, startPosition, endPosition, deltaDragPosition,
	 * 				   closestIndex, direction, targetElement] Emitted when dragging stopped
	 * @type {object}
	 */
	FlowCarousel.Event = {
		INITIATING: 'initiating',
		INITIATED: 'initiated',
		STARTUP_ITEMS_RENDERED: 'startup-items-rendered',

		LOADING_ITEMS: 'loading-items',
		LOADED_ITEMS: 'loaded-items',

		ABORTED_ITEMS: 'aborted-items',

		RENDERED_ITEMS: 'rendered-items',
		DESTROYED_ITEMS: 'destroyed-items',

		NAVIGATING_TO_ITEM: 'navigating-to-item',
		NAVIGATED_TO_ITEM: 'navigated-to-item',

		NAVIGATING_TO_PAGE: 'navigating-to-page',
		NAVIGATED_TO_PAGE: 'navigated-to-page',

		LAYOUT_CHANGED: 'layout-changed',

		DRAG_BEGIN: 'drag-begin',
		DRAG_END: 'drag-end',
	};

	/**
	 * Initializes the carousel component.
	 *
	 * Returns a promise that will be resolved once the carousel has been initiated.
	 *
	 * Emits:
	 * - FlowCarousel.Event.INITIATING at the start of the procedure
	 * - FlowCarousel.Event.INITIATED after initiation but the initial data may not have loaded yet
	 * - FlowCarousel.Event.STARTUP_ITEMS_RENDERED after the initial set of data has rendered
	 *
	 * @method init
	 * @param {string|jQuery|DOMElement} element Element selector or jQuery reference or a dom element
	 * @param {object} [userConfig] Optional user configuration object overriding defaults in the
	 * 								{{#crossLink "Config"}}{{/crossLink}}.
	 * @return {Deferred.Promise}
	 */
	FlowCarousel.prototype.init = function(element, userConfig) {
		var deferred = new Deferred();

		if (this._initiated) {
			throw new Error('The carousel is already initiated');
		}

		this.emit(FlowCarousel.Event.INITIATING);

		// extend the config with user-provided values if available
		if (Util.isObject(userConfig)) {
			this._config.extend(userConfig);
		}

		// initialize the wrap element that match given selector
		this._setupElement(element);

		// use provided data source or a simple array if provided, use HtmlDataSource if nothing is provided
		if (this._config.dataSource instanceof AbstractDataSource || Util.isArray(this._config.dataSource)) {
			this.setDataSource(this._config.dataSource);
		} else if (typeof this._config.dataSource !== 'undefined' && this._config.dataSource !== null) {
			throw new Error('Unexpected data source type "' + typeof this._config.dataSource + '" provided');
		} else {
			// the data-source could have been set before init
			if (this._dataSource === null) {
				this._dataSource = new HtmlDataSource(this._mainWrap);
			}
		}

		// use custom renderer if provided or the HtmlRenderer if not
		if (this._config.renderer !== null) {
			if (this._config.renderer instanceof AbstractRenderer) {
				this._renderer = this._config.renderer;
			} else {
				throw new Error('Custom renderer provided in config but it\'s not an instance of AbstractRenderer');
			}
		} else {
			if (this._dataSource instanceof HtmlDataSource) {
				this._renderer = new HtmlRenderer();
			} else if (this._renderer === null) {
				throw new Error(
					'Expecting a custom "renderer" to be defined in the config if not using the HtmlDataSource'
				);
			}
		}

		// use custom animator if provided or the DefaultAnimator if not
		if (this._config.animator !== null) {
			if (this._config.animator instanceof AbstractAnimator) {
				this._animator = this._config.animator;
			} else {
				throw new Error('Custom animator provided in config but it\'s not an instance of AbstractAnimator');
			}
		} else {
			// the animator could have been set before init
			if (this._animator === null) {
				this._animator = new DefaultAnimator(this);
			}
		}

		// setup the carousel rendering and events
		this._setupCarousel(this._mainWrap, this._config.orientation);

		// setup the default navigators
		this._setupDefaultNavigators();

		// notify the animator that carousel is initiated
		this._initiated = true;

		// increment the livecount
		FlowCarousel.liveCount++;

		this.emit(FlowCarousel.Event.INITIATED);

		this._validateItemsToRender().done(function() {
			this.validateSize();

			deferred.resolve();
		}.bind(this));

		// listen for wrap size changes and perform re-layout when needed once the carousel is initiated
		deferred.done(function() {
			this._setupWindowResizeListener();
		}.bind(this));

		return deferred.promise();
	};

	/**
	 * Destroys the carousel component.
	 *
	 * @method destroy
	 */
	FlowCarousel.prototype.destroy = function() {
		var preservedMethodNames = ['isInitiated', 'isDestroyed'],
			navigatorName,
			propertyName;

		if (!this._initiated) {
			throw new Error('Unable to destroy carousel that has not been initiated');
		}

		// destroy the sub-components
		if (this._dataSource instanceof AbstractDataSource) { this._dataSource.destroy(); }
		if (this._renderer instanceof AbstractRenderer) { this._renderer.destroy(); }
		if (this._animator instanceof AbstractAnimator) { this._animator.destroy(); }

		// destroy navigators
		for (navigatorName in this._navigators) {
			if (this._navigators[navigatorName] instanceof AbstractNavigator) {
				this._navigators[navigatorName].destroy();
			}
		}

		// remove the carousel classes from the main wrap
		Util.removeElementClassesPrefixedWith(this._mainWrap, this._config.cssPrefix);

		// clear the generated contents
		$(this._mainWrap).empty();

		// ask the renderer to restore the initial contents using the current data-source
		this._renderer.restoreInitialContents(this._dataSource, this._mainWrap);

		// remove the data reference
		$(this._mainWrap).data(this._config.dataTarget, null);

		// remove the window resize listener
		$(window).off('resize', this._eventListeners.onWindowResize);

		// clear references and state
		this._config = null;
		this._dataSource = null;
		this._renderer = null;
		this._animator = null;
		this._navigators = {};
		this._mainWrap = null;
		this._itemsWrap = null;
		this._scrollerWrap = null;
		this._isAnimating = false;
		this._targetItemIndex = 0;
		this._currentItemIndex = 0;
		this._hoverItemIndex = null;
		this._renderedItemIndexes = [];
		this._renderedPlaceholderIndexes = [];
		this._itemIndexToElementMap = {};
		this._delayedTasks = {};
		this._getItemsPromise = null;
		this._activeAnimationDeferred = null;
		this._startupItemsRenderedEmitted = false;
		this._lastLargestChildSize = null;
		this._cache = Util.cloneObj(this._emptyCache);
		this._useCache = true;

		// disable all methods
		for (propertyName in this) {
			// preserve some methods
			if (preservedMethodNames.indexOf(propertyName) !== -1) {
				continue;
			}

			if (typeof this[propertyName] === 'function') {
				this[propertyName] = function() {
					throw new Error(
						'The carousel is destroyed, attempting to call any of its methods results in an error (' +
						'tried to call "' + this.name + '")'
					);
				}.bind({name: propertyName});
			}
		}

		// mark the component destroyed
		this._initiated = false;
		this._destroyed = true;

		// decrement the livecount
		FlowCarousel.liveCount--;
	};

	/**
	 * Returns the unique id and carousel index.
	 *
	 * @method getId
	 * @return {number}
	 */
	FlowCarousel.prototype.getId = function() {
		return this._id;
	};

	/**
	 * Returns whether the carousel has been initiated.
	 *
	 * @method isInitiated
	 * @return {boolean}
	 */
	FlowCarousel.prototype.isInitiated = function() {
		return this._initiated;
	};

	/**
	 * Returns whether the carousel has been destroyed.
	 *
	 * @method isDestroyed
	 * @return {boolean}
	 */
	FlowCarousel.prototype.isDestroyed = function() {
		return this._destroyed;
	};

	/**
	 * Returns whether the carousel is currently animating.
	 *
	 * @method isAnimating
	 * @return {boolean}
	 */
	FlowCarousel.prototype.isAnimating = function() {
		return this._isAnimating;
	};

	/**
	 * Returns whether the carousel is currently animating.
	 *
	 * @method isAnimating
	 * @return {boolean}
	 */
	FlowCarousel.prototype.isDragged = function() {
		return this._isDragged;
	};

	/**
	 * Returns current configuration.
	 *
	 * @method getConfig
	 * @return {Config}
	 */
	FlowCarousel.prototype.getConfig = function() {
		return this._config;
	};

	/**
	 * Returns current animator instance.
	 *
	 * @method getAnimator
	 * @return {Config}
	 */
	FlowCarousel.prototype.getAnimator = function() {
		return this._animator;
	};

	/**
	 * Returns the main carousel wrap dom element.
	 *
	 * @method getMainWrap
	 * @return {DOMElement}
	 */
	FlowCarousel.prototype.getMainWrap = function() {
		return this._mainWrap;
	};

	/**
	 * Returns the items wrap containing the scroller wrap.
	 *
	 * @method getItemsWrap
	 * @return {DOMElement}
	 */
	FlowCarousel.prototype.getItemsWrap = function() {
		return this._itemsWrap;
	};

	/**
	 * Returns the scroller wrap containing the item wraps.
	 *
	 * @method getScrollerWrap
	 * @return {DOMElement}
	 */
	FlowCarousel.prototype.getScrollerWrap = function() {
		return this._scrollerWrap;
	};

	/**
	 * Returns the orientation of the carousel.
	 *
	 * @method getOrientation
	 * @return {Config/Orientation:property}
	 */
	FlowCarousel.prototype.getOrientation = function() {
		return this._config.orientation;
	};

	/**
	 * Returns the size of a single item given current wrap size.
	 *
	 * @method getItemSize
	 * @return {number}
	 */
	FlowCarousel.prototype.getItemSize = function() {
		var wrapSize = this._getMainWrapSize(),
			itemsPerPage = this._config.getItemsPerPage(wrapSize);

		return this._calculateItemSize(wrapSize, itemsPerPage);
	};

	/**
	 * Returns the size of a single page of items.
	 *
	 * @method getPageSize
	 * @return {number}
	 */
	FlowCarousel.prototype.getPageSize = function() {
		var wrapSize = this._getMainWrapSize(),
			itemsPerPage = this._config.getItemsPerPage(wrapSize),
			itemSize = this._calculateItemSize(wrapSize, itemsPerPage);

		return itemsPerPage * itemSize;
	};

	/**
	 * Returns the size of the entire scroller that would fit all the elements.
	 *
	 * @method getTotalSize
	 * @return {number}
	 */
	FlowCarousel.prototype.getTotalSize = function() {
		var wrapSize = this._getMainWrapSize(),
			itemCount = this._dataSource.getItemCount(),
			itemsPerPage = this._config.getItemsPerPage(wrapSize),
			itemSize = this._calculateItemSize(wrapSize, itemsPerPage);

		return itemCount * itemSize;
	};

	/**
	 * Returns the number of items in the dataset.
	 *
	 * @method getItemCount
	 * @return {number}
	 */
	FlowCarousel.prototype.getItemCount = function() {
		return this._dataSource.getItemCount();
	};

	/**
	 * Returns the number of items on the last page.
	 *
	 * @method getItemCountOnLastPage
	 * @return {number}
	 */
	FlowCarousel.prototype.getItemCountOnLastPage = function() {
		var itemCount = this.getItemCount(),
			itemsPerPage = this.getItemsPerPage(),
			pageCount = this.getPageCount();

		return itemCount - (pageCount - 1) * itemsPerPage;
	};

	/**
	 * Returns the number of pages the dataset contains given current wrap size.
	 *
	 * @method getPageCount
	 * @return {number}
	 */
	FlowCarousel.prototype.getPageCount = function() {
		return Math.ceil(this._dataSource.getItemCount() / this.getItemsPerPage());
	};

	/**
	 * Returns the number of items displayed on a single page.
	 *
	 * Calculating the number of items per page causes a layout which is bad for performance so cached value is used
	 * when possible.
	 *
	 * @method getItemsPerPage
	 * @return {number}
	 */
	FlowCarousel.prototype.getItemsPerPage = function() {
		var wrapSize = this._getMainWrapSize(),
			itemsPerPage = this._config.getItemsPerPage(wrapSize);

		this._cache.itemsPerPage = itemsPerPage;

		return itemsPerPage;
	};

	/**
	 * Returns the target item position index.
	 *
	 * This can be different from the return value of getCurrentItemIndex() if the carousel is animating.
	 *
	 * @method getTargetItemIndex
	 * @return {number}
	 */
	FlowCarousel.prototype.getTargetItemIndex = function() {
		return this._targetItemIndex;
	};

	/**
	 * Returns the current item position index.
	 *
	 * This can be different from the return value of getTargetItemIndex() if the carousel is animating.
	 *
	 * @method getCurrentItemIndex
	 * @return {number}
	 */
	FlowCarousel.prototype.getCurrentItemIndex = function() {
		return this._currentItemIndex;
	};

	/**
	 * Returns the currently-hovered item index or null if none is hovered.
	 *
	 * @method getHoverItemIndex
	 * @return {number|null}
	 */
	FlowCarousel.prototype.getHoverItemIndex = function() {
		return this._hoverItemIndex;
	};

	/**
	 * Returns currently visible page number.
	 *
	 * Always returns an integer flooring to the closest round page number.
	 *
	 * The page number starts at zero for first page.
	 *
	 * @method getCurrentPageIndex
	 * @return {number}
	 */
	FlowCarousel.prototype.getCurrentPageIndex = function() {
		return this.getItemPageIndex(this._currentItemIndex);
	};

	/**
	 * Returns given item index page index.
	 *
	 * Always returns an integer flooring to the closest round page number.
	 *
	 * The page number starts at zero for first page.
	 *
	 * @method getItemPageIndex
	 * @param {number} itemIndex Item index to calculate for
	 * @return {number}
	 */
	FlowCarousel.prototype.getItemPageIndex = function(itemIndex) {
		var itemsPerPage = this.getItemsPerPage();

		return Math.floor(itemIndex / itemsPerPage);
	};

	/**
	 * Returns current item absolute position.
	 *
	 * @method getCurrentPosition
	 * @return {number}
	 */
	FlowCarousel.prototype.getCurrentItemPosition = function() {
		return this._animator.getCurrentPosition();
	};

	/**
	 * Returns item position at given index.
	 *
	 * @method getItemPositionByIndex
	 * @param {number} itemIndex Item index
	 * @return {number}
	 */
	FlowCarousel.prototype.getItemPositionByIndex = function(itemIndex) {
		var itemSize = this.getItemSize(),
			itemsPerPage = this.getItemsPerPage(),
			itemMargin = this._config.margin,
			gapPerItem = (itemMargin * (itemsPerPage - 1) / itemsPerPage);

		return -Math.floor(itemIndex * itemSize + itemIndex * (itemMargin - gapPerItem));
	};

	/**
	 * Returns the closest full item index at given position taking into account the direction of movement.
	 *
	 * @method getClosestItemIndexAtPosition
	 * @param {number} position Scroller position
	 * @param {number} [direction=1] Move direction (-1/1)
	 * @return {number} Closest item index
	 */
	FlowCarousel.prototype.getClosestItemIndexAtPosition = function(position, direction) {
		direction = direction || 1;

		var itemSize = this.getItemSize(),
			itemCount = this.getItemCount(),
			itemsPerPage = this.getItemsPerPage(),
			itemMargin = this._config.margin,
			gapPerItem = (itemMargin * (itemsPerPage - 1) / itemsPerPage),
			itemIndex = -position / (itemSize + (itemMargin - gapPerItem)),
			result;

		if (direction < 0) {
			result = Math.ceil(itemIndex);
		} else {
			result = Math.floor(itemIndex);
		}

		// limit the range
		return Math.min(Math.max(result, 0), itemCount - itemsPerPage);
	};

	/**
	 * Returns the closest full page index at given position taking into account the direction of movement.
	 *
	 * @method getClosestPageIndexAtPosition
	 * @param {number} position Scroller position
	 * @param {number} [direction=1] Move direction (-1/1)
	 * @return {number} Closest page index
	 */
	FlowCarousel.prototype.getClosestPageIndexAtPosition = function(position, direction) {
		direction = direction || 1;

		var closestItemIndex = this.getClosestItemIndexAtPosition(position, direction),
			itemsPerPage = this.getItemsPerPage(),
			pageCount = this.getPageCount(),
			pageIndex = closestItemIndex / itemsPerPage,
			result;

		if (direction < 0) {
			result = Math.ceil(pageIndex);
		} else {
			result = Math.floor(pageIndex);
		}

		// limit the range
		return Math.min(Math.max(result, 0), pageCount - 1);
	};

	/**
	 * Returns the range of items that should be rendered for current item index and config.
	 *
	 * @method getRenderRange
	 * @param {number} [itemIndex=this._currentItemIndex] Optional item index to use, defaults to current
	 * @return {object} Render range with start and end keys
	 * @private
	 */
	FlowCarousel.prototype.getRenderRange = function(itemIndex) {
		itemIndex = itemIndex || this._currentItemIndex;

		var itemsPerPage = this.getItemsPerPage(),
			itemCount = this._dataSource.getItemCount();

		return this._config.getRenderRange(itemIndex, itemsPerPage, itemCount);
	};

	/**
	 * Returns the range of items that have already been rendered for current item index and config.
	 *
	 * @method getRenderedRange
	 * @return {object|null} Render range with start and end keys or null if no elements have been renderer
	 * @private
	 */
	FlowCarousel.prototype.getRenderedRange = function() {
		var range = {
				start: null,
				end: null
			},
			itemIndex,
			i;

		for (i = 0; i < this._renderedItemIndexes.length; i++) {
			itemIndex = this._renderedItemIndexes[i];

			itemIndex = parseInt(itemIndex, 10);

			if (range.start === null || itemIndex < range.start) {
				range.start = itemIndex;
			}

			if (range.end === null || itemIndex > range.end) {
				range.end = itemIndex;
			}
		}

		if (range.start === null || range.end === null) {
			return null;
		}

		return range;
	};

	/**
	 * Returns the current item position index.
	 *
	 * This can be different from the return value of getTargetItemIndex() if the carousel is animating.
	 *
	 * @method isAnimating
	 * @return {boolean}
	 */
	FlowCarousel.prototype.isAnimating = function() {
		return this._isAnimating;
	};

	/**
	 * Sets the data source to use.
	 *
	 * Expects either an instance of AbstractDataSource (you can roll your own) or a simple array that will be
	 * converted to an ArrayDataSource.
	 *
	 * This can optionally be set in the init method as second argument.
	 *
	 * This method supports call chaining by returning itself.
	 *
	 * @method setDataSource
	 * @param {AbstractDataSource|array} Either an instance of AbstractDataSource or a simple array
	 * @chainable
	 * @return {FlowCarousel}
	 */
	FlowCarousel.prototype.setDataSource = function(data) {
		if (data instanceof AbstractDataSource) {
			this._dataSource = data;
		} else if (Util.isArray(data)) {
			this._dataSource = new ArrayDataSource(data);
		} else {
			throw new Error(
				'Invalid data of type "' + typeof data + '" provided, expected an instance of AbstractDataSource or ' +
				'a simple array'
			);
		}

		return this;
	};

	/**
	 * Sets the renderer to use.
	 *
	 * Expects an instance of AbstractRenderer.
	 *
	 * This method supports call chaining by returning itself.
	 *
	 * @method setRenderer
	 * @param {AbstractDataSource|array} Either an instance of AbstractDataSource or a simple array
	 * @chainable
	 * @return {FlowCarousel}
	 */
	FlowCarousel.prototype.setRenderer = function(renderer) {
		if (renderer instanceof AbstractRenderer) {
			this._renderer = renderer;
		} else {
			throw new Error('Invalid renderer provided, expected an instance of AbstractRenderer');
		}

		return this;
	};

	/**
	 * Adds a new navigator to use.
	 *
	 * @method addNavigator
	 * @param {string} type Type of the navigator, should be unique
	 * @param {AbstractNavigator} instance Navigator instance
	 */
	FlowCarousel.prototype.addNavigator = function(type, instance) {
		if (typeof this._navigators[type] !== 'undefined') {
			throw new Error('Navigator of type "' + type + '" already added');
		}

		if (!(instance instanceof AbstractNavigator)) {
			throw new Error('The navigator is expected to be an instance of AbstractNavigator');
		}

		this._navigators[type] = instance;

		// initiate the navigator
		this._navigators[type].init(this);
	};

	/**
	 * Returns navigator instance by type.
	 *
	 * @method getNavigatorByType
	 * @param {string} type Type of the navigator, should be unique
	 * @return {AbstractNavigator|null} Navigator instance or null if not found
	 */
	FlowCarousel.prototype.getNavigatorByType = function(type) {
		if (typeof this._navigators[type] === 'undefined') {
			return null;
		}

		return this._navigators[type];
	};

	/**
	 * Returns the data used for rendering the component.
	 *
	 * Returns null if the component has not yet been initialized.
	 *
	 * @method getDataSource
	 * @return {AbstractDataSource|null} Used data source or null if not available yet
	 */
	FlowCarousel.prototype.getDataSource = function() {
		return this._dataSource;
	};

	/**
	 * Navigates to a carousel item by index.
	 *
	 * Throws error if out of bounds index is requested.
	 *
	 * Returns deferred promise that will be resolved once the animation completes.
	 *
	 * Emits:
	 * - FlowCarousel.Event.NAVIGATING_TO_ITEM [itemIndex, instant] before animation
	 * - FlowCarousel.Event.NAVIGATED_TO_ITEM [itemIndex, instant] after animation
	 *
	 * @method navigateToItem
	 * @param {number} itemIndex Item index to navigate to
	 * @param {boolean} [instant=false] Should the navigation be instantaneous and not use animation
	 * @param {boolean} [force=false] Force the animation even if we think we're already at given item index
	 * @param {number} [animationSpeed] Optional animation speed in pixels per millisecond
	 * @return {Deferred.Promise} Deferred promise that will be resolved once the animation completes
	 */
	FlowCarousel.prototype.navigateToItem = function(itemIndex, instant, force, animationSpeed) {
		instant = typeof instant === 'boolean' ? instant : false;
		force = typeof force === 'boolean' ? force : false;

		var deferred = new Deferred(),
			itemCount = this._dataSource.getItemCount(),
			isSameItemIndex = itemIndex === this._currentItemIndex,
			itemsPerPage = this.getItemsPerPage(),
			currentItemIndex = this.getCurrentItemIndex(),
			pageLastItemIndex = Math.min(currentItemIndex + 1, itemCount - itemsPerPage);

		// if there are no items then resolve immediately and give up
		if (itemCount === 0) {
			deferred.resolve();

			return deferred.promise();
		}

		// validate index range
		if (itemIndex < 0) {
			throw new Error('Invalid negative  index "' + itemIndex + '" requested');
		} else if (itemIndex > itemCount - 1) {
			throw new Error('Too large index "' + itemIndex + '" requested, there are only ' + itemCount + ' items');
		}

		// TODO investigate allowing navigation while the previous animation is ongoing
		/*if (this._activeAnimationDeferred !== null) {
			this._activeAnimationDeferred.resolve();

			return this.navigateToItem(itemIndex,instant, force);
		}*/

		// ignore navigation request when already navigating
		if (this._isAnimating) {
			if (this._activeAnimationDeferred === null) {
				/* istanbul ignore if */
				throw new Error(
					'Carousel is animating but no active animation deferred is present, this should not happen'
				);
			}

			return this._activeAnimationDeferred;
		}

		// animate to the new item position index if it's different from current item index
		if (!isSameItemIndex || force === true) {
			this._isAnimating = true;
			this._targetItemIndex = itemIndex;

			// start animating to given item, this is an asynchronous process
			this._animator.animateToItem(itemIndex, instant, animationSpeed).done(function() {
				deferred.resolve();
			});

			// emitting this event before starting the animation causes lag for some reason
			this.emit(FlowCarousel.Event.NAVIGATING_TO_ITEM, itemIndex, instant);
		} else {
			// already at target page index, visualize limit
			if (itemIndex === 0 || (this.isLastPage() && itemIndex === pageLastItemIndex)) {
				this._showLimit(itemIndex).done(function() {
					deferred.resolve();
				});

				this._activeAnimationDeferred = deferred;
			} else {
				deferred.resolve();
			}

			return deferred.promise();
		}

		// render placeholders that are later replaced with real loaded items
		if (this._config.usePlaceholders && this._dataSource.isAsynchronous()) {
			this._renderTargetIndexPlaceholders();
		}

		// once the animation is complete, update the current item index
		deferred.done(function() {
			this._currentItemIndex = this._targetItemIndex;
			this._lastCenterItemIndex = this.getCurrentCenterItemIndex();
			this._isAnimating = false;
			this._activeAnimationDeferred = null;

			// remove items that have moved out of range
			this._destroyInvalidItems();

			// check whether we need to render or remove some items
			this._validateItemsToRender().done(function() {
				// update scroller size to largest visible child
				this.validateSize();
			}.bind(this));

			this.emit(FlowCarousel.Event.NAVIGATED_TO_ITEM, itemIndex, instant);
		}.bind(this));

		// store the promise so it can be returned when requesting a new animation while the last still playing
		this._activeAnimationDeferred = deferred;

		return deferred.promise();
	};

	/**
	 * Navigates to given page number.
	 *
	 * Notice that page numbers start from zero.
	 *
	 * Throws error if out of bounds index is requested.
	 *
	 * Returns deferred promise that will be resolved once the animation completes.
	 *
	 * Emits:
	 * - FlowCarousel.Event.NAVIGATING_TO_PAGE at the start of the procedure
	 * - FlowCarousel.Event.NAVIGATED_TO_PAGE after the animation to requested page
	 *
	 * @method navigateToPage
	 * @param {number} pageIndex Page index to navigate to
	 * @param {boolean} [instant=false] Should the navigation be instantaneous and not use animation
	 * @param {boolean} [force=false] Force the animation even if we think we're already at given item index
	 * @return {Deferred.Promise} Deferred promise that will be resolved once the animation completes
	 * @param {number} [animationSpeed] Optional animation speed in pixels per millisecond
	 */
	FlowCarousel.prototype.navigateToPage = function(pageIndex, instant, force, animationSpeed) {
		instant = typeof instant === 'boolean' ? instant : false;

		var currentPageIndex = this.getCurrentPageIndex(),
			itemIndex = pageIndex * this.getItemsPerPage(),
			// TODO this needs change in getCurrentPageIndex as well
			//itemIndex = Math.min(pageIndex * this.getItemsPerPage(), this.getMaximumValidItemIndex()),
			pageCount = this.getPageCount(),
			deferred = new Deferred();

		// already at target page index, visualize limit
		if (pageIndex === currentPageIndex && force !== true) {
			if (
				(pageIndex === 0 || pageIndex === pageCount - 1)
				&& this.getPageCount() > 1
			) {
				this._showLimit(itemIndex).done(function() {
					deferred.resolve();
				});

				this._activeAnimationDeferred = deferred;
			} else {
				deferred.resolve();
			}

			return deferred.promise();
		}

		this.emit(FlowCarousel.Event.NAVIGATING_TO_PAGE, pageIndex, instant);

		this.navigateToItem(itemIndex, instant, force, animationSpeed).done(function() {
			deferred.resolve();
		});

		deferred.done(function() {
			this.emit(FlowCarousel.Event.NAVIGATED_TO_PAGE, pageIndex, instant);
		}.bind(this));

		return deferred.promise();
	};

	/**
	 * Navigates to next carousel item.
	 *
	 * Returns deferred promise that will be resolved once the animation completes.
	 *
	 * Emits:
	 * - FlowCarousel.Event.NAVIGATING_TO_ITEM [itemIndex, instant] before animation
	 * - FlowCarousel.Event.NAVIGATED_TO_ITEM [itemIndex, instant] after animation
	 *
	 * @method navigateToNextItem
	 * @param {boolean} [instant=false] Should the navigation be instantaneous and not use animation
	 * @return {Deferred.Promise} Deferred promise that will be resolved once the animation completes
	 */
	FlowCarousel.prototype.navigateToNextItem = function(instant) {
		var currentItemIndex = this.getCurrentItemIndex(),
			maximumValidItemIndex = this.getMaximumValidItemIndex(),
			targetItemIndex = Math.min(currentItemIndex + 1, maximumValidItemIndex);

		return this.navigateToItem(targetItemIndex, instant);
	};

	/**
	 * Returns the maximum item index to scroll to so that the last page would be displayed full.
	 *
	 * @method getMaximumValidItemIndex
	 * @return {number}
	 */
	FlowCarousel.prototype.getMaximumValidItemIndex = function() {
		var itemsPerPage = this.getItemsPerPage(),
			itemCount = this.getItemCount();

		return Math.max(itemCount - itemsPerPage, 0);
	};

	/**
	 * Navigates to previous carousel item.
	 *
	 * Returns deferred promise that will be resolved once the animation completes.
	 *
	 * Emits:
	 * - FlowCarousel.Event.NAVIGATING_TO_ITEM [itemIndex, instant] before animation
	 * - FlowCarousel.Event.NAVIGATED_TO_ITEM [itemIndex, instant] after animation
	 *
	 * @method navigateToPreviousItem
	 * @param {boolean} [instant=false] Should the navigation be instantaneous and not use animation
	 * @return {Deferred.Promise} Deferred promise that will be resolved once the animation completes
	 */
	FlowCarousel.prototype.navigateToPreviousItem = function(instant) {
		var currentItemIndex = this.getCurrentItemIndex(),
			targetItemIndex = Math.max(currentItemIndex - 1, 0);

		return this.navigateToItem(targetItemIndex, instant);
	};

	/**
	 * Returns whether given (or current if no argument is given) item is the first one.
	 *
	 * @method isFirstItem
	 * @param {number} [itemIndex=getCurrentItemIndex()] Optional item index, current by default
	 * @return {boolean}
	 */
	FlowCarousel.prototype.isFirstItem = function(itemIndex) {
		itemIndex = typeof itemIndex === 'number' ? itemIndex : this.getCurrentPageIndex();

		return itemIndex === 0;
	};

	/**
	 * Returns whether given (or current if no argument is given) item is the last one.
	 *
	 * @method isLastItem
	 * @param {number} [itemIndex=getCurrentItemIndex()] Optional item index, current by default
	 * @return {boolean}
	 */
	FlowCarousel.prototype.isLastItem = function(itemIndex) {
		itemIndex = typeof itemIndex === 'number' ? itemIndex : this.getCurrentItemIndex();

		return this.getItemCount() === 0 || itemIndex >= this.getMaximumValidItemIndex();
	};

	/**
	 * Returns whether given (or current if no argument is given) page is the first one.
	 *
	 * @method isFirstPage
	 * @param {number} [pageIndex=getCurrentPageIndex()] Optional page index, current by default
	 * @return {boolean}
	 */
	FlowCarousel.prototype.isFirstPage = function(pageIndex) {
		pageIndex = typeof pageIndex === 'number' ? pageIndex : this.getCurrentPageIndex();

		return pageIndex === 0;
	};

	/**
	 * Returns whether given (or current if no argument is given) page is the last one.
	 *
	 * @method isLastPage
	 * @param {number} [pageIndex=getCurrentPageIndex()] Optional page index, current by default
	 * @return {boolean}
	 */
	FlowCarousel.prototype.isLastPage = function(pageIndex) {
		pageIndex = typeof pageIndex === 'number' ? pageIndex : this.getCurrentPageIndex();

		return this.getPageCount() === 0 || pageIndex === this.getPageCount() - 1;
	};

	/**
	 * Navigates to next page if available.
	 *
	 * Returns deferred promise that will be resolved once the animation completes.
	 *
	 * Emits:
	 * - FlowCarousel.Event.NAVIGATING_TO_PAGE at the start of the procedure
	 * - FlowCarousel.Event.NAVIGATED_TO_PAGE after the animation to requested page
	 *
	 * @method navigateToNextPage
	 * @param {boolean} [instant=false] Should the navigation be instantaneous and not use animation
	 * @return {Deferred.Promise} Deferred promise that will be resolved once the animation completes
	 */
	FlowCarousel.prototype.navigateToNextPage = function(instant) {
		var currentPageIndex = this.getCurrentPageIndex(),
			pageCount = this.getPageCount(),
			targetPageIndex = Math.min(currentPageIndex + 1, pageCount - 1);

		return this.navigateToPage(targetPageIndex, instant);
	};

	/**
	 * Navigates to previous page if available.
	 *
	 * Returns deferred promise that will be resolved once the animation completes.
	 *
	 * Emits:
	 * - FlowCarousel.Event.NAVIGATING_TO_PAGE at the start of the procedure
	 * - FlowCarousel.Event.NAVIGATED_TO_PAGE after the animation to requested page
	 *
	 * @method navigateToPreviousPage
	 * @param {boolean} [instant=false] Should the navigation be instantaneous and not use animation
	 * @return {Deferred.Promise} Deferred promise that will be resolved once the animation completes
	 */
	FlowCarousel.prototype.navigateToPreviousPage = function(instant) {
		var currentPageIndex = this.getCurrentPageIndex(),
			targetPageIndex = Math.max(currentPageIndex - 1, 0);

		return this.navigateToPage(targetPageIndex, instant);
	};

	/**
	 * Returns the range of currently visible carousel item wrappers.
	 *
	 * @method getCurrentPageVisibleRange
	 * @return {object}
	 * @return {number} return.start Visible range start index
	 * @return {number} return.end Visible range end index
	 */
	FlowCarousel.prototype.getCurrentPageVisibleRange = function() {
		var itemsPerPage = this.getItemsPerPage(),
			itemCount = this.getItemCount();

		return {
			start: this._currentItemIndex,
			end: Math.max(Math.min(this._currentItemIndex + itemsPerPage - 1, itemCount - 1), 0)
		};
	};

	/**
	 * Returns the list of currently visible carousel item wrappers.
	 *
	 * @method getCurrentPageVisibleItemElements
	 * @return {DOMElement[]}
	 */
	FlowCarousel.prototype.getCurrentPageVisibleItemElements = function() {
		var itemCount = this.getItemCount(),
			visibleRange = this.getCurrentPageVisibleRange(),
			elements = [],
			element,
			i;

		// return empty array if there are no items
		if (itemCount === 0) {
			return [];
		}

		for (i = visibleRange.start; i <= visibleRange.end; i++) {
			element = this.getItemElementByIndex(i);

			/* istanbul ignore if */
			if (element === null) {
				throw new Error('Requested item element at index #' + i + ' not found, this should not happen');
			}

			elements.push(element);
		}

		return elements;
	};

	/**
	 * Returns the item dom element by item index.
	 *
	 * Throws error if invalid index is requested.
	 *
	 * @method getItemElementByIndex
	 * @param {number} itemIndex Item index to fetch element of
	 * @return {DOMElement|null} Item dom element or null if not found
	 * @private
	 */
	FlowCarousel.prototype.getItemElementByIndex = function(itemIndex) {
		var itemCount = this.getItemCount();

		// nothing to search for
		if (itemCount === 0) {
			return null;
		}

		// validate index range
		if (itemIndex < 0) {
			throw new Error('Invalid negative  index "' + itemIndex + '" requested');
		} else if (itemIndex > itemCount - 1) {
			throw new Error('Too large index "' + itemIndex + '" requested, there are only ' + itemCount + ' items');
		}

		if (typeof this._itemIndexToElementMap[itemIndex] === 'undefined') {
			return null;
		}

		return this._itemIndexToElementMap[itemIndex];
	};

	/**
	 * Validates the dataset and redraws the carousel.
	 *
	 * You can call this when the data has changes in the background and the carousel should redraw itself.
	 *
	 * Returns promise that is resolved when the new items has been drawn.
	 *
	 * @method redraw
	 * @return {Deferred.Promise}
	 */
	FlowCarousel.prototype.redraw = function() {
		return this._reLayout();
	};

	/**
	 * Calculates the item index to scroll to so that the given index would be centered if possible.
	 *
	 * @method calculateCenteredItemStartIndex
	 * @param {number} startItemIndex Item index to center
	 * @param {boolean} [inverse=false] Should the inverse positive index be returned
	 */
	FlowCarousel.prototype.calculateCenteredItemStartIndex = function(startItemIndex, inverse) {
		inverse = typeof inverse === 'boolean' ? inverse : false;

		var maximumValidItemIndex = this.getMaximumValidItemIndex(),
			itemPerPage = this.getItemsPerPage(),
			isEvenNumberOfPages = itemPerPage % 2 === 0,
			sign = inverse ? 1 : -1,
			roundMethod = inverse ? 'floor' : 'ceil',
			centeredItemIndex = Math[roundMethod](startItemIndex + sign * itemPerPage / 2);

		// prefer before the center rather than after
		if (isEvenNumberOfPages) {
			centeredItemIndex -= 1;
		}

		// limit the calculated item index to valid range
		return Math.max(Math.min(centeredItemIndex, maximumValidItemIndex), 0);
	};

	/**
	 * Returns currently centered item index.
	 *
	 * @method getCurrentCenterItemIndex
	 * @return {number}
	 */
	FlowCarousel.prototype.getCurrentCenterItemIndex = function() {
		return this.calculateCenteredItemStartIndex(this._currentItemIndex, true);
	};

	/**
	 * Initializes the top-level wrap element.
	 *
	 * If the selector matches multiple elements, only the first one is considered.
	 *
	 * If the selector does not match any elements, an error is thrown.
	 *
	 * @method _setupElement
	 * @param {string|jQuery|DOMElement} source Wraps element or selector
	 * @private
	 */
	FlowCarousel.prototype._setupElement = function(source) {
		var matches = $(source),
			element,
			existingCarousel;

		// make sure that the selector matches only a single element and throw error otherwise
		if (matches.length === 0) {
			throw new Error('Selector "' + element + '" did not match any elements');
		} else if (matches.length > 1) {
			throw new Error(
				'Selector "' + element + '" matches more then one element, try using "' + element + ':first"'
			);
		}

		element = matches[0];
		existingCarousel = $(element).data(this._config.dataTarget);

		// make sure the same element is not initiated several times
		if (existingCarousel instanceof FlowCarousel) {
			throw new Error(
				'Element matching selector "' + element + '" is already a carousel component, ' +
				'destroy the existing one first'
			);
		}

		// store reference to the main wrap dom element
		this._mainWrap = element;

		// register the carousel instance on the main wrap dom element data
		$(this._mainWrap).data(this._config.dataTarget, this);
	};

	/**
	 * Initializes a single wrap element.
	 *
	 * @method _setupCarousel
	 * @param {DOMelement} wrap The carousel wrap to setup
	 * @param {Config/Orientation:property} orientation Orientation to use
	 * @private
	 */
	FlowCarousel.prototype._setupCarousel = function(wrap, orientation) {
		var $element = $(wrap),
			className = {
				wrap: this._config.getClassName('wrap'),
				items: this._config.getClassName('items'),
				item: this._config.getClassName('item'),
				scroller: this._config.getClassName('scroller'),
				matchWrap: this._config.getClassName('matchWrap'),
				matchLargestItem: this._config.getClassName('matchLargestItem'),
				initiating: this._config.getClassName('initiating'),
				horizontal: this._config.getClassName('horizontal'),
				vertical: this._config.getClassName('vertical')
			},
			sizeMode = this._config.sizeMode,
			startItemIndex = 0,
			$itemsWrap,
			$scrollerWrap;

		// remove any existing content (HtmlDataSource should have done that already anyway
		$element.empty();

		// create the items and the scroller wraps
		$itemsWrap = $('<div></div>', {
			'class': className.items
		});

		$scrollerWrap = $('<div></div>', {
			'class': className.scroller
		});

		// add size mode class to the main wrap element
		if (sizeMode === Config.SizeMode.MATCH_WRAP) {
			$(this._mainWrap).addClass(className.matchWrap);
		} else if (sizeMode === Config.SizeMode.MATCH_LARGEST_ITEM) {
			$(this._mainWrap).addClass(className.matchLargestItem);
		} else {
			throw new Error('Invalid size mode "' + sizeMode + '" defined');
		}

		// add the items and scroller wraps
		$itemsWrap.append($scrollerWrap);
		$element.append($itemsWrap);

		// store references to the items and scroller wrap dom elements
		this._itemsWrap = $itemsWrap[0];
		this._scrollerWrap = $scrollerWrap[0];

		// add main carousel class to the wrap element
		$element.addClass(className.wrap);
		$element.addClass(className.initiating);

		// add class to wrap based on orientation
		if (orientation === Config.Orientation.HORIZONTAL) {
			$element.addClass(className.horizontal);
		} else if (orientation === Config.Orientation.VERTICAL) {
			$element.addClass(className.vertical);
		} else {
			throw new Error('Unexpected orientation "' + orientation + '" provided');
		}

		if (this._config.startItemIndex !== null) {
			startItemIndex = this._config.startItemIndex;
		} else if (this._config.startPageIndex !== null) {
			startItemIndex = this._config.startPageIndex * this.getItemsPerPage();
		}

		// notify the animator that carousel element is ready
		this._animator.onCarouselElementReady();

		// setup the main layout and move/animate to the start item
		this._setupLayout(startItemIndex, this._config.animateToStartIndex, this._config.centerStartItemIndex);

		// remove the loading class
		$element.removeClass(className.initiating);

		// throw error if both item and page start indexes are set
		if (this._config.startItemIndex !== null && this._config.startPageIndex !== null) {
			throw new Error('Set either the startItemIndex or startPageIndex option but not both');
		}
	};

	/**
	 * Sets up the layout and renders the initial set of items.
	 *
	 * Emits:
	 * - FlowCarousel.Event.LAYOUT_CHANGED when the layout changes
	 *
	 * @method _setupLayout
	 * @param {number} [startItemIdex] Optional item index to navigate to instantly
	 * @param {boolean} [animateToStartItem=false] Should we animate to the start item
	 * @param {boolean} [centerStartItemIndex=false] Should we try to center on the start item
	 * @private
	 */
	FlowCarousel.prototype._setupLayout = function(startItemIndex, animateToStartItem, centerStartItemIndex) {
		var orientation = this._config.orientation,
			wrapSize = this._getMainWrapSize(),
			itemCount = this._dataSource.getItemCount(),
			itemsPerPage = this._config.getItemsPerPage(wrapSize),
			itemSize = this._calculateItemSize(wrapSize, itemsPerPage),
			totalSize = Math.ceil(itemCount * itemSize),
			instantAnimation = animateToStartItem !== true,
			sizeProp = orientation === Config.Orientation.HORIZONTAL
				? 'width'
				: 'height';

		// the wrap size can become zero when hidden, stop the layout process
		/* istanbul ignore if */
		if (wrapSize === 0) {
			return;
		}

		// define the scroller wrap size to fit all items
		$(this._scrollerWrap).css(sizeProp, totalSize);

		// if the start item index is set then navigate to it instantly
		if (typeof startItemIndex === 'number' && startItemIndex !== 0) {
			// recalculate the start item index so the initial item is shown centered
			if (centerStartItemIndex) {
				startItemIndex = this.calculateCenteredItemStartIndex(startItemIndex);
			}

			this._targetItemIndex = startItemIndex;
			this._currentItemIndex = startItemIndex;
			this._lastCenterItemIndex = this.getCurrentCenterItemIndex();

			this.emit(FlowCarousel.Event.NAVIGATING_TO_ITEM, startItemIndex, instantAnimation);

			this._animator.animateToItem(startItemIndex, instantAnimation, true).done(function() {
				this.emit(FlowCarousel.Event.NAVIGATED_TO_ITEM, startItemIndex, instantAnimation);
			}.bind(this));
		}

		// render placeholders that are later replaced with real loaded items
		if (this._config.usePlaceholders && this._dataSource.isAsynchronous()) {
			this._renderTargetIndexPlaceholders();
		}

		this.emit(FlowCarousel.Event.LAYOUT_CHANGED);
	};

	/**
	 * Sets up the default navigators to use as defined in the {{#crossLink "Config"}}{{/crossLink}}.
	 *
	 * @method _setupDefaultNavigators
	 * @private
	 */
	FlowCarousel.prototype._setupDefaultNavigators = function() {
		var type;

		for (type in this._config.navigators) {
			if (typeof this._config.navigators[type].createInstance !== 'function') {
				throw new Error(
					'Expected the navigator definition to include "createInstance" method that returns a deferred ' +
					'promise that is resolved with a new instance of the given navigator'
				);
			}

			// skip disabled navigators
			if (!this._config.navigators[type].enabled) {
				continue;
			}

			// create navigator instance asyncronously and add it
			Deferred.when(this._config.navigators[type].createInstance(this)).done(function(navigator) {
				// the carousel may have gotten destroyed while the navigator was loading
				if (this.carousel === null || this.carousel.isDestroyed()) {
					return;
				}

				this.carousel.addNavigator(this.type, navigator);
			}.bind({carousel: this, type: type}));
		}
	};

	/**
	 * Validates whether all the required items have been rendered and initiates rendering them if not.
	 *
	 * @method _validateItemsToRender
	 * @return {Deferred.Promise}
	 * @private
	 */
	FlowCarousel.prototype._validateItemsToRender = function() {
		var renderRange = this.getRenderRange();

		return this._renderItemRange(renderRange.start, renderRange.end);
	};

	/**
	 * Removes items that have gone out of the render range.
	 *
	 * @method _destroyInvalidItems
	 * @private
	 */
	FlowCarousel.prototype._destroyInvalidItems = function() {
		var renderRange = this.getRenderRange(),
			filteredPlaceholderItemIndexes = [],
			filteredRenderedItemIndexes = [],
			destroyedItemIndexes = [],
			itemIndex,
			itemElement,
			i;

		// destroy rendered placeholders out of the render range
		// TODO the placeholders and real items destroying should be merged
		for (i = 0; i < this._renderedPlaceholderIndexes.length; i++) {
			itemIndex = this._renderedPlaceholderIndexes[i];

			if (itemIndex < renderRange.start || itemIndex > renderRange.end) {
				itemElement = this.getItemElementByIndex(itemIndex);

				/* istanbul ignore if */
				if (itemElement === null) {
					throw new Error(
						'Placeholder element at index #' + itemIndex + ' not found, this should not happen'
					);
				}

				this._destroyItem(itemElement, itemIndex);

				destroyedItemIndexes.push(itemIndex);
			} else {
				filteredPlaceholderItemIndexes.push(itemIndex);
			}
		}

		this._renderedPlaceholderIndexes = filteredPlaceholderItemIndexes;

		// destroy rendered items out of the render range
		if (this._shouldDestroyInvalidItems()) {
			for (i = 0; i < this._renderedItemIndexes.length; i++) {
				itemIndex = this._renderedItemIndexes[i];

				if (itemIndex < renderRange.start || itemIndex > renderRange.end) {
					itemElement = this.getItemElementByIndex(itemIndex);

					/* istanbul ignore if */
					if (itemElement === null) {
						throw new Error('Item element at index #' + itemIndex + ' not found, this should not happen');
					}

					this._destroyItem(itemElement, itemIndex);

					destroyedItemIndexes.push(itemIndex);
				} else {
					filteredRenderedItemIndexes.push(itemIndex);
				}
			}

			this._renderedItemIndexes = filteredRenderedItemIndexes;
		}

		if (destroyedItemIndexes.length > 0) {
			this.emit(FlowCarousel.Event.DESTROYED_ITEMS, destroyedItemIndexes);
		}
	};

	/**
	 * Destroys an element and removes it from the index to element mapping.
	 *
	 * @method _destroyItem
	 * @param {DOMElement} element Element to destroy
	 * @param {number} index Element index
	 * @private
	 */
	FlowCarousel.prototype._destroyItem = function(element, index) {
		this._renderer.destroyItem(element);

		this._removeItemIndexToElement(index);
	};

	/**
	 * Renders the item placeholders for current target index.
	 *
	 * @method _renderTargetIndexPlaceholders
	 * @private
	 */
	FlowCarousel.prototype._renderTargetIndexPlaceholders = function() {
		var targetItemIndex = this._targetItemIndex,
			renderRange = this.getRenderRange(targetItemIndex);

		// render placeholders that are later replaced with real loaded items
		// TODO this is not needed for syncronous data source
		this._renderItemPlaceholders(renderRange.start, renderRange.end);
	};

	/**
	 * Renders the item placeholders that will later be replaced with the actual items.
	 *
	 * Gives the user some "loading" feedback.
	 *
	 * @method _renderItemPlaceholders
	 * @param {number} startIndex The starting index
	 * @param {number} endIndex The end item index
	 * @private
	 */
	FlowCarousel.prototype._renderItemPlaceholders = function(startIndex, endIndex) {
		var elements = [],
			element,
			itemIndex;

		for (itemIndex = startIndex; itemIndex <= endIndex; itemIndex++) {
			// don't render a placeholder onto already existing rendered item
			/* istanbul ignore if */
			if (this._renderedItemIndexes.indexOf(itemIndex) !== -1) {
				elements.push(null);
			} else {
				// request the placeholder element from the renderer
				element = this._renderer.renderPlaceholder(this._config, itemIndex);

				elements.push(element);
			}
		}

		this._insertRenderedElements(elements, startIndex, true);
	};

	/**
	 * Renders a range of carousel items.
	 *
	 * Emits:
	 * - FlowCarousel.Event.LOADING_ITEMS [startIndex, endIndex] before starting to load a range of items
	 * - FlowCarousel.Event.ABORTED_ITEMS [startIndex, endIndex] if loading or a range of items was aborted
	 * - FlowCarousel.Event.LOADED_ITEMS [startIndex, endIndex, items] after loading and rendering a range of items
	 * - FlowCarousel.Event.STARTUP_ITEMS_RENDERED if the rendered range of items was the first
	 *
	 * @method _renderItemRange
	 * @param {number} startIndex Range start index
	 * @param {number} endIndex Range end index
	 * @return {Deferred.Promise}
	 * @private
	 */
	FlowCarousel.prototype._renderItemRange = function(startIndex, endIndex) {
		var self = this,
			deferred = new Deferred(),
			loadingClassName = this._config.getClassName('loading'),
			renderedRange = this.getRenderedRange(),
			dir = renderedRange === null || startIndex >= renderedRange.start ? 1 : -1,
			loadRange;

		// don't render anything if already rendered same range
		if (renderedRange !== null && renderedRange.start === startIndex && renderedRange.end === endIndex) {
			deferred.resolve();

			return deferred.promise();
		}

		if (renderedRange === null) {
			loadRange = {
				start: startIndex,
				end: endIndex
			};
		} else {
			if (dir === 1) {
				loadRange = {
					start: Math.max(startIndex, renderedRange.end + 1),
					end: endIndex
				};
			} else {
				loadRange = {
					start: startIndex,
					end: Math.min(endIndex, renderedRange.start - 1)
				};
			}
		}

		// for asyncronous data source add the loading class to the main wrap for the duration of the async request
		if (this._dataSource.isAsynchronous()) {
			$(this._mainWrap).addClass(loadingClassName);
		}

		// try to abort existing item loading if possible
		if (this._getItemsPromise !== null) {
			/* istanbul ignore if */
			if (typeof this._getItemsPromise.abort === 'function') {
				this._getItemsPromise.abort();
			}

			this._getItemsPromise._ignore = true;

			this._getItemsPromise = null;
		}

		this.emit(FlowCarousel.Event.LOADING_ITEMS, loadRange.start, loadRange.end);

		// store the new itemset fetching deferred promise and fetch new items
		this._getItemsPromise = this._dataSource.getItems(loadRange.start, loadRange.end)
			.done(function(items) {
				// the carousel may get destroyed while the items are loading
				if (!self._initiated) {
					return;
				}

				// ignore invalid data if it couldn't be aborted
				if (this._ignore === true) {
					self.emit(FlowCarousel.Event.ABORTED_ITEMS, loadRange.start, loadRange.end, items);

					return;
				}

				self.emit(FlowCarousel.Event.LOADED_ITEMS, loadRange.start, loadRange.end, items);

				self._getItemsPromise = null;

				if (self._dataSource.isAsynchronous()) {
					$(self._mainWrap).removeClass(loadingClassName);
				}

				// rendering items can be asyncronous as well
				self._renderItems(items, loadRange.start).done(function() {
					// it's possible that the initial first page data loading was cancelled
					if (!this._startupItemsRenderedEmitted) {
						this.emit(FlowCarousel.Event.STARTUP_ITEMS_RENDERED);

						this._startupItemsRenderedEmitted = true;
					}

					deferred.resolve();
				}.bind(self));
			});

		return deferred.promise();
	};

	/**
	 * Renders given carousel items.
	 *
	 * @method _renderItems
	 * @param {array} items Items to render
	 * @param {number} startIndex Range start index
	 * @return {Deferred.Promise}
	 * @private
	 */
	FlowCarousel.prototype._renderItems = function(items, startIndex) {
		var deferred = new Deferred(),
			renderRange = this.getRenderRange(),
			renderingClassName = this._config.getClassName('rendering'),
			endIndex = startIndex + items.length - 1,
			promises = [],
			outOfRange,
			itemIndex,
			item,
			promise,
			existingElement,
			existingElementPos,
			i;

		// it is possible that the carousel HTML element gets removed from DOM while the async request completes
		/* istanbul ignore if */
		if ($(this._mainWrap).parent().length === 0) {
			deferred.resolve();

			return deferred.promise();
		}

		for (i = 0; i < items.length; i++) {
			item = items[i];
			itemIndex = startIndex + i;
			outOfRange = itemIndex < renderRange.start || itemIndex > renderRange.end;

			/* istanbul ignore if */
			if (outOfRange) {
				existingElement = this._itemIndexToElementMap[itemIndex];

				if (typeof existingElement !== 'undefined') {
					this._renderer.destroyItem(existingElement);

					this._removeItemIndexToElement(itemIndex);

					// remove the item from the placeholder item indexes list if exists
					existingElementPos = this._renderedPlaceholderIndexes.indexOf(itemIndex);

					if (existingElementPos !== -1) {
						this._renderedPlaceholderIndexes.splice(existingElementPos, 1);
					}
				}
			}

			// only render the item if it's not already rendered and it's not out of current render range
			/* istanbul ignore else */
			if (this._renderedItemIndexes.indexOf(itemIndex) === -1 && !outOfRange) {
				promise = this._renderer.renderItem(this._config, itemIndex, item);
			} else {
				promise = null;
			}

			promises.push(promise);
		}

		// add the rendering class to the main wrap for the duration of the rendering process
		$(this._mainWrap).addClass(renderingClassName);

		// wait for all the elements to get rendered
		// TODO Add each element as soon as it renders?
		Deferred.when.apply($, promises)
			.done(function() {
				// the carousel may get destroyed while the items are loading
				if (!this._initiated) {
					//return; // TODO restore
					throw new Error('Carousel was destroyed before rendering items');
				}

				$(this._mainWrap).removeClass(renderingClassName);

				this._insertRenderedElements(arguments, startIndex);

				this.emit(FlowCarousel.Event.RENDERED_ITEMS, startIndex, endIndex, arguments);

				deferred.resolve();
			}.bind(this));

		return deferred.promise();
	};

	/**
	 * Inserts rendered dom elements into the carousel dom structure.
	 *
	 * @method _insertRenderedElements
	 * @param {DOMElement[]} elements Elements to insert
	 * @param {number} startIndex First element index in the carousel
	 * @param {boolean} [arePlaceholders=false] Are the elements placeholders
	 * @private
	 */
	FlowCarousel.prototype._insertRenderedElements = function(elements, startIndex, arePlaceholders) {
		var useFragment = typeof document.createDocumentFragment === 'function',
			$elementRangeFragment = useFragment ? $(document.createDocumentFragment()) : null,
			$elementWrapElement = useFragment ? $elementRangeFragment : $(this._scrollerWrap),
			itemIndex,
			placeholderPos,
			placeholderElement,
			i;

		// it is possible that the carousel HTML element gets removed from DOM while the async request completes
		/* istanbul ignore if */
		if ($(this._mainWrap).parent().length === 0) {
			return;
		}

		for (i = 0; i < elements.length; i++) {
			// elements that were already rendered were set to null in _renderItems(), skip these
			if (elements[i] === null) {
				continue;
			}

			itemIndex = startIndex + i;

			// add the rendered and inserted items to the list of rendered items and the index to element mapping
			if (!arePlaceholders) {
				placeholderPos = this._renderedPlaceholderIndexes.indexOf(itemIndex);

				// remove placeholder if exists
				/* istanbul ignore if */
				if (placeholderPos !== -1 && typeof this._itemIndexToElementMap[itemIndex] !== 'undefined') {
					placeholderElement = this._itemIndexToElementMap[itemIndex];

					this._renderer.destroyItem(placeholderElement);

					this._removeItemIndexToElement(itemIndex);
					this._renderedPlaceholderIndexes.splice(placeholderPos, 1);
				}

				this._insertRenderedElement($elementWrapElement, elements[i], itemIndex);

				this._renderedItemIndexes.push(itemIndex);
			} else {
				// only add placeholders if they don't already exist
				if (this._renderedPlaceholderIndexes.indexOf(itemIndex) === -1) {
					this._insertRenderedElement($elementWrapElement, elements[i], itemIndex, true);

					this._renderedPlaceholderIndexes.push(itemIndex);
				}
			}
		}

		// the elements are first added to a fragment and then the whole fragment appended to scroller for performance
		if (useFragment) {
			$(this._scrollerWrap).append($elementRangeFragment);
		}
	};

	/**
	 * Inserts a rendered dom element into the carousel dom structure.
	 *
	 * @method _insertRenderedElement
	 * @param {DOMElement} $wrap Wrap to append the element to once ready
	 * @param {DOMElement} element Element to insert
	 * @param {number} index Element index
	 * @param {boolean} isPlaceholder Is the element a placeholder
	 * @private
	 */
	FlowCarousel.prototype._insertRenderedElement = function($wrap, element, index, isPlaceholder) {
		// calculate the properties of the element
		var $element = $(element),
			orientation = this._config.orientation,
			sizeMode = this._config.sizeMode,
			wrapSize = this._getMainWrapSize(),
			wrapOppositeSize = this._getMainWrapOppositeSize(),
			itemsPerPage = this._config.getItemsPerPage(wrapSize),
			itemSize = this._calculateItemSize(wrapSize, itemsPerPage),
			itemMargin = this._config.margin,
			gapPerItem = (itemMargin * (itemsPerPage - 1) / itemsPerPage),
			effectiveSize = Math.ceil(itemSize - gapPerItem),
			effectiveOffset = Math.floor(index * itemSize + index * (itemMargin - gapPerItem)),
			$wrapper = $('<div></div>'),
			cssProperties = {},
			$itemWrapper;

		// make sure the wrap has size if wrap size matching is used
		/* istanbul ignore if */
		if (sizeMode == Config.SizeMode.MATCH_WRAP && wrapOppositeSize === 0 && this._initiated) {
			throw new Error('The wrap opposite size was calculated to be zero, this should not happen');
		}

		// the properties to set depends on the orientation
		if (orientation === Config.Orientation.HORIZONTAL) {
			cssProperties.width = effectiveSize;
			cssProperties.left = effectiveOffset;

			if (sizeMode == Config.SizeMode.MATCH_WRAP) {
				cssProperties.height = wrapOppositeSize;
			}
		} else if (orientation === Config.Orientation.VERTICAL) {
			cssProperties.height = effectiveSize;
			cssProperties.top = effectiveOffset;

			if (sizeMode == Config.SizeMode.MATCH_WRAP) {
				cssProperties.width = wrapOppositeSize;
			}
		}

		// the element may be display: none to begin with, make it visible
		// TODO consider using a class instead
		$element.css('display', 'block');

		// wrap the item element in a carousel wrapper
		$itemWrapper = $element.wrap($wrapper).parent();

		// apply the css styles and add carousel item class
		$itemWrapper.css(cssProperties);
		$itemWrapper.addClass(this._config.getClassName('item'));

		// add the placeholder class as well if the element is a placeholder
		if (isPlaceholder) {
			$itemWrapper.addClass(this._config.getClassName('placeholder'));
		}

		// apply some pre-processing to each element about to be inserted into the dom
		this._preprocessItemElement($itemWrapper, index);

		// append the element to the scroller wrap
		$wrap.append($itemWrapper);

		/* istanbul ignore if */
		if (typeof this._itemIndexToElementMap[index] !== 'undefined') {
			throw new Error('Element at index #' + index + ' already exists, this should not happen');
		}

		// add the wrapped element to the index to element map
		this._mapItemIndexToElement(index, $itemWrapper[0]);
	};

	/**
	 * Adds a mapping between item index and its wrapper element.
	 *
	 * @method _mapItemIndexToElement
	 * @param {number} index Item index
	 * @param {DOMElement} element The DOM element
	 * @private
	 */
	FlowCarousel.prototype._mapItemIndexToElement = function(index, element) {
		this._itemIndexToElementMap[index] = element;
	};

	/**
	 * Removes mapping between item index and its wrapper element.
	 *
	 * @method _removeItemIndexToElement
	 * @param {number} index Item index to remove mapping for
	 * @private
	 */
	FlowCarousel.prototype._removeItemIndexToElement = function(index) {
		delete this._itemIndexToElementMap[index];
	};

	/**
	 * Preprocesses the item wrapper element about to be inserted into the DOM.
	 *
	 * @method _preprocessCarouselItemElement
	 * @param {jQuery} $itemWrapper The item wrapper element jQuery reference
	 * @param {number} index Item index
	 * @private
	 */
	FlowCarousel.prototype._preprocessItemElement = function($itemWrapper, index) {
		var self = this;
			//itemHoverClass = this._config.getClassName('itemHover');

		// store the item index in wrapper element data
		$itemWrapper.data(this._config.cssPrefix + 'index', index);

		// listen for hover and out events to store the currently hovered item
		$itemWrapper.hover(
			function() {
				var elementIndex = $(this).data(self._config.cssPrefix + 'index');

				// TODO not sure if it's a good idea
				//$(this).addClass(itemHoverClass);

				self._hoverItemIndex = elementIndex;
			},
			function() {
				//$(this).removeClass(itemHoverClass);

				self._hoverItemIndex = null;
			}
		);
	};

	/**
	 * Makes sure that the scroller size matches the largest currently visible item size.
	 *
	 * This is executed only when using Config.SizeMode.MATCH_LARGEST_ITEM size mode.
	 *
	 * @method validateSize
	 * @return {boolean} Was new positive size found
	 */
	FlowCarousel.prototype.validateSize = function() {
		// only perform this routine if matching the largest item size
		if (this._config.sizeMode !== Config.SizeMode.MATCH_LARGEST_ITEM) {
			return;
		}

		var oppositeOrientation = this._getOppositeOrientation(this._config.orientation),
			sizeProp = this._config.orientation === Config.Orientation.HORIZONTAL
				? 'height'
				: 'width',
			visibleItems = this.getCurrentPageVisibleItemElements(),
			largestChildSize = this._getLargestElementSize(
				visibleItems,
				oppositeOrientation,
				FlowCarousel.SizeMode.OUTER
			);

		// set the scroller to largest child size if it was possible to determine
		if (largestChildSize > 0 && largestChildSize !== this._lastLargestChildSize) {
			$(this._scrollerWrap).css(sizeProp, Math.ceil(largestChildSize) + 'px');

			this._lastLargestChildSize = largestChildSize;

			return true;
		}

		return false;
	};

	/**
	 * Re-initializes the layout.
	 *
	 * Used to apply responsive layout when the wrap size changes.
	 *
	 * Since fetching and rendering items can be asynchronous, this method returns a promise.
	 *
	 * @method _reLayout
	 * @return {Deferred.Promise}
	 * @private
	 */
	FlowCarousel.prototype._reLayout = function() {
		var focusItemIndex,
			promise;

		// focus to last center item index if requested so by the configuration
		if (this._config.centerStartItemIndex) {
			focusItemIndex = this._lastCenterItemIndex;
		} else {
			focusItemIndex = this._currentItemIndex;
		}

		// reset current state
		this._reset();

		// recalculate the layout navigating instantly to the last item
		this._setupLayout(focusItemIndex, false, this._config.centerStartItemIndex);

		// render the items that may have become visible after the layout procedure
		promise = this._validateItemsToRender();

		// update scroller size
		promise.done(function() {
			this.validateSize();
		}.bind(this));

		return promise;
	};

	/**
	 * Resets the component state and removes all rendered items.
	 *
	 * @method _reset
	 * @private
	 */
	FlowCarousel.prototype._reset = function() {
		var $scrollerWrap = $(this._scrollerWrap);

		$scrollerWrap
			.empty()
			.attr('style', null)
			.data(this._config.cssPrefix + 'last-size', null);

		this._itemIndexToElementMap = {};
		this._isAnimating = false;
		this._targetItemIndex = 0;
		this._currentItemIndex = 0;
		this._lastCenterItemIndex = null;
		this._lastLargestChildSize = null;
		this._renderedItemIndexes = [];
		this._renderedPlaceholderIndexes = [];
		this._itemIndexToElementMap = {};
		this._cache = Util.cloneObj(this._emptyCache);
	};

	/**
	 * Sets up main wrap size change listener to apply responsive layout.
	 *
	 * @method _setupWindowResizeListener
	 * @private
	 */
	FlowCarousel.prototype._setupWindowResizeListener = function() {
		// also validate on window resize
		$(window).on('resize', this._eventListeners.onWindowResize);
	};

	/**
	 * Called on window resize event.
	 *
	 * @method _onWindowResize
	 * @private
	 */
	FlowCarousel.prototype._onWindowResize = function() {
		if (!this._initiated) {
			return;
		}

		this._validateResponsiveLayout();
	};

	/**
	 * Checks whether the carousel wrap size has changed and triggers re-layout if so.
	 *
	 * @method _validateResponsiveLayout
	 * @param {boolean} force Force the validation even if busy
	 * @return {boolean} Was re-layout scheduled
	 * @private
	 */
	FlowCarousel.prototype._validateResponsiveLayout = function(force) {
		// don't perform the validation while animating
		if (this._isAnimating && force !== true) {
			return false;
		}

		var $element = $(this._mainWrap),
			lastSize = $element.data(this._config.cssPrefix + 'last-size') || null,
			currentSize = this._getMainWrapSize(true);

		$element.data(this._config.cssPrefix + 'last-size', currentSize);

		// perform the layout routine if the wrap size has changed and it did not change to zero
		if (lastSize === null || (currentSize !== lastSize && currentSize !== 0)) {
			// perform the re-layout routine only when the wrap size has not changed for some time
			this._performDelayed('re-layout', function() {
				this._reLayout();
			}.bind(this), this._config.responsiveLayoutDelay);

			return true;
		}

		return false;
	};

	/**
	 * Visually notifies the user that carousel limit has been reached.
	 *
	 * @method _showLimit
	 * @param {number} itemIndex Current item index
	 * @private
	 */
	FlowCarousel.prototype._showLimit = function(itemIndex) {
		var deferred = new Deferred(),
			enabled = this._config.limitAnimation.enabled,
			limitPixels = this._config.limitAnimation.movePixels,
			limitAnimationDuration = this._config.limitAnimation.moveDuration,
			limitItemPosition,
			limitDir,
			limitMovePosition;

		// do nothing if already animating or the limit animation has been disabled
		if (this._isAnimating || !enabled) {
			deferred.resolve();
		} else {
			if (itemIndex === 0) {
				limitDir = -1;
			} else {
				limitDir = 1;
			}

			limitItemPosition = this.getItemPositionByIndex(itemIndex);
			limitMovePosition = limitDir === -1
				? limitItemPosition + limitPixels
				: limitItemPosition - limitPixels;

			this._isAnimating = true;

			this._animator.animateToPosition(
				limitMovePosition,
				false,
				false,
				0,
				limitAnimationDuration
			).done(function () {
				this._animator.animateToPosition(
					limitItemPosition,
					false,
					false,
					0,
					limitAnimationDuration
				).done(function () {
					this._isAnimating = false;

					deferred.resolve();
				}.bind(this));
			}.bind(this));
		}

		return deferred.promise();
	};

	/**
	 * Calculates and returns a single item size based on wrap size and items per page.
	 *
	 * @method _calculateItemSize
	 * @param {number} wrapSize Wrapping element size
	 * @param {number} itemsPerPage Number of items per page
	 * @private
	 */
	FlowCarousel.prototype._calculateItemSize = function(wrapSize, itemsPerPage) {
		return wrapSize / itemsPerPage;
	};

	/**
	 * Returns the size of an element.
	 *
	 * Horizontal orientation returns element width and vertical height.
	 *
	 * Mode sets whether to return the inner or outer width/height (defaults to inner).
	 *
	 * @method _getElementSize
	 * @param {DOMelement} element Element to get size of
	 * @param {Config/Orientation:property} orientation Orientation to get size of
	 * @param {FlowCarousel.SizeMode:property} [mode=FlowCarousel.SizeMode.INNER] Size mode
	 * @return {number}
	 * @private
	 */
	FlowCarousel.prototype._getElementSize = function(element, orientation, mode) {
		mode = mode || FlowCarousel.SizeMode.INNER;

		var methods = mode === FlowCarousel.SizeMode.INNER
			? ['innerWidth', 'innerHeight']
			: ['outerWidth', 'outerHeight'];

		if (orientation === Config.Orientation.HORIZONTAL) {
			return $(element)[methods[0]]();
		} else if (orientation === Config.Orientation.VERTICAL) {
			return $(element)[methods[1]]();
		} else {
			throw new Error('Invalid orientation "' + orientation + '" requested');
		}
	};

	/**
	 * Returns biggest element size of given elements given orientation and size mode.
	 *
	 * Horizontal orientation returns element width and vertical height.
	 *
	 * Mode sets whether to return the inner or outer width/height (defaults to inner).
	 *
	 * @method _getLargestElementSize
	 * @param {DOMElement[]} elements Array of elements
	 * @param {Config/Orientation:property} orientation Orientation to get size of
	 * @param {FlowCarousel.SizeMode:property} [mode=FlowCarousel.SizeMode.INNER] Size mode
	 * @return {number}
	 * @private
	 */
	FlowCarousel.prototype._getLargestElementSize = function(elements, orientation, mode) {
		var biggestSize = 0,
			children,
			inspectElement,
			elementSize;

		$(elements).each(function(index, element) {
			children = $(element).children();

			// use the first child for reference if possible
			/* istanbul ignore else */
			if (children.length > 0) {
				inspectElement = children[0];
			} else {
				inspectElement = element;
			}

			elementSize = this._getElementSize(inspectElement, orientation, mode);

			if (elementSize > biggestSize) {
				biggestSize = elementSize;
			}
		}.bind(this));

		return biggestSize;
	};

	/**
	 * Returns the main wrap size in the main orientation.
	 *
	 * Uses cached value if available.
	 *
	 * @method _getMainWrapSize
	 * @param {boolean} [ignoreCache=false] Should cache be ignored
	 * @return {number}
	 */
	FlowCarousel.prototype._getMainWrapSize = function(ignoreCache) {
		if (this._useCache && this._cache.wrapSize !== null && ignoreCache !== true) {
			return this._cache.wrapSize;
		}

		var orientation = this._config.orientation;

		this._cache.wrapSize = this._getElementSize(this._mainWrap, orientation);

		$(this._mainWrap).data(this._config.cssPrefix + 'last-size', this._cache.wrapSize);

		return this._cache.wrapSize;
	};

	/**
	 * Returns the main wrap size in the opposite orientation.
	 *
	 * Uses cached value if available.
	 *
	 * @method _getMainWrapOppositeSize
	 * @param {boolean} [ignoreCache=false] Should cache be ignored
	 * @return {number}
	 */
	FlowCarousel.prototype._getMainWrapOppositeSize = function(ignoreCache) {
		if (this._useCache && this._cache.wrapOppositeSize !== null && ignoreCache !== true) {
			return this._cache.wrapOppositeSize;
		}

		var orientation = this._config.orientation,
			oppositeOrientation = this._getOppositeOrientation(orientation);

		this._cache.wrapOppositeSize = this._getElementSize(this._mainWrap, oppositeOrientation);

		return this._cache.wrapOppositeSize;
	};

	/**
	 * Returns the opposite orientation name.
	 *
	 * For Config.Orientation.HORIZONTAL returns Config.Orientation.VERTICAL and vice versa.
	 *
	 * @method _getOppositeOrientation
	 * @param {Config/Orientation:property} orientation Orientation to get opposite of
	 * @return {Config/Orientation:property}
	 * @private
	 */
	FlowCarousel.prototype._getOppositeOrientation = function(orientation) {
		return orientation === Config.Orientation.HORIZONTAL
			? Config.Orientation.VERTICAL
			: Config.Orientation.HORIZONTAL;
	};

	/**
	 * Returns whether items out of the render range should be destroyed.
	 *
	 * @method _shouldDestroyInvalidItems
	 * @return {boolean}
	 * @private
	 */
	FlowCarousel.prototype._shouldDestroyInvalidItems = function() {
		// return the config option if this has been chosen explicitly
		if (typeof this._config.removeOutOfRangeItems) {
			return this._config.removeOutOfRangeItems;
		}

		if (this.getItemCount() > this._config.removeOutOfRangeItemsThreshold) {
			return true;
		} else {
			return false;
		}
	};

	/**
	 * This is called by drag-based navigators on drag begin event.
	 *
	 * @method _onDragBegin
	 * @param {number} startPosition The start dragging position in the main orientation
	 * @param {number} dragOppositePosition The start dragging position in the opposite orientation
	 * @param {number} carouselPosition The start carousel position
	 * @private
	 */
	FlowCarousel.prototype._onDragBegin = function(startPosition, dragOppositePosition, carouselPosition) {
		this._dragging = true;

		this.emit(FlowCarousel.Event.DRAG_BEGIN, startPosition, dragOppositePosition, carouselPosition);
	};

	/**
	 * This is called by drag-based navigators on drag end event.
	 *
	 * @method _onDragEnd
	 * @param {string} navigationMode Navigation mode, usually 'navigate-page' or 'navigate-item'
	 * @param {number} startPosition Drag start position
	 * @param {number} endPosition Drag end position
	 * @param {number} deltaDragPosition Relative drag amount
	 * @param {number} closestIndex Closest matching page or item index depending on navigation mode
	 * @param {number} direction Drag direction, either -1 or 1
	 * @param {DOMElement} targetElement The element that the drag ended on
	 * @private
	 */
	FlowCarousel.prototype._onDragEnd = function(
		navigationMode,
		startPosition,
		endPosition,
		deltaDragPosition,
		closestIndex,
		direction,
		targetElement
	) {
		this._dragging = false;

		this.emit(
			FlowCarousel.Event.DRAG_END,
			navigationMode,
			startPosition,
			endPosition,
			closestIndex,
			deltaDragPosition,
			direction,
			targetElement
		);
	};

	/**
	 * Performs some action delayed by given amount.
	 *
	 * If the method is called several times with the same name, the action is executed only once after the time
	 * has passed from the last call.
	 *
	 * @method performDelayed
	 * @param {String} name Name of the action
	 * @param {Function} callback Callback to call
	 * @param {Number} [delay=1000] The delay, default to 1000 ms
	 */
	FlowCarousel.prototype._performDelayed = function(name, callback, delay) {
		delay = delay || 1000;

		if (typeof this._delayedTasks[name] !== 'undefined' && this._delayedTasks[name] !== null) {
			window.clearTimeout(this._delayedTasks[name]);

			this._delayedTasks[name] = null;
		}

		this._delayedTasks[name] = window.setTimeout(function() {
			this._delayedTasks[name] = null;

			callback.apply(callback, [name, delay]);
		}.bind(this), delay);
	};

	// use the Exporter to export it to AMD, Angular etc
	Exporter.export(FlowCarousel);

	return FlowCarousel;
});
	//The modules for your project will be inlined above
    //this snippet. Ask almond to synchronously require the
    //module value for 'main' here and return it as the
    //value to use for the public API for the built file.
    return require('FlowCarousel');
}));