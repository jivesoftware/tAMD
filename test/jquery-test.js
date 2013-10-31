module('tAMD/jquery', {
    setup: function() {
        var that = this;
        stop();
        reinitialize().then(function() {

            that.mkjQuery = function(version, opts) {
                opts = opts || {};
                var onNoConflict = opts.onNoConflict || $.noop;

                return {
                    fn: {
                        jquery: version
                    },

                    noConflict: function(removeAll) {
                        onNoConflict(removeAll);
                    }
                };
            };

            start();
        });
    },
    teardown: function() {}
});

test('signals support for jQuery', 1, function() {
    ok(define.amd.jQuery, 'sets define.amd.jQuery to a truthy value');
});

test('exports jquery module', 1, function() {
    require(['jquery'], function(jQuery) {
        equal(jQuery.fn.jquery, '1.9.0', 'got jquery');
    });

    define('jquery', this.mkjQuery('1.9.0'));
});

test('manages multiple jquery versions', 3, function() {
    define('jquery', this.mkjQuery('1.7.3'));
    define('jquery', this.mkjQuery('1.8.2'));
    define('jquery', this.mkjQuery('1.7.5'));

    require(['require'], function(require) {
        equal(require('jquery-1.7.3').fn.jquery, '1.7.3', 'got jQuery 1.7.3');
        equal(require('jquery-1.7.5').fn.jquery, '1.7.5', 'got jQuery 1.7.5');
        equal(require('jquery-1.8.2').fn.jquery, '1.8.2', 'got jQuery 1.8.2');
    });
});

test('provides latest matching version for partial version strings', 3, function() {
    define('jquery', this.mkjQuery('1.7.3'));
    define('jquery', this.mkjQuery('1.8.2'));
    define('jquery', this.mkjQuery('2.0.1'));
    define('jquery', this.mkjQuery('1.7.5'));

    require(['require'], function(require) {
        equal(require('jquery').fn.jquery, '2.0.1', 'got latest jQuery');
        equal(require('jquery-1').fn.jquery, '1.8.2', 'got latest jQuery 1.x');
        equal(require('jquery-1.7').fn.jquery, '1.7.5', 'got latest jQuery 1.7.x');
    });
});

test('calls .noConflict(true) if version is not the latest available', 1, function() {
    define('jquery', this.mkjQuery('1.8.6'));
    define('jquery', this.mkjQuery('1.8.4', {
        onNoConflict: function(removeAll) {
            ok(removeAll, 'called .noConflict(true) on jQuery 1.8.4');
        }
    }));
    define('jquery', this.mkjQuery('1.8.8', {
        onNoConflict: function() {
            ok(false, 'should not call .noConflict() on jQuery 1.8.8');
        }
    }));
});
