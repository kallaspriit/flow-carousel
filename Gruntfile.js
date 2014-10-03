/* global module */
module.exports = function (grunt) {
	'use strict';

	// require all the dependencies
	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

	// set grunt config
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		// lints the codebase for errors and typos
		// https://github.com/gruntjs/grunt-contrib-jshint
		jshint: {
			library: {
				options: {
					jshintrc: '.jshintrc',
				},
				src: [
					'src/**/*.js',
					'!src/EventEmitter.js', // ignore EventEmitter by Wolfy87 https://github.com/Wolfy87/EventEmitter
				]
			},
			plguins: {
				options: {
					jshintrc: '.jshintrc',
				},
				src: [
					'plugins/**/*.js'
				]
			},
			tests: {
				options: {
					jshintrc: 'test/.jshintrc',
				},
				src: [
					'test/**/*.js',
				]
			}
		},

		// generates a single file distribution version of the project
		// https://github.com/asciidisco/grunt-requirejs
		requirejs: {
			combined: {
				options: {
					baseUrl: './src',
					paths: {},
					name: 'FlowCarousel',
					out: 'dist/FlowCarousel.js',
					almond: true,
					wrap: {
						startFile: 'build/almond-start.frag',
						endFile: 'build/almond-end.frag'
					},
					optimize: 'none'
				}
			},
			minified: {
				options: {
					baseUrl: './src',
					paths: {},
					name: 'FlowCarousel',
					out: 'dist/FlowCarousel.min.js',
					almond: true,
					wrap: {
						startFile: 'build/almond-start.frag',
						endFile: 'build/almond-end.frag'
					},
					optimize: 'uglify2',
					preserveLicenseComments: false,
					generateSourceMaps: true
				}
			}
		},

		// uglify is used to compress the plugins
		uglify: {
			options: {
				sourceMap: true,
				sourceMapIncludeSources: true
			},
			plugins: {
				files: [{
					expand: true,
					//cwd: 'plugins',
					src: 'plugins/**/*.js',
					dest: 'dist'
				}]
			}
		},

		// executes tests using karma test runner
		// https://github.com/karma-runner/grunt-karma
		karma: {
            unit: {
                configFile: 'karma.conf.js'
            }
        },

		// generates the reference documentation
		// https://github.com/gruntjs/grunt-contrib-yuidoc
		yuidoc: {
			compile: {
				name: '<%= pkg.name %>',
				description: '<%= pkg.description %>',
				version: '<%= pkg.version %>',
				url: '<%= pkg.homepage %>',
				options: {
					paths: [
						'src',
					],
					outdir: 'reference',
					linkNatives: 'true'
				}
			}
		},

		// creates a local server for viewing the examples
		// https://github.com/gruntjs/grunt-contrib-connect
		connect: {
			server: {
				options: {
					hostname: 'localhost',
					port: 9001,
					base: './',
					keepalive: true
				}
			}
		},

		// counts the source lines of code
		// https://github.com/rhiokim/grunt-sloc
		sloc: {
			options: {
				// Task-specific options go here.
			},
			library: {
				files: {
					'src': ['*.js']
				}
			},
			tests: {
				files: {
					'test': ['*.js']
				}
			}
		},
	});

	// register default task
	grunt.registerTask('default', ['jshint', 'test', 'build', 'reference']);

	// builds distribution version of the library and plugins
	grunt.registerTask('build', ['requirejs', 'uglify']);

	// executes the tests
	grunt.registerTask('test', ['karma']);

	// starts the local testing server
	grunt.registerTask('server', ['connect:server']);

	// executes the tests
	grunt.registerTask('reference', ['yuidoc']);
};