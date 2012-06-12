/**
 * Tiny, modular implementation of the CommonJS
 * Modules/AsynchronousDefinition as described in
 * http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition
 *
 * This extension provides friendly integration points for manipulating
 * modules before or after they are defined.
 *
 * Copyright 2012 Jive Software
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

/*jshint laxcomma:true */

define('tAMD/hooks', ['tAMD'], function(tAMD, undef) {
    var before = {}
      , after = {}
      , onRequire = {}
      , beforeAll = []
      , afterAll = []
      , onRequireAll = [];

    tAMD._pre = function(/* id, dependencies, factory */) {
        return runCallbacks(beforeAll, before, arguments);
    };

    tAMD._post = function(/* id, moduleValue */) {
        return runCallbacks(afterAll, after, arguments);
    };

    tAMD._req = function(/* id, contextId */) {
        return runCallbacks(onRequireAll, onRequire, arguments);
    };

    function runCallbacks(all, mappings, args) {
        var callbacks = all.concat(mappings[args[0]] || []), ret, val;
        for (var i = 0; i < callbacks.length; i++) {
            if (ret !== false) {
                val = callbacks[i].apply(undef, ret || args);
                ret = (val !== false) && (val || ret);
            }
        }
        return ret;
    }

    function register(all, mappings, id, callback) {
        var callbacks;
        if (typeof id === 'function') {
            all.push(id);  // hook runs on every module
        } else {
            callbacks = mappings[id] = mappings[id] || [];
            callbacks.push(callback);
        }
    }

    return {
        'before': function(id, callback) {
            register(beforeAll, before, id, callback);
        },

        'after': function(id, callback) {
            register(afterAll, after, id, callback);
        },

        'require': function(id, callback) {
            register(onRequireAll, onRequire, id, callback);
        }
    };
});
