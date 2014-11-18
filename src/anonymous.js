/**
* Tiny, modular implementation of the CommonJS
* Modules/AsynchronousDefinition as described in
* http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition
*
* This extension supports loading multiple jQuery versions
* simultaneously.
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

define('tAMD/anonymous', ['tAMD/hooks'], function(hooks) {
    var firstScript = document.getElementsByTagName('script')[0],
        head = document.getElementsByTagName('head')[0] || firstScript.parentNode;

    hooks['on']('define', function(id, dependencies, factory, next) {
        var scripts;

        if (!id){
            scripts = head.querySelectorAll('script[data-requiremodule]');
            if (scripts && scripts.length > 0) {
                id = scripts[scripts.length-1].getAttribute('data-requiremodule');
            }
        }
        next(id, dependencies, factory);
    });
});
