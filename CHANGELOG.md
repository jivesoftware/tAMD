## HEAD

* Renames 'resolve' to 'normalize'
* Switches hooks to asynchronous API.  Hook callbacks now get a callback
  argument that must be called when the hook is finished.
* Callbacks run earlier on async 'require' events, which allows async
  side-effects in those callbacks.

## Version 0.1.0

* Original version
