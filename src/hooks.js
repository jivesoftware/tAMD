/**
 * Tiny, modular implementation of the CommonJS
 * Modules/AsynchronousDefinition as described in
 * http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition
 *
 * This extension provides friendly integration points for manipulating
 * modules before or after they are defined.
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

/*global define */
/*jshint expr:true */

define('tAMD/hooks', ['tAMD'], function(tAMD, undef) {
    var queues = {};

    tAMD._pre = function(callback, id, dependencies, factory) {
        runCallbacks('define', [id, dependencies, factory], function(id_, deps_, factory_) {
            var finalDeps = [], count = deps_.length, len = count;
            for (var i = 0; i < len; i++) {
                runCallbacks('require', [deps_[i], id_], getDep(i));
            }
            len || callback(id_, finalDeps, factory_);
            function getDep(n) {
                return function(dep) {
                    finalDeps[n] = dep;
                    --count || callback(id_, finalDeps, factory_);
                };
            }
        });

    };

    tAMD._post = function(callback, id, moduleValue) {
        return runCallbacks('publish', [id, moduleValue], callback);
    };

    tAMD._req = function(callback, id, contextId) {
        return runCallbacks('require', [id, contextId], callback);
    };

    function runCallbacks(eventType, args, callback) {
        var callbacks = getQueue(eventType, '**').concat(getQueue(eventType, args[0]));
        (function run(as) {
            if (callbacks.length) {
                callbacks.shift().apply(undef, as.concat(function() {
                    run([].slice.call(arguments));
                }));
            }
            else {
                callback.apply(undef, as);
            }
        }(args));
    }

    function on(eventType, id, callback) {
        if (!callback) {
            callback = id;
            id = '**';  // hook runs on every module
        }
        getQueue(eventType, id).push(callback);
    }

    function off(eventType, id, callback) {
        if (typeof id === 'function') {
            callback = id;
            id = '**';  // hook runs on every module
        }
        var queue = getQueue(eventType, id || '**');
        for (var i = 0; i < queue.length; i++) {
            if (queue[i] === callback || !callback) {
                queue.splice(i, 1);  // Removes the matching callback from the array.
                i -= 1; // Compensate for array length changing within the loop.
            }
        }
    }

    function getQueue(eventType, id) {
        var typeSpecific = queues[eventType] = queues[eventType] || {}
          , queue = typeSpecific[id] = typeSpecific[id] || [];
        return queue;
    }

    return {
        'on': on,
        'off': off
    };
});
