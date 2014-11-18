/**
 * Tiny, modular implementation of the CommonJS
 * Modules/AsynchronousDefinition as described in
 * http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition
 *
 * Copyright 2012-2013 Jive Software
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*jshint boss:true, loopfunc:true */

var global      = this
  , definitions = {}
  , required    = {}
  , undef;

function define(/* [id], [dependencies], factory, isRequire */) {
    var args = [].slice.call(arguments)
      , id = typeof args[0] === 'string' ? args.shift() : undef
      , dependencies = args.length > 1 ? args.shift() : []
      , factory = args.shift()
      , isRequire = !!(args && args[0]);

    if (!(isRequire || id)){
        var firstScript = document.getElementsByTagName('script')[0]
          , head = document.getElementsByTagName('head')[0] || firstScript.parentNode
          , scripts = head.querySelectorAll('script[data-requiremodule]');

          id = scripts[scripts.length-1].getAttribute('data-requiremodule');
    }

    tAMD._pre(function(id_, dependencies_, factory_) {
        run(function() {
            addDefinition(id_, map(function(d) { return requireSync(d, id_, 1); }, dependencies_), factory_);
        }, dependencies_);
    }, id, dependencies, factory);
}
define['amd'] = {};  // According to the spec, define should have this property.

var require = function(deps, factory) {
    var args = [].slice.call(arguments);
    args.push(true);
    return define.apply(undef, args);
};

function requireSync(id, contextId, skipHook) {
    if (id === 'require') {
        return function(id) {
            return requireSync(id, contextId);
        };
    }

    var ret;

    if (skipHook) {
        ret = definitions[id];
    }
    else {
        tAMD._req(function(id_) {
            ret = definitions[id_];
        }, id, contextId);
    }

    return ret;
}

function stubHook(next) { next.apply(undef, [].slice.call(arguments, 1)); }

var tAMD = {
    _pre: stubHook,
    _post: stubHook,
    _req: stubHook,
    _config: {
        baseUrl: './'
    }
};

require.config = function(config){
    if (config.baseUrl) {
        if (config.baseUrl.charAt(config.baseUrl.length - 1) !== '/') {
            config.baseUrl += '/';
        }
    }

    tAMD._config = config;
}

define('tAMD', tAMD);
satisfy('require');

global['define'] = define;
global['require'] = require;

function addDefinition(id, dependencies, factory) {
    var moduleValue = typeof factory === 'function' ?
          factory.apply(undef, dependencies) : factory;

    tAMD._post(function(id_, moduleValue_) {
        if (moduleValue_ && id_) {
            definitions[id_] = moduleValue_;
            satisfy(id_);
        }
    }, id, moduleValue);
}

function map(f, array) {
    var results = [];
    for (var i = 0; i < array.length; i++) {
        results.push(f(array[i]));
    }
    return results;
}

/**
 * Helper function for iterating over an array backwards. If the func
 * returns a true value, it will break out of the loop.
 */
function eachReverse(ary, func) {
    if (ary) {
        var i;
        for (i = ary.length - 1; i > -1; i -= 1) {
            if (ary[i] && func(ary[i], i, ary)) {
                break;
            }
        }
    }
}

/**
 * The functions run() and satisfy() are adapted from the Kongregate
 * Asynchronous JavaScript Loader
 * https://gist.github.com/388e70bccd3fdb8a6617
 *
 * The MIT License
 *
 * Copyright (c) 2010 Kongregate Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
function run(fn, dependencies) {
    var ifn, len = dependencies.length;

    if (!len) {
        fn();
    } else if (1 === len) {
        ifn = fn;
    } else {
        var count = len;
        ifn = function() { if (!--count) { fn(); } };
    }

    for (var i = 0; i < len; i++) {
        var depFn = required[dependencies[i]];
        if (true === depFn) {
            ifn();
        } else {
            required[dependencies[i]] = depFn ? (function(origFn) {
                return function() {
                    origFn();
                    ifn();
                };
            }(depFn)) : ifn;
        }
    }
}

function satisfy(dep) {
    var go = required[dep];
    required[dep] = true;
    if (go && true !== go) {
        go();
    }
}
