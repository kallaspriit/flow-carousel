var tests = [];

for (var file in window.__karma__.files) {
    if (window.__karma__.files.hasOwnProperty(file)) {
        if (/Spec\.js$/.test(file)) {
            tests.push(file);
        }
    }
}

// load test fixture
window.loadFixture = function(filename) {
	'use strict';

	var fixtureWrap = $('#fixture-wrap');

	// remove existing if exists
	if (fixtureWrap.length > 0) {
		fixtureWrap.remove();
	}

	fixtureWrap = $('<div></div>', {
		id: 'fixture-wrap',
		style: 'width: 1200px; height: 800px; background-color: #F8F8F8;'
	}).appendTo(document.body);

	fixtureWrap.html(window.__html__['test/fixtures/' + filename]);
};

// This is the equivalent of the old waitsFor/runs syntax
// which was removed from Jasmine 2
// https://gist.github.com/abreckner/110e28897d42126a3bb9
window.waitsForAndRuns = function (escapeFunction, runFunction, escapeTime) {
	'use strict';
	// check the escapeFunction every millisecond so as soon as it is met we can escape the function
	var interval = setInterval(function () {
		if (escapeFunction()) {
			clearMe();
			runFunction();
		}
	}, 1);

	// in case we never reach the escapeFunction, we will time out
	// at the escapeTime
	var timeOut = setTimeout(function () {
		clearMe();
		runFunction();
	}, escapeTime || 3000);

	// clear the interval and the timeout
	function clearMe() {
		clearInterval(interval);
		clearTimeout(timeOut);
	}
};

require.config({

	// base url for application scripts requested without a prefix
	baseUrl: '/base/src',

	// ask Require.js to load these files (all our tests)
	deps: tests,

	// start test run, once Require.js is done
	callback: window.__karma__.start
});