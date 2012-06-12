/*globals reinitialize define require */
/*globals test asyncTest ok equal strictEqual stop start */

module('tAMD/loader', {
    setup: function() {
        var that = this;
        stop();
        reinitialize().then(function() {
            that.bLoaded = false;

            require(['tAMD/loader'], function(loader) {
                loader.map(['a'], ['/test/fixture/a.js']);
                loader.map(['b'], ['/test/fixture/b.js'], function() {
                    that.bLoaded = true;
                });
                loader.map(['c'], ['/test/fixture/dependency-of-c.js', '/test/fixture/c.js']);
            });

            start();
        });
    },
    teardown: function() {}
});

asyncTest('loads modules lazily', 1, function() {
    require(['a'], function(a) {
        equal(a.val, 'a', 'loaded module `a`');
        start();
    });
});

asyncTest('invokes callbacks with URL mappings', 3, function() {
    var that = this;

    require(['b'], function(b) {
        equal(b.val, 'b', 'loaded module `b`');
        ok(!that.bLoaded, 'the callback with URL mappings for `b` should not have run yet');

        setTimeout(function() {
            ok(that.bLoaded, 'callback with URL mappings for `b` was invoked');
            start();
        }, 0);
    });
});

asyncTest('loads multiple scripts in order', 1, function() {
    require(['c'], function(c) {
        equal(c.val, 'c', 'loaded module `c`');
        start();
    });
});

asyncTest('handles relative module ids if tAMD/resolve is loaded first', 1, function() {
    define('namespace/d', ['../a'], function(a) {
        equal(a.val, 'a', 'loaded module `a` using a relative module id');
        start();
    });
});
