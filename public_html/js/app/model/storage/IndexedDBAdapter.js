/**
 * @module Skritter
 * @submodule Storage
 * @param Database
 * @author Joshua McFarland
 */
define([
    'model/storage/Database'
], function(Database) {
    /**
     * @class IndexedDBAdapter
     */
    var IndexedDBAdapter = Database.extend({
        /**
         * @method initialize
         */
        initialize: function() {
            this.database = null;
            this.databaseName = null;
            this.version = 1;
        },
        /**
         * @method clear
         * @param {String} tableName
         * @param {Function} callback
         */
        clear: function(tableName, callback) {
            var transaction = this.database.transaction(tableName, 'readwrite');
            transaction.oncomplete = function() {
                if (typeof callback === 'function') {
                    callback();
                }
                tableName = null;
                transaction = null;
            };
            transaction.onerror = function(event) {
                console.error(event);
            };
            transaction.objectStore(tableName).clear();
        },
        /**
         * @method destroy
         * @param {Function} callback
         */
        destroy: function(callback) {
            this.database.close();
            var request = window.indexedDB.deleteDatabase(this.databaseName);
            request.onsuccess = _.bind(function() {
                if (typeof callback === 'function') {
                    callback();
                }
                request = null;
                this.database = null;
            }, this);
            request.onerror = function(error) {
                console.error(error);
            };
        },
        /**
         * @method get
         * @param {String} tableName
         * @param {Array|String} ids
         * @param {Function} callback
         */
        get: function(tableName, ids, callback) {
            var items = [];
            if (tableName && ids) {
                ids = Array.isArray(ids) ? ids : [ids];
                var transaction = this.database.transaction(tableName, 'readonly');
                var objectStore = transaction.objectStore(tableName);
                transaction.oncomplete = function() {
                    callback(items);
                    ids = null;
                    objectStore = null;
                    tableName = null;
                    transaction = null;
                };
                var push = function(event) {
                    if (event.target.result) {
                        items.push(event.target.result);
                    }
                };
                transaction.onerror = function(event) {
                    console.error(event);
                };
                for (var i = 0, length = ids.length; i < length; i++) {
                    var request = objectStore.get(ids[i]);
                    request.onsuccess = push;
                }
            } else {
                callback(items);
            }
        },
        /**
         * @method getAll
         * @param {String} tableName
         * @param {Function} callback
         */
        getAll: function(tableName, callback) {
            var items = [];
            var transaction = this.database.transaction(tableName, 'readonly');
            transaction.oncomplete = function() {
                callback(items);
                items = null;
                tableName = null;
                transaction = null;
            };
            transaction.onerror = function(event) {
                console.error(event);
            };
            transaction.objectStore(tableName).openCursor().onsuccess = function(event) {
                var cursor = event.target.result;
                if (cursor) {
                    items.push(cursor.value);
                    cursor.continue();
                }
            };
        },
        /**
         * @method getSchedule
         * @param {Array|String} filterParts
         * @param {Array|String} filterStyle
         * @param {Function} callback
         */
        getSchedule: function(filterParts, filterStyle, callback) {
            var schedule = [];
            var transaction = this.database.transaction('items', 'readonly');
            transaction.oncomplete = function() {
                callback(schedule);
                schedule = null;
                transaction = null;
            };
            transaction.onerror = function(event) {
                console.error(event);
            };
            transaction.objectStore('items').openCursor().onsuccess = function(event) {
                var cursor = event.target.result;
                if (cursor) {
                    if (cursor.value.vocabIds.length > 0 && !cursor.value.flag &&
                            filterParts.indexOf(cursor.value.part) !== -1 &&
                            filterStyle.indexOf(cursor.value.style) !== -1) {
                        schedule.push({
                            id: cursor.value.id,
                            last: cursor.value.last ? cursor.value.last : 0,
                            next: cursor.value.next ? cursor.value.next : 0
                        });
                    }
                    cursor.continue();
                }
            };
        },
        /**
         * @method open
         * @param {String} databaseName
         * @param {Function} callback
         */
        open: function(databaseName, callback) {
            var tables = this.tables;
            var request = window.indexedDB.open(databaseName, this.version);
            request.onerror = function(event) {
                console.error(event);
            };
            request.onupgradeneeded = function(event) {
                var database = event.target.result;
                database.createObjectStore('decomps', {keyPath: tables.decomps.keys[0]});
                database.createObjectStore('items', {keyPath: tables.items.keys[0]});
                database.createObjectStore('reviews', {keyPath: tables.reviews.keys[0]});
                database.createObjectStore('sentences', {keyPath: tables.sentences.keys[0]});
                database.createObjectStore('strokes', {keyPath: tables.strokes.keys[0]});
                database.createObjectStore('srsconfigs', {keyPath: tables.srsconfigs.keys[0]});
                database.createObjectStore('vocablists', {keyPath: tables.vocablists.keys[0]});
                database.createObjectStore('vocabs', {keyPath: tables.vocabs.keys[0]});
            };
            request.onsuccess = _.bind(function() {
                this.database = request.result;
                this.databaseName = databaseName;
                callback();
                tables = null;
                request = null;
            }, this);
        },
        /**
         * @method put
         * @param {String} tableName
         * @param {Array|Object} items
         * @param {Function} callback
         */
        put: function(tableName, items, callback) {
            if (tableName && items) {
                items = Array.isArray(items) ? items : [items];
                var transaction = this.database.transaction(tableName, 'readwrite');
                var objectStore = transaction.objectStore(tableName);
                transaction.oncomplete = function() {
                    callback();
                    items = null;
                    objectStore = null;
                    transaction = null;
                };
                transaction.onerror = function(event) {
                    console.error(event);
                };
                for (var i = 0, length = items.length; i < length; i++) {
                    objectStore.put(items[i]);
                }
            } else {
                callback();
            }
        },
        /**
         * @method remove
         * @param {String} tableName
         * @param {Array|String} ids
         * @param {Function} callback
         */
        remove: function(tableName, ids, callback) {
            if (tableName && ids) {
                ids = Array.isArray(ids) ? ids : [ids];
                var transaction = this.database.transaction(tableName, 'readwrite');
                var objectStore = transaction.objectStore(tableName);
                transaction.oncomplete = function() {
                    callback();
                    ids = null;
                    objectStore = null;
                    transaction = null;
                };
                transaction.onerror = function(event) {
                    console.error(event);
                };
                for (var i = 0, length = ids.length; i < length; i++) {
                    objectStore.delete(ids[i]);
                }
            } else {
                callback();
            }
        },
        /**
         * @method update
         * @param {String} tableName
         * @param {Array|Object} items
         * @param {Function} callback
         */
        update: function(tableName, items, callback) {
            items = Array.isArray(items) ? items : [items];
            var key = this.tables[tableName].keys[0];
            this.get(tableName, _.pluck(items, key), _.bind(function(originalItems) {
                var updatedItems = [];
                for (var i = 0, length = items.length; i < length; i++) {
                    updatedItems.push(_.assign(_.find(originalItems, {id: items[i][key]}), items[i]));
                }
                this.put(tableName, updatedItems, function() {
                    if (typeof callback === 'function') {
                        callback();
                    }
                    items = null;
                    key = null;
                    originalItems = null;
                    updatedItems = null;
                });
            }, this));
        }
    });

    return IndexedDBAdapter;
});