# Backbone localStorage Adapter v2.0.0

[![Build Status](https://travis-ci.org/danielbayerlein/Backbone.localStorage.svg?branch=master)](https://travis-ci.org/danielbayerlein/Backbone.localStorage)

Quite simply a localStorage adapter for Backbone.
It's a drop-in replacement for Backbone.Sync() to handle saving to a localStorage database.

## Usage

Include Backbone.localStorage after having included Backbone.js:

```html
<script type="text/javascript" src="backbone.js"></script>
<script type="text/javascript" src="backbone.localStorage.js"></script>
```

Create your collections like so:

```javascript
window.SomeCollection = Backbone.Collection.extend({
  localStorage: new Backbone.LocalStorage("SomeCollection"), // Unique name within your app.
  // ... everything else is normal.
});
```

If needed, you can use the default `Backbone.sync` (instead of local storage) by passing the `ajaxSync` option flag to any Backbone AJAX function, for example:

```javascript
var myModel = new SomeModel();
myModel.fetch({ ajaxSync: true });
myModel.save({ new: "value" }, { ajaxSync: true });
```

### RequireJS

Include [RequireJS](http://requirejs.org):

```html
<script type="text/javascript" src="lib/require.js"></script>
```

RequireJS config:

```javascript
require.config({
    paths: {
        jquery: "lib/jquery",
        underscore: "lib/underscore",
        backbone: "lib/backbone",
        localstorage: "lib/backbone.localStorage"
    }
});
```

Define your collection as a module:

```javascript
define("SomeCollection", ["localstorage"], function() {
    var SomeCollection = Backbone.Collection.extend({
        localStorage: new Backbone.LocalStorage("SomeCollection") // Unique name within your app.
    });

    return SomeCollection;
});
```

Require your collection:

```javascript
require(["SomeCollection"], function(SomeCollection) {
  // ready to use SomeCollection
});
```

## Acknowledgments

* [Mark Woodall](https://github.com/llad): initial tests (now refactored);
* [Martin Häcker](https://github.com/dwt): many fixes and the test isolation.

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new [Pull Request](../../pull/new/master)

## License

Copyright (c) 2016-2017 Daniel Bayerlein. See [LICENSE](./LICENSE) for details.

Copyright (c) 2010-2015 Jerome Gravel-Niquet.
