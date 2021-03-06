/**
 * @module Skritter
 * @submodule Model
 * @author Joshua McFarland
 */
define(function() {
    /**
     * @method Api
     */
    var Api = Backbone.Model.extend({
        /**
         * @method initialize
         */
        initialize: function() {
            this.clientId = 'mcfarljwapiclient';
            this.clientSecret = 'e3872517fed90a820e441531548b8c';
            this.root = 'https://beta.skritter';
            this.tld = document.location.host.indexOf('.cn') > -1 ? '.cn' : '.com';
            this.base = this.root + this.tld + '/api/v' + this.get('version') + '/';
            this.credentials = 'basic ' + window.btoa(this.clientId + ':' + this.clientSecret);
        },
        /**
         * @property {Object} defaults
         */
        defaults: {
            token: null,
            version: 0
        },
        /**
         * @method authenticateUser
         * @param {String} username
         * @param {String} password
         * @param {Function} callback
         */
        authenticateUser: function(username, password, callback) {
            var self = this;
            function request() {
                var promise = $.ajax({
                    url: self.base + 'oauth2/token',
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('AUTHORIZATION', self.credentials);
                    },
                    type: 'POST',
                    data: {
                        suppress_response_codes: true,
                        grant_type: 'password',
                        client_id: self.clientId,
                        username: username,
                        password: password
                    }
                });
                promise.done(function(data) {
                    callback(data, data.statusCode);
                });
                promise.fail(function(error) {
                    callback(error, 0);
                });
            }
            request();
        },
        /**
         * Using repeated calls it returns the data from a batch request of a given batch id. It works
         * best if the data is stored to the database before getting the next batch otherwise it could
         * cause mobile browsers to crash.
         * 
         * @method getBatch
         * @param {Number} batchId
         * @param {Function} callback
         */
        getBatch: function(batchId, callback) {
            var self = this;
            function request() {
                var promise = $.ajax({
                    url: self.base + 'batch/' + batchId,
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('AUTHORIZATION', self.credentials);
                    },
                    type: 'GET',
                    data: {
                        bearer_token: self.get('token')
                    }
                });
                promise.done(function(data) {
                    try {
                        var batch = data.Batch;
                        var requests = batch.Requests;
                        var responseSize = 0;
                        var result = {};
                        for (var i = 0, len = requests.length; i < len; i++) {
                            var response = requests[i].response;
                            if (response) {
                                responseSize += requests[i].responseSize;
                                for (var key in response) {
                                    if (result[key]) {
                                        if (Array.isArray(result[key])) {
                                            result[key] = result[key].concat(response[key]);
                                        } else {
                                            result[key] = response[key];
                                        }
                                    } else {
                                        result[key] = response[key];
                                    }
                                }
                            }
                        }
                        result.downloadedRequests = requests.length;
                        result.totalRequests = batch.totalRequests;
                        result.responseSize = responseSize;
                        result.runningRequests = batch.runningRequests;
                        if (batch.runningRequests > 0 || requests.length > 0) {
                            callback(result, data.statusCode);
                        } else {
                            callback(null, 200);
                        }
                        data = null;
                        requests = null;
                        responseSize = null;
                        result = null;
                        self = null;
                    } catch (error) {
                        callback({}, 200);
                    }
                });
                promise.fail(function(error) {
                    callback(error, 0);
                });
            }
            request();
        },
        /**
         * @method getItems
         * @param {String} itemIds
         * @param {Function} callback
         */
        getItems: function(itemIds, callback) {
            var self = this;
            var items = [];
            itemIds = Array.isArray(itemIds) ? itemIds : [itemIds];
            itemIds = _.uniq(itemIds);
            function request(batch) {
                var promise = $.ajax({
                    url: self.base + 'items',
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('AUTHORIZATION', Api.credentials);
                    },
                    type: 'GET',
                    data: {
                        bearer_token: self.get('token'),
                        ids: batch.join('|')
                    }
                });
                promise.done(function(data) {
                    items = items.concat(data.Items);
                    if (itemIds.length > 0) {
                        request(itemIds.splice(0, 19));
                    } else {
                        callback(items, data.statusCode);
                    }
                });
                promise.fail(function(error) {
                    callback(error, 0);
                });
            }
            request(itemIds.splice(0, 19));
        },
        /**
         * @method getProgStats
         * @param {Object} options
         * @param {Function} callback
         */
        getProgStats: function(options, callback) {
            var self = this;
            options = options ? options : {};
            options.start = options.start ? options.start : moment().format('YYYY-MM-DD');
            options.end = options.end ? options.end : undefined;
            options.step = options.step ? options.step : undefined;
            options.lang = options.lang ? options.lang : undefined;
            options.fields = options.fields ? options.fields : undefined;
            function request() {
                var promise = $.ajax({
                    url: self.base + 'progstats',
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('AUTHORIZATION', Api.credentials);
                    },
                    type: 'GET',
                    data: {
                        bearer_token: self.get('token'),
                        start: options.start,
                        end: options.end,
                        step: options.step,
                        lang: options.lang,
                        fields: options.fields
                    }
                });
                promise.done(function(data) {
                    callback(data.ProgressStats, data.statusCode);
                });
                promise.fail(function(error) {
                    callback(error, 0);
                });
            }
            request();
        },
        /**
         * @method getReviewErrors
         * @param {Number} offset
         * @param {Function} callback
         */
        getReviewErrors: function(offset, callback) {
            var self = this;
            var errors = [];
            offset = offset ? offset : undefined;
            function request(cursor) {
                var promise = $.ajax({
                    url: self.base + '/reviews/errors',
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('AUTHORIZATION', Api.credentials);
                    },
                    type: 'GET',
                    data: {
                        bearer_token: self.get('token'),
                        cursor: cursor,
                        offset: offset
                    }
                });
                promise.done(function(data) {
                    errors = errors.concat(data.ReviewErrors);
                    if (data.cursor) {
                        window.setTimeout(function() {
                            request(data.cursor);
                        }, 500);
                    } else {
                        callback(errors, data.statusCode);
                    }
                });
                promise.fail(function(error) {
                    callback(error, 0);
                });
            }
            request();
        },
        /**
         * @method getServerTime
         * @param {Function} callback
         */
        getServerTime: function(callback) {
            var self = this;
            function request() {
                var promise = $.ajax({
                    url: self.base + 'dateinfo',
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('AUTHORIZATION', Api.credentials);
                    },
                    type: 'GET',
                    data: {
                        bearer_token: self.get('token')
                    }
                });
                promise.done(function(data) {
                    callback({
                        serverTime: data.serverTime,
                        timeLeft: data.timeLeft,
                        today: data.today
                    }, data.statusCode);
                });
                promise.fail(function(error) {
                    callback(error, 0);
                });
            }
            request();
        },
        /**
         * @method getSRSConfigs
         * @param {String} language
         * @param {Function} callback
         */
        getSRSConfigs: function(language, callback) {
            var self = this;
            function request() {
                var promise = $.ajax({
                    url: self.base + 'srsconfigs',
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('AUTHORIZATION', Api.credentials);
                    },
                    type: 'GET',
                    data: {
                        bearer_token: self.get('token'),
                        lang: language
                    }
                });
                promise.done(function(data) {
                    callback(data.SRSConfigs, data.statusCode);
                });
                promise.fail(function(error) {
                    callback(error, 0);
                });
            }
            request();
        },
        /**
         * @method getSubscription
         * @param {String} userId
         * @param {Function} callback
         */
        getSubscription: function(userId, callback) {
            var self = this;
            function request() {
                var promise = $.ajax({
                    url: self.base + 'subscriptions/' + userId,
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('AUTHORIZATION', Api.credentials);
                    },
                    type: 'GET',
                    data: {
                        bearer_token: self.get('token')
                    }
                });
                promise.done(function(data) {
                    callback(data.Subscription, data.statusCode);
                });
                promise.fail(function(error) {
                    callback(error, 0);
                });
            }
            request();
        },
        /**
         * @method getUser
         * @param {String} userId
         * @param {Function} callback
         */
        getUser: function(userId, callback) {
            var self = this;
            function request() {
                var promise = $.ajax({
                    url: self.base + 'users/' + userId,
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('AUTHORIZATION', self.credentials);
                    },
                    type: 'GET',
                    data: {
                        bearer_token: self.get('token'),
                        detailed: true
                    }
                });
                promise.done(function(data) {
                    callback(data.User, data.statusCode);
                });
                promise.fail(function(error) {
                    callback(error, 0);
                });
            }
            request();
        },
        /**
         * @method getVocabList
         * @param {String} id
         * @param {Array} fields
         * @param {Function} callback
         */
        getVocabList: function(id, fields, callback) {
            var self = this;
            fields = fields ? fields : undefined;
            function request() {
                var promise = $.ajax({
                    url: self.base + 'vocablists/' + id,
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('AUTHORIZATION', Api.credentials);
                    },
                    type: 'GET',
                    data: {
                        bearer_token: self.get('token'),
                        fields: fields
                    }
                });
                promise.done(function(data) {
                    callback(data.VocabList, data.statusCode);
                });
                promise.fail(function(error) {
                    callback(error, 0);
                });
            }
            request();
        },
        /**
         * @method getVocabListSection
         * @param {String} listId
         * @param {String} sectionId
         * @param {Function} callback
         */
        getVocabListSection: function(listId, sectionId, callback) {
            var self = this;
            function request() {
                var promise = $.ajax({
                    url: self.base + 'vocablists/' + listId + '/sections/' + sectionId,
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('AUTHORIZATION', Api.credentials);
                    },
                    type: 'GET',
                    data: {
                        bearer_token: self.get('token')
                    }
                });
                promise.done(function(data) {
                    callback(data.VocabListSection, data.statusCode);
                });
                promise.fail(function(error) {
                    callback(error, 0);
                });
            }
            request();
        },
        /**
         * @method getVocabLists
         * @param {Function} callback
         * @param {Object} options
         */
        getVocabLists: function(callback, options) {
            var self = this;
            var lists = [];
            options = options ? options : {};
            options.cursor = options.cursor ? options.cursor : undefined;
            options.fields = options.fields ? options.fields.join(',') : undefined;
            options.lang = options.lang ? options.lang : undefined;
            options.sort = options.sort ? options.sort : undefined;
            function request(cursor) {
                var promise = $.ajax({
                    url: self.base + 'vocablists',
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('AUTHORIZATION', Api.credentials);
                    },
                    type: 'GET',
                    data: {
                        bearer_token: self.get('token'),
                        cursor: cursor,
                        lang: options.lang,
                        sort: options.sort,
                        fields: options.fields
                    }
                });
                promise.done(function(data) {
                    if (data.VocabLists)
                        lists = lists.concat(data.VocabLists);
                    if (options.cursor) {
                        callback(lists, data.statusCode);
                    } else if (data.cursor) {
                        window.setTimeout(function() {
                            request(data.cursor);
                        }, 500);
                    } else {
                        callback(lists, data.statusCode);
                    }
                });
                promise.fail(function(error) {
                    callback(error, 0);
                });
            }
            request(options.cursor);
        },
        /**
         * Posts batches of reviews in groups of 500 and then returns an array of the posted objects.
         * 
         * @method postReviews
         * @param {Array} reviews
         * @param {Function} callback
         */
        postReviews: function(reviews, callback) {
            var self = this;
            var postedReviews = [];
            function postBatch(batch) {
                var promise = $.ajax({
                    url: self.base + 'reviews?bearer_token=' + self.get('token'),
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('AUTHORIZATION', Api.credentials);
                    },
                    type: 'POST',
                    data: JSON.stringify(batch)
                });
                promise.done(function(data) {
                    postedReviews = postedReviews.concat(batch);
                    if (reviews.length > 0) {
                        postBatch(reviews.splice(0, 99));
                    } else {
                        callback(postedReviews, data.statusCode);
                    }
                });
                promise.fail(function(error) {                    
                    callback(error, error.status);
                });
            }
            postBatch(reviews.splice(0, 99));
        },
        /**
         * Requests a specific batch from the server and returns the request id. Use the
         * getBatch function to get the requested data from the server.
         * 
         * @method requestBatch
         * @param {Array|Object} requests
         * @param {Function} callback
         */
        requestBatch: function(requests, callback) {
            var self = this;
            requests = Array.isArray(requests) ? requests : [requests];
            function request() {
                var promise = $.ajax({
                    url: self.base + 'batch?bearer_token=' + self.get('token'),
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('AUTHORIZATION', self.credentials);
                    },
                    type: 'POST',
                    data: JSON.stringify(requests)
                });
                promise.done(function(data) {
                    callback(data.Batch, data.statusCode);
                });
                promise.fail(function(error) {
                    callback(error, 0);
                });
            }
            request();
        },
        /**
         * @method updateUser
         * @param {Object} settings
         * @param {Function} callback
         */
        updateUser: function(settings, callback) {
            var self = this;
            function request() {
                var promise = $.ajax({
                    url: self.base + 'users?bearer_token=' + self.get('token'),
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('AUTHORIZATION', Api.credentials);
                    },
                    type: 'PUT',
                    data: JSON.stringify(settings)
                });
                promise.done(function(data) {
                    if (typeof callback === 'function') {
                        callback(data.User, data.statusCode);
                    }
                });
                promise.fail(function(error) {
                    console.error(error, 0);
                });
            }
            request();
        },
        /**
         * @method updateVocabList
         * @param {Object} list
         * @param {Function} callback
         */
        updateVocabList: function(list, callback) {
            var self = this;
            function request() {
                var promise = $.ajax({
                    url: self.base + 'vocablists/' + list.id + '?bearer_token=' + self.get('token'),
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('AUTHORIZATION', Api.credentials);
                    },
                    type: 'PUT',
                    data: JSON.stringify(list)
                });
                promise.done(function(data) {
                    if (typeof callback === 'function') {
                        callback(data.VocabList, data.statusCode);
                    }
                });
                promise.fail(function(error) {
                    console.error(error, 0);
                });
            }
            request();
        },
        /**
         * @method updateVocabListSection
         * @param {String} listId
         * @param {Object} section
         * @param {Function} callback
         */
        updateVocabListSection: function(listId, section, callback) {
            var self = this;
            function request() {
                var promise = $.ajax({
                    url: self.base + 'vocablists/' + listId + '/section/' + section.id + '?bearer_token=' + self.get('token'),
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('AUTHORIZATION', Api.credentials);
                    },
                    type: 'PUT',
                    data: JSON.stringify(section)
                });
                promise.done(function(data) {
                    if (typeof callback === 'function') {
                        callback(data.VocabListSection);
                    }
                });
                promise.fail(function(error) {
                    console.error(error, 0);
                });
            }
            request();
        }
    });

    return Api;
});