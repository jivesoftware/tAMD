module('tAMD/hooks', {
    setup: function() {
        var that = this;
        stop();
        reinitialize().then(function() {
            that.foo = {};
            that.bar = {};

            define('foo', that.foo);
            define('bar', that.bar);

            that.onDefine = function(moduleId, hook) {
                require(['tAMD/hooks'], function(hooks) {
                    hooks.on('define', moduleId, hook);
                });
            };

            that.onPublish = function(moduleId, hook) {
                require(['tAMD/hooks'], function(hooks) {
                    hooks.on('publish', moduleId, hook);
                });
            };

            that.onRequire = function(moduleId, hook) {
                require(['tAMD/hooks'], function(hooks) {
                    hooks.on('require', moduleId, hook);
                });
            };

            start();
        });
    },
    teardown: function() {}
});

test('changes module id before invoking factory', 1, function() {
    var myModule = {};

    this.onDefine('myModule', function(id, dependencies, factory, fn) {
        fn('myAwesomeModule', dependencies, factory);
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

    this.onDefine('myModule', function(id, dependencies, factory, fn) {
        var swapped = $.map(dependencies, function(dep) {
            return dep === 'foo' ? 'foo2' : dep;
        });

        fn(id, swapped, factory);
    });

    define('foo2', foo2);

    define('myModule', ['foo', 'bar'], function(foo, bar) {
        strictEqual(foo, foo2, 'replaced dependency `foo` with `foo2`');
    });
});

test('swaps module factory', 1, function() {
    var myModule = {}, myModule2 = {}, that = this;

    this.onDefine('myModule', function(id, dependencies, factory, fn) {
        var swappedFactory = function() {
            return myModule2;
        };

        fn(id, dependencies, swappedFactory);
    });

    define('myModule', function() {
        return myModule;
    });

    require(['myModule'], function(mm) {
        strictEqual(mm, myModule2, 'pulled a fast one - switched myModule factory');
    });
});

asyncTest('cancels module definition', 0, function() {
    this.onDefine('myModule', function(id, dependencies, factory, fn) {
        // Does not invoke fn
    });

    define('myModule', ['foo', 'bar'], function(foo, bar) {
        ok(false, 'module is never evaluated');
        return {};
    });

    require(['myModule'], function(mm) {
        ok(false, 'module is never registered');
    });

    setTimeout(start, 100);
});

test('runs before all module definitions', 2, function() {
    function myModuleFactory(foo, bar) {
        return {};
    }

    require(['tAMD/hooks'], function(hooks) {
        hooks.on('define', function(id, dependencies, factory, fn) {
            if (id === 'myModule') {
                deepEqual(dependencies, ['foo', 'bar'], 'get to inspect dependencies list for every module defined');
                strictEqual(factory, myModuleFactory, 'get to inspect factory for every module defined');
            }
            fn(id, dependencies, factory);
        });
    });

    define('myModule', ['foo', 'bar'], myModuleFactory);
});

test('changes module id after invoking factory', 1, function() {
    var myModule = {};

    this.onPublish('myModule', function(id, moduleValue, fn) {
        fn('myAwesomeModule', moduleValue);
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

    this.onPublish('myModule', function(id, moduleValue, fn) {
        moduleValue.val = 2;
        fn(id, moduleValue);
    });

    define('myModule', myModule);

    require(['myModule'], function(mm) {
        strictEqual(mm, myModule, 'exported module, `myModule`');
        equal(mm.val, 2, 'got patched module property');
    });
});

asyncTest('cancels module registration', 1, function() {
    this.onPublish('myModule', function(id, moduleValue, fn) {
        // Does not invoke fn
    });

    define('myModule', ['foo', 'bar'], function(foo, bar) {
        ok(true, 'module is evaluated');
        return {};
    });

    require(['myModule'], function(mm) {
        ok(false, 'module is never registered');
    });

    setTimeout(start, 100);
});

test('runs after all module definitions but before modules are made accessible as dependencies in other modules', 1, function() {
    var myModule = {};

    require(['tAMD/hooks'], function(hooks) {
        hooks.on('publish', function(id, moduleValue, fn) {
            if (id === 'myModule') {
                strictEqual(moduleValue, myModule, 'get to inspect exported value of every module defined');
            }
            fn(id, moduleValue);
        });
    });

    define('myModule', myModule);
});

test('swaps module on dependency lookup', 1, function() {
    var foo2 = {};

    this.onRequire('foo', function(id, contextId, fn) {
        fn('foo2', contextId);
    });

    define('foo2', foo2);

    define('myModule', ['foo'], function(foo) {
        strictEqual(foo, foo2, 'swapped `foo` for `foo2`');
    });
});

test('gets context in which module is required', 1, function() {
    this.onRequire('foo', function(id, contextId, fn) {
        if (contextId === 'myModule') {
            equal(contextId, 'myModule', 'we can see that `foo` is required by `myModule`');
        }
        fn(id, contextId);
    });

    define('myModule', ['foo'], function(foo) {
        return {};
    });
});

test('gets context in which module is required on sync require', function() {
    this.onRequire('foo', function(id, contextId, fn) {
        equal(contextId, 'myModule', 'we can see that `foo` is required by `myModule`');
        fn(id, contextId);
    });

    define('myModule', ['require'], function(require) {
        var foo = require('foo');
    });
});

test('runs on every dependency lookup', 2, function() {
    require(['tAMD/hooks'], function(hooks) {
        hooks.on('require', function(id, contextId, fn) {
            if (id === 'foo' && contextId === 'myModule') {
                ok(true, 'we can see that `foo` is required by `myModule`');
            } else if (id === 'bar' && contextId === 'myModule') {
                ok(true, 'we can see that `bar` is required by `myModule`');
            }
            fn(id, contextId);
        });
    });

    define('myModule', ['foo', 'bar'], function(foo) {
        return {};
    });
});

test('removes a hook for a given event type and module id', 1, function() {
    function aCallback(id, dependencies, factory, fn) {
        ok(false, 'the "define" callback should never be called');
        fn(id, dependencies, factory);
    }

    function bCallback(id, dependencies, factory, fn) {
        ok(true, 'the second "define" callback should be called');
        fn(id, dependencies, factory);
    }

    this.onDefine('nao', aCallback);
    this.onDefine('nao', bCallback);

    require(['tAMD/hooks'], function(hooks) {
        hooks.off('define', 'nao', aCallback);
        define('nao', {});
    });
});

test('removes all callbacks for a given module and event type', 0, function() {
    function aCallback(id, dependencies, factory, fn) {
        ok(false, 'the first "define" callback should never be called');
        fn(id, dependencies, factory);
    }

    function bCallback(id, dependencies, factory, fn) {
        ok(false, 'the second "define" callback should never be called');
        fn(id, dependencies, factory);
    }

    this.onDefine('nao', aCallback);
    this.onDefine('nao', bCallback);

    require(['tAMD/hooks'], function(hooks) {
        hooks.off('define', 'nao');
        define('nao', {});
    });
});

test('removes a callback that runs on all module ids for a given event type', 1, function() {
    function aCallback(id, dependencies, factory, fn) {
        ok(false, 'the "define" callback should never be called');
        fn(id, dependencies, factory);
    }

    function bCallback(id, dependencies, factory, fn) {
        ok(true, 'the second "define" callback should be called');
        fn(id, dependencies, factory);
    }

    require(['tAMD/hooks'], function(hooks) {
        hooks.on('define', aCallback);
        hooks.on('define', bCallback);

        hooks.off('define', aCallback);
        define('nao', {});
    });
});

test('removes all callbacks that run on all module ids for a given event type', 0, function() {
    function aCallback(id, dependencies, factory, fn) {
        ok(false, 'the first "define" callback should never be called');
        fn(id, dependencies, factory);
    }

    function bCallback(id, dependencies, factory, fn) {
        ok(false, 'the second "define" callback should never be called');
        fn(id, dependencies, factory);
    }

    require(['tAMD/hooks'], function(hooks) {
        hooks.on('define', aCallback);
        hooks.on('define', bCallback);

        hooks.off('define');
        define('nao', {});
    });
});
