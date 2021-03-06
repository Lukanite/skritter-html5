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
     * @class WebSQLAdapter
     */
    var WebSQLAdapter = Database.extend({
        /**
         * @method initialize
         */
        initialize: function() {
            this.database = null;
            this.version = '1.0';
            this.size = 50 * 1024 * 1024;
        },
        /**
         * @method clear
         * @param {String} tableName
         * @param {Function} callback
         */
        clear: function(tableName, callback) {
            var onError = function(event) {
                console.error(event);
            };
            var onSuccess = function() {
                if (typeof callback === 'function')
                    callback();
            };
            this.database.transaction(function(tx) {
                tx.executeSql('DROP TABLE IF EXISTS ' + tableName);    
            }, onError, onSuccess);
        },
        /**
         * @method destroy
         * @param {Function} callback
         */
        destroy: function(callback) {
            var tables = this.tables;
            var onError = function(event) {
                console.error(event);
            };
            var onSuccess = function() {
                if (typeof callback === 'function')
                    callback();
            };
            this.database.transaction(function(tx) {
                for (var name in tables)
                    tx.executeSql('DROP TABLE IF EXISTS ' + name);
            }, onError, onSuccess);
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
                ids = ids.map(function(id) {
                    return JSON.stringify(id);
                });
                var valueString = this.valueString(ids);
                var key = this.tables[tableName].keys[0];
                var error = function(event) {
                    console.error(event);
                };
                var success = function() {
                    callback(items);
                };
                this.database.transaction(function(tx) {
                    tx.executeSql('SELECT * FROM ' + tableName + ' WHERE ' + key + ' IN (' + valueString + ')', ids, results);
                    function results(tx, result) {
                        for (var a = 0, lengthA = result.rows.length; a < lengthA; a++) {
                            var item = _.cloneDeep(result.rows.item(a));
                            for (var b = 0, keys = Object.keys(item), lengthB = keys.length; b < lengthB; ++b)
                                item[keys[b]] = JSON.parse(item[keys[b]]);
                            items.push(item);
                        }
                    }
                }, error, success);
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
            var onError = function(event) {
                console.error(event);
            };
            var onSuccess = function() {
                callback(items);
            };
            this.database.transaction(function(tx) {
                tx.executeSql('SELECT * FROM ' + tableName, [], results);
                function results(tx, result) {
                    for (var a = 0, lengthA = result.rows.length; a < lengthA; a++) {
                        var item = _.cloneDeep(result.rows.item(a));
                        for (var b = 0, keys = Object.keys(item), lengthB = keys.length; b < lengthB; ++b) {
                            var value = JSON.parse(item[keys[b]]);
                            if (value) {
                                item[keys[b]] = value;
                            } else {
                                delete item[keys[b]];
                            }
                        }
                        items.push(item);
                    }
                }
            }, onError, onSuccess);
        },
        /**
         * @method getSchedule
         * @param {Array|String} filterParts
         * @param {Array|String} filterStyle
         * @param {Function} callback
         */
        getSchedule: function(filterParts, filterStyle, callback) {
            var schedule = [];
            var onError = function(event) {
                console.error(event);
            };
            var onSuccess = function() {
                callback(schedule);
            };
            this.database.transaction(function(tx) {
                tx.executeSql('SELECT id, flag, last, next, style, vocabIds FROM items', [], results);
                function results(tx, result) {
                    for (var a = 0, lengthA = result.rows.length; a < lengthA; a++) {
                        var item = _.cloneDeep(result.rows.item(a));
                        var flag = JSON.parse(item.flag);
                        var last = JSON.parse(item.last);
                        var next = JSON.parse(item.next);
                        var part = JSON.parse(item.part);
                        var style = JSON.parse(item.style);
                        var vocabIds = JSON.parse(item.vocabIds);
                        if (vocabIds.length > 0 && !flag &&
                                filterParts.indexOf(part) !== 0 &&
                                filterStyle.indexOf(style) !== 0) {
                            item.id = JSON.parse(item.id);
                            item.last = last ? last : 0;
                            item.next = next ? next : 0;
                            schedule.push(item);
                        }
                    }
                }
            }, onError, onSuccess);
        },
        /**
         * @method open
         * @param {String} databaseName
         * @param {Function} callback
         */
        open: function(databaseName, callback) {
            var tables = this.tables;
            var onError = function(event) {
                console.error(event);
            };
            var onSuccess = function() {
                callback();
            };
            this.database = window.openDatabase(databaseName, this.version, databaseName, this.size);
            this.database.transaction(function(tx) {
                for (var name in tables) {
                    var table = tables[name];
                    tx.executeSql('CREATE TABLE IF NOT EXISTS ' + name + ' (' + table.keys[0] + ' PRIMARY KEY,' + table.columns.join(',') + ')');
                }
            }, onError, onSuccess);
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
                var table = this.tables[tableName];
                var keysColumns = table.keys.concat(table.columns);
                var valueString = this.valueString(keysColumns);
                var onError = function(event) {
                    console.error(event);
                };
                var onSuccess = function() {
                    callback();
                };
                this.database.transaction(function(tx) {
                    var queryString = 'INSERT OR REPLACE INTO ' + tableName + ' (' + keysColumns.join(',') + ') VALUES (' + valueString + ')';
                    for (var a = 0, lengthA = items.length; a < lengthA; a++) {
                        var item = items[a];
                        var values = [];
                        for (var b = 0, lengthB = keysColumns.length; b < lengthB; b++) {
                            var value = item[keysColumns[b]];
                            if (typeof value === 'undefined') {
                                values.push('null');
                            } else {
                                values.push(JSON.stringify(value));
                            }
                        }
                        tx.executeSql(queryString, values);
                    }
                }, onError, onSuccess);
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
            var items = [];
            if (tableName && ids) {
                ids = Array.isArray(ids) ? ids : [ids];
                ids = ids.map(function(id) {
                    return JSON.stringify(id);
                });
                var key = this.tables[tableName].keys[0];
                var error = function(event) {
                    console.error(event);
                };
                var success = function() {
                    callback(items);
                };
                this.database.transaction(function(tx) {
                    for (var i = 0, length = ids.length; i < length; i++)
                        tx.executeSql('DELETE FROM ' + tableName + ' WHERE ' + key + ' = ?', [ids[i]]);
                }, error, success);
            } else {
                callback(items);
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
                for (var i = 0, length = items.length; i < length; i++)
                    updatedItems.push(_.assign(_.find(originalItems, {id: items[i][key]}), items[i]));
                this.put(tableName, updatedItems, function() {
                    if (typeof callback === 'function')
                        callback();
                });
            }, this));
        }
    });

    return WebSQLAdapter;
});