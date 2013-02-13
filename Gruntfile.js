'use strict';

var _ = require('underscore');

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
        src: getComponents() || [
          'src/define.js',
          'src/hooks.js',
          'src/resolve.js',
          'src/loader.js',
          'src/debug.js'
        ],
        dest: 'dist/<%= pkg.name %>.cc.js'
      }
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
      resolve: ['define', 'hooks'],
      loader: ['define', 'hooks'],
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

      if (ds.indexOf('resolve') > ds.indexOf('loader') && ds.indexOf('loader') > -1) {
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

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-closure-tools');

  grunt.registerTask('compile', ['closureCompiler', 'uglify']);
  grunt.registerTask('test', ['compile', 'connect', 'qunit']);
  grunt.registerTask('test:src', ['connect', 'qunit:src']);
  grunt.registerTask('test:dist', ['compile', 'connect', 'qunit:dist']);

  // Default task.
  grunt.registerTask('default', ['jshint', 'clean', 'test']);

};

// vim: sts=2:sw=2:et
