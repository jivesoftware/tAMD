'use strict';

var _ = require('underscore');

var defaultBundle = [
  'src/define.js',
  'src/hooks.js',
  'src/normalize.js',
  'src/plugins.js',
  'src/loader.js',
  'src/jquery.js',
  'src/debug.js'
];

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/* github.com/jivesoftware/tAMD - v<%= pkg.version %> */\n',
    // Task configuration.
    clean: {
      files: ['dist']
    },
    closureCompiler: {
      options: {
        compilerFile: 'libs/closure/compiler.jar',
        compilerOpts: {
          compilation_level: 'ADVANCED_OPTIMIZATIONS',
          output_wrapper: '"(function(){%output%}());"'
        }
      },
      dist: {
        src: getComponents() || defaultBundle,
        dest: 'dist/<%= pkg.name %>.cc.js'
      }
    },
    concat: {
      dist: {
        options: {
          stripBanners: {
            block: true
          },
          banner: '<%= banner %>\n'+
            '(function(){\n',
          footer: '}());\n'
      },
        src: getComponents() || defaultBundle,
        dest: 'dist/<%= pkg.name %>.js'
      },
    },
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        src: '<%= closureCompiler.dist.dest %>',
        dest: 'dist/<%= pkg.name %>.min.js'
      },
    },
    qunit: {
      src: {
        options: {
          urls: ['http://localhost:<%= connect.server.port %>/test/tAMD.html']
        }
      },
      dist: {
        options: {
          urls: ['http://localhost:<%= connect.server.port %>/test/tAMD.min.html']
        }
      }
    },
    connect: {
        server: {
            port: 8000,
            base: '.'
        }
    },
    jshint: {
      gruntfile: {
        options: {
          jshintrc: '.jshintrc'
        },
        src: 'Gruntfile.js'
      },
      src: {
        options: {
          jshintrc: 'src/.jshintrc'
        },
        src: ['src/**/*.js']
      },
      test: {
        options: {
          jshintrc: 'test/.jshintrc'
        },
        src: ['test/**/*.js']
      },
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      src: {
        files: '<%= jshint.src.src %>',
        tasks: ['jshint:src', 'test:src']
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: ['jshint:test', 'test:src']
      },
    },
  });

  function getComponents() {
    var deps = {
      define: [],
      hooks: ['define'],
      normalize: ['define', 'hooks'],
      plugins: ['define', 'hooks', 'normalize'],
      loader: ['define', 'hooks'],
      jquery: ['define', 'hooks'],
      'jquery-minimal': ['define'],
      debug: ['define', 'hooks']
    };
    var cs = grunt.option('components'), ds, ret;

    if (cs) {
      ds = _.chain(cs.split(/\s*[,;\s]\s*/))
      .map(function(c) {
        return (deps[c] || []).concat(c);
      })
      .flatten()
      .uniq()
      .value();

      if (ds.indexOf('normalize') > ds.indexOf('loader') && ds.indexOf('loader') > -1) {
        ret = ds.filter(function(c) {
          return c !== 'loader';
        }).concat('loader');
      }
      else {
        ret = ds;
      }

      return ret.map(function(c) {
        return 'src/'+ c +'.js';
      });
    }
  }

  // load all grunt tasks matching the `grunt-*` pattern
  require('load-grunt-tasks')(grunt);

  grunt.registerTask('compile', ['closureCompiler', 'uglify']);
  grunt.registerTask('test', ['compile', 'connect', 'qunit']);
  grunt.registerTask('test:src', ['connect', 'qunit:src']);
  grunt.registerTask('test:dist', ['compile', 'connect', 'qunit:dist']);

  // Default task.
  grunt.registerTask('default', ['jshint', 'clean', 'test']);

};

// vim: sts=2:sw=2:et
