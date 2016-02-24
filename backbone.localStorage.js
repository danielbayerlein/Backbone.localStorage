/* global define, Backbone */

/**
 * Backbone localStorage Adapter
 *
 * @version 2.0.0
 * @see https://github.com/danielbayerlein/Backbone.localStorage
 * @license https://github.com/danielbayerlein/Backbone.localStorage#license
 */
(function (root, factory) {
  if (typeof exports === 'object' && typeof require === 'function') {
    module.exports = factory(require('backbone'));
  } else if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['backbone'], function def(Backbone) {
      // Use global variables if the locals are undefined.
      return factory(Backbone || root.Backbone);
    });
  } else {
    factory(Backbone);
  }
}(this, function (Backbone) {
  // A simple module to replace `Backbone.sync` with *localStorage*-based
  // persistence. Models are given GUIDS, and saved into a JSON object. Simple
  // as that.

  // Generate four random hex digits.
  function generateFourHexDigits() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  }

  // Generate a pseudo-GUID by concatenating random hexadecimal.
  function guid() {
    return generateFourHexDigits() +
      generateFourHexDigits() + '-' +
      generateFourHexDigits() + '-' +
      generateFourHexDigits() + '-' +
      generateFourHexDigits() + '-' +
      generateFourHexDigits() +
      generateFourHexDigits() +
      generateFourHexDigits();
  }

  function isObject(item) {
    return item === Object(item);
  }

  function contains(array, item) {
    var i = array.length;
    while (i--) if (array[i] === item) return true;
    return false;
  }

  function extend(obj, props) {
    var key;
    var resultObj = obj;

    for (key in props) {
      if ({}.hasOwnProperty.call(props, key)) {
        resultObj[key] = props[key];
      }
    }

    return resultObj;
  }

  function result(object, property) {
    var value;

    if (object == null) {
      return void 0;
    }

    value = object[property];
    return (typeof value === 'function') ? object[property]() : value;
  }

  // Our Store is represented by a single JS object in *localStorage*. Create it
  // with a meaningful name, like the name you'd give a table.
  // window.Store is deprectated, use Backbone.LocalStorage instead
  window.Store = function store(name, serializer) {
    var storage;
    if (this.localStorage()) {
      this.name = name;
      this.serializer = serializer || {
        serialize: function serialize(item) {
          return isObject(item) ? JSON.stringify(item) : item;
        },
        // fix for "illegal access" error on Android when JSON.parse is passed null
        deserialize: function deserialize(data) {
          return data && JSON.parse(data);
        }
      };
      storage = this.localStorage().getItem(this.name);
      this.records = (storage && storage.split(',')) || [];
    }
  };
  Backbone.LocalStorage = window.Store;

  extend(Backbone.LocalStorage.prototype, {

    // Save the current state of the **Store** to *localStorage*.
    save: function save() {
      this.localStorage().setItem(this.name, this.records.join(','));
    },

    // Add a model, giving it a (hopefully)-unique GUID, if it doesn't already
    // have an id of it's own.
    create: function create(model) {
      var obj = model;

      if (!obj.id && obj.id !== 0) {
        obj.id = guid();
        obj.set(obj.idAttribute, obj.id);
      }
      this.localStorage().setItem(this._itemName(obj.id), this.serializer.serialize(obj));
      this.records.push(obj.id.toString());
      this.save();

      return this.find(obj);
    },

    // Update a model by replacing its copy in `this.data`.
    update: function update(model) {
      var obj = model;
      var modelId;

      this.localStorage().setItem(this._itemName(obj.id), this.serializer.serialize(obj));
      modelId = obj.id.toString();
      if (!contains(this.records, modelId)) {
        this.records.push(modelId);
        this.save();
      }

      return this.find(obj);
    },

    // Retrieve a model from `this.data` by id.
    find: function find(model) {
      return this.serializer.deserialize(this.localStorage().getItem(this._itemName(model.id)));
    },

    // Return the array of all models currently in storage.
    findAll: function findAll() {
      var arr = [];
      var i;
      var id;
      var data;

      for (i = 0; i < this.records.length; i++) {
        id = this.records[i];
        data = this.serializer.deserialize(this.localStorage().getItem(this._itemName(id)));
        if (data !== null) {
          arr.push(data);
        }
      }

      return arr;
    },

    // Delete a model from `this.data`, returning it.
    destroy: function destroy(model) {
      var modelId = model.id.toString();
      var i;

      this.localStorage().removeItem(this._itemName(model.id));
      for (i = 0; i < this.records.length; i++) {
        if (this.records[i] === modelId) {
          this.records.splice(i, 1);
        }
      }
      this.save();

      return model;
    },

    localStorage: function storage() {
      try {
        return localStorage;
      } catch (e) {
        return null;
      }
    },

    // Clear localStorage for specific collection.
    _clear: function clear() {
      var k;
      var local = this.localStorage();
      var itemRe = new RegExp('^' + this.name + '-');

      // Remove id-tracking item (e.g., "foo").
      local.removeItem(this.name);

      // Match all data items (e.g., "foo-ID") and remove.
      for (k in local) {
        if (itemRe.test(k)) {
          local.removeItem(k);
        }
      }

      this.records.length = 0;
    },

    // Size of localStorage.
    _storageSize: function storageSize() {
      return this.localStorage().length;
    },

    _itemName: function itemName(id) {
      return this.name + '-' + id;
    }

  });

  // localSync delegate to the model or collection's
  // *localStorage* property, which should be an instance of `Store`.
  // window.Store.sync and Backbone.localSync is deprecated, use Backbone.LocalStorage.sync instead
  Backbone.localSync = function sync(method, model, options) {
    var syncDfd;
    var resp;
    var errorMessage;
    var store = result(model, 'localStorage') || result(model.collection, 'localStorage');

    // If $ is having Deferred - use it.
    if (Backbone.$) {
      syncDfd = Backbone.$.Deferred && Backbone.$.Deferred();
    } else {
      syncDfd = Backbone.Deferred && Backbone.Deferred();
    }

    try {
      switch (method) {
        case 'read':
          resp = model.id !== undefined ? store.find(model) : store.findAll();
          break;
        case 'create':
          resp = store.create(model);
          break;
        case 'update':
          resp = store.update(model);
          break;
        case 'delete':
          resp = store.destroy(model);
          break;
        default:
          break;
      }
    } catch (error) {
      if (error.code === 22 && store._storageSize() === 0) {
        errorMessage = 'Private browsing is unsupported';
      } else {
        errorMessage = error.message;
      }
    }

    if (resp) {
      if (options && options.success) {
        if (Backbone.VERSION === '0.9.10') {
          options.success(model, resp, options);
        } else {
          options.success(resp);
        }
      }

      if (syncDfd) {
        syncDfd.resolve(resp);
      }
    } else {
      if (errorMessage === '') {
        errorMessage = 'Record Not Found';
      }

      if (options && options.error) {
        if (Backbone.VERSION === '0.9.10') {
          options.error(model, errorMessage, options);
        } else {
          options.error(errorMessage);
        }
      }

      if (syncDfd) {
        syncDfd.reject(errorMessage);
      }
    }

    // add compatibility with $.ajax
    // always execute callback for success and error
    if (options && options.complete) options.complete(resp);

    return syncDfd && syncDfd.promise();
  };
  window.Store.sync = Backbone.localSync;
  Backbone.LocalStorage.sync = window.Store.sync;
  Backbone.ajaxSync = Backbone.sync;

  Backbone.getSyncMethod = function getSyncMethod(model, options) {
    var forceAjaxSync = options && options.ajaxSync;

    if (!forceAjaxSync && (result(model, 'localStorage') ||
        result(model.collection, 'localStorage'))) {
      return Backbone.localSync;
    }

    return Backbone.ajaxSync;
  };

  // Override 'Backbone.sync' to default to localSync,
  // the original 'Backbone.sync' is still available in 'Backbone.ajaxSync'
  Backbone.sync = function sync(method, model, options) {
    return Backbone.getSyncMethod(model, options).apply(this, [method, model, options]);
  };

  return Backbone.LocalStorage;
}));
