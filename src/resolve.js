/**
 * Tiny, modular implementation of the CommonJS
 * Modules/AsynchronousDefinition as described in
 * http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition
 *
 * This extension automatically resolves dependency module ids with
 * relative paths, and exports a function for producing a canonical
 * module id given a relative path and a context.
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

define('tAMD/resolve', ['tAMD/hooks'], function(hooks) {
    hooks['on']('define', function(id, dependencies, factory) {
        return [id, map(function(d) { return resolve(d, id); }, dependencies), factory];
    });

    hooks['on']('require', function(id, contextId) {
        return [resolve(id, contextId), contextId];
    });

    var relative = /^\.\.?\//;

    function resolve(id, contextId) {
        if (!id) { return id; }

        var parts = id.split('/'), contextParts, resolved = [];

        if (relative.test(id)) {
            contextParts = contextId ? contextId.split('/').slice(0, -1) : [];
            parts = contextParts.concat(parts);
        }

        for (var i = 0; i < parts.length; i++) {
            switch (parts[i]) {
                case '.':
                    break;
                case '..':
                    if (resolved.length < 1) {
                        throw "Module id, "+ id +", with context, "+ contextId +", has too many '..' components.";
                    }
                    resolved.pop();
                    break;
                default:
                    resolved.push(parts[i]);
            }
        }

        return resolved.join('/');
    }

    function map(f, array) {
        var results = [];
        for (var i = 0; i < array.length; i++) {
            results.push(f(array[i]));
        }
        return results;
    }

    return resolve;
});
