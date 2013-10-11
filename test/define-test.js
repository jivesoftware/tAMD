module('tAMD/define', {
    setup: function() {
        var that = this;
        stop();
        reinitialize().then(function() {
            that.foo = {};
            that.bar = {};

            define('foo', that.foo);
            define('bar', that.bar);

            start();
        });
    },
    teardown: function() {}
});

test('defines a module', 1, function() {
    var that = this;

    require(['foo'], function(f) {
        strictEqual(f, that.foo, 'exported `foo` from module');
    });
});

test('defines a module with multiple dependencies', 3, function() {
    var myModule = {}, that = this;

    define('myModule', ['foo', 'bar'], function(foo, bar) {
        strictEqual(foo, that.foo, 'got `foo` as a module dependency');
        strictEqual(bar, that.bar, 'got `bar` as a module dependency');
        return myModule;
    });

    require(['myModule'], function(mm) {
        strictEqual(mm, myModule, 'exported `myModule` from module');
    });
});

test('provides synchronous module loading via `require` dependency', 1, function() {
    var that = this;

    require(['require'], function(require) {
        var foo = require('foo');
        strictEqual(foo, that.foo, "loaded `foo` via `require()`");
    });
});

asyncTest('invokes modules in correct order', 3, function() {
    var a = {}, b = {}, c = {};

    define('myModule', ['a', 'b', 'c'], function(myA, myB, myC) {
        strictEqual(myA, a, 'got `a` as module dependency');
        strictEqual(myB, b, 'got `b` as module dependency');
        strictEqual(myC, c, 'got `c` as module dependency');
        start();
        return {};
    });

    define('b', b);
    define('a', a);

    setTimeout(function() {
        define('c', c);
    }, 100);
});

test('provides dependencies to multiple modules if necessary', 3, function() {
    var d = {};

    define('a', ['d'], function(myD) {
        strictEqual(myD, d, 'got `d` as a dependency in `a`');
    });

    define('b', ['d'], function(myD) {
        strictEqual(myD, d, 'got `d` as a dependency in `b`');
    });

    define('b', ['d'], function(myD) {
        strictEqual(myD, d, 'got `d` as a dependency in `c`');
    });

    define('d', d);
});

test('resolves a module that results in additional require of one of its dependencies', 1, function() {
    var a = {}, b = {};
    define('b', ['a'], function() {
        require(['a'], function(myA) {
            strictEqual(myA, a, 'inner require succeeded');
        });
        return b;
    });
    define('a', a);
});
