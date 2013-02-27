## HEAD

* Renames 'resolve' to 'normalize'
* Switches hooks to asynchronous API.  Hook callbacks now get a callback
  argument that must be called when the hook is finished.
* Callbacks run earlier on async 'require' events, which allows async
  side-effects in those callbacks.
* Adds support for the [Loader Plugins][] spec via the 'plugins' extension
* 'publish' lifecycle hook now only runs if module id is truthy - i.e.,
  it is not `undefined`
* Adds 'jquery' extension for managing multiple versions of jQuery
* Adds 'jquery-minimal' extension for jQuery compatibility without
  multiple version management

[Loader Plugins]: https://github.com/amdjs/amdjs-api/wiki/Loader-Plugins

## Version 0.1.0

* Original version
