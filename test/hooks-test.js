/*globals define require */
/*globals reinitialize test asyncTest ok equal strictEqual deepEqual stop start */

module('tAMD/hooks', {
    setup: function() {
        var that = this;
        stop();
        reinitialize().then(function() {
            that.foo = {};
            that.bar = {};

            define('foo', that.foo);
            define('bar', that.bar);

            that.before = function(moduleId, hook) {
                require(['tAMD/hooks'], function(hooks) {
                    hooks.before(moduleId, hook);
                });
            };

            that.after = function(moduleId, hook) {
                require(['tAMD/hooks'], function(hooks) {
                    hooks.after(moduleId, hook);
                });
            };

            that.onRequire = function(moduleId, hook) {
                require(['tAMD/hooks'], function(hooks) {
                    hooks.require(moduleId, hook);
                });
            };

            start();
        });
    },
    teardown: function() {}
});

test('changes module id before invoking factory', 1, function() {
    var myModule = {};

    this.before('myModule', function(id, dependencies, factory) {
        return ['myAwesomeModule', dependencies, factory];
    });

    define('myModule', ['foo', 'bar'], function(foo, bar) {
        return myModule;
    });

    require(['myModule'], function(mm) {
        ok(false, 'module is never registered with id "myModule"');
    });

    require(['myAwesomeModule'], function(mm) {
        strictEqual(mm, myModule, 'registered module as "myAwesomeModule"');
    });
});

test('swaps module dependencies', 1, function() {
    var foo2 = {}, that = this;

    this.before('myModule', function(id, dependencies, factory) {
        var swapped = $.map(dependencies, function(dep) {
            return dep === 'foo' ? 'foo2' : dep;
        });

        return [id, swapped, factory];
    });

    define('foo2', foo2);

    define('myModule', ['foo', 'bar'], function(foo, bar) {
        strictEqual(foo, foo2, 'replaced dependency `foo` with `foo2`');
    });
});

test('swaps module factory', 1, function() {
    var myModule = {}, myModule2 = {}, that = this;

    this.before('myModule', function(id, dependencies, factory) {
        var swappedFactory = function() {
            return myModule2;
        };

        return [id, dependencies, swappedFactory];
    });

    define('myModule', function() {
        return myModule;
    });

    require(['myModule'], function(mm) {
        strictEqual(mm, myModule2, 'pulled a fast one - switched myModule factory');
    });
});

test('cancels module definition', 0, function() {
    this.before('myModule', function(id, dependencies, factory) {
        return false;
    });

    define('myModule', ['foo', 'bar'], function(foo, bar) {
        ok(false, 'module is never evaluated');
        return {};
    });

    require(['myModule'], function(mm) {
        ok(false, 'module is never registered');
    });
});

test('runs before all module definitions', 2, function() {
    function myModuleFactory(foo, bar) {
        return {};
    }

    require(['tAMD/hooks'], function(hooks) {
        hooks.before(function(id, dependencies, factory) {
            if (id === 'myModule') {
                deepEqual(dependencies, ['foo', 'bar'], 'get to inspect dependencies list for every module defined');
                strictEqual(factory, myModuleFactory, 'get to inspect factory for every module defined');
            }
        });
    });

    define('myModule', ['foo', 'bar'], myModuleFactory);
});

test('changes module id after invoking factory', 1, function() {
    var myModule = {};

    this.after('myModule', function(id, moduleValue) {
        return ['myAwesomeModule', moduleValue];
    });

    define('myModule', function() {
        return myModule;
    });

    require(['myModule'], function(mm) {
        ok(false, 'module is never registered with id "myModule"');
    });

    require(['myAwesomeModule'], function(mm) {
        strictEqual(mm, myModule, 'registered module as "myAwesomeModule"');
    });
});

test('patches module value', 2, function() {
    var myModule = { val: 1 };

    this.after('myModule', function(id, moduleValue) {
        moduleValue.val = 2;
    });

    define('myModule', myModule);

    require(['myModule'], function(mm) {
        strictEqual(mm, myModule, 'exported module, `myModule`');
        equal(mm.val, 2, 'got patched module property');
    });
});

test('cancels module registration', 1, function() {
    this.after('myModule', function(id, moduleValue) {
        return false;
    });

    define('myModule', ['foo', 'bar'], function(foo, bar) {
        ok(true, 'module is evaluated');
        return {};
    });

    require(['myModule'], function(mm) {
        ok(false, 'module is never registered');
    });
});

test('runs after all module definitions but before modules are made accessible as dependencies in other modules', 1, function() {
    var myModule = {};

    require(['tAMD/hooks'], function(hooks) {
        hooks.after(function(id, moduleValue) {
            if (id === 'myModule') {
                strictEqual(moduleValue, myModule, 'get to inspect exported value of every module defined');
            }
        });
    });

    define('myModule', myModule);
});

test('swaps module on dependency lookup', 1, function() {
    var foo2 = {};

    this.onRequire('foo', function(id, contextId) {
        return ['foo2', contextId];
    });

    define('foo2', foo2);

    define('myModule', ['foo'], function(foo) {
        strictEqual(foo, foo2, 'swapped `foo` for `foo2`');
    });
});

test('gets context in which module is required', 1, function() {
    this.onRequire('foo', function(id, contextId) {
        if (contextId === 'myModule') {
            equal(contextId, 'myModule', 'we can see that `foo` is required by `myModule`');
        }
    });

    define('myModule', ['foo'], function(foo) {
        return {};
    });
});

test('gets context in which module is required on sync require', function() {
    this.onRequire('foo', function(id, contextId) {
        equal(contextId, 'myModule', 'we can see that `foo` is required by `myModule`');
    });

    define('myModule', ['require'], function(require) {
        var foo = require('foo');
    });
});

test('runs on every dependency lookup', 2, function() {
    require(['tAMD/hooks'], function(hooks) {
        hooks.require(function(id, contextId) {
            if (id === 'foo' && contextId === 'myModule') {
                ok(true, 'we can see that `foo` is required by `myModule`');
            } else if (id === 'bar' && contextId === 'myModule') {
                ok(true, 'we can see that `bar` is required by `myModule`');
            }
        });
    });

    define('myModule', ['foo', 'bar'], function(foo) {
        return {};
    });
});
