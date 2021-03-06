/**
 * @module Skritter
 * @submodule Model
 * @param locale
 * @author Joshua McFarland
 */
define([
    'require.locale!../../../locale/nls/strings'
], function(locale) {
    /**
     * @class Settings
     */
    var Settings = Backbone.Model.extend({
        /**
         * @method initialize
         */
        initialize: function() {
            skritter.nls = locale;
            $(window).resize(_.bind(function(event) {
                window.setTimeout(_.bind(function() {
                    this.trigger('resize', this);
                }, this), 0);
                event.preventDefault();
            }, this));
        },
        /**
         * @property {Object} defaults
         */
        defaults: {
            gradingColors: {
                1: '#f7977a',
                2: '#fff79a',
                3: '#82ca9d',
                4: '#8493ca'
            },
            hintColor: '#87cefa',
            language: '@@language',
            maxCanvasSize: 1800,
            storageType: 'IndexedDB',
            version: '@@version'
        },
        /**
         * @method appHeight
         * @returns {Number}
         */
        appHeight: function() {
            return $(window).height();
        },
        /**
         * @method appWidth
         * @returns {Number}
         */
        appWidth: function() {
            return $(window).width();
        },
        /**
         * @method canvasSize
         * @returns {Number}
         */
        canvasSize: function() {
            var size = 0;
            if (this.isPortrait()) {
                var calculatedMaxSize = this.contentHeight() * 0.8;
                var width = this.contentWidth();
                if (width > this.get('maxCanvasSize')) {
                    size = this.get('maxCanvasSize');
                } else {
                    size = width;
                }
                if (size > calculatedMaxSize)
                    size = calculatedMaxSize;
            } else {
                size = this.contentHeight();
            }
            return size;
        },
        /**
         * @method contentHeight
         * @returns {Number}
         */
        contentHeight: function() {
            return $('#content-container').height();
        },
        /**
         * @method contentWidth
         * @returns {Number}
         */
        contentWidth: function() {
            return $('#content-container').width();
        },
        /**
         * @method getAllParts 
         * @returns {Array}
         */
        getAllParts: function() {
            if (this.getLanguageCode() === 'zh') {
                return this.getAllChineseParts();
            }
            return this.getAllJapaneseParts();
        },
        /**
         * @method getAllChineseParts 
         * @returns {Array}
         */
        getAllChineseParts: function() {
            return ['defn', 'rdng', 'rune', 'tone'];
        },
        /**
         * @method getAllJapaneseParts 
         * @returns {Array}
         */
        getAllJapaneseParts: function() {
            return ['defn', 'rdng', 'rune'];
        },
        /**
         * @method getLanguage
         * @returns {String}
         */
        getLanguage: function() {
            var language = this.get('language');
            if (language === 'zh' || language === 'ja') {
                return language === 'zh' ? 'Chinese' : 'Japanese';
            }
            return skritter.user.settings.get('targetLang') === 'zh' ? 'Chinese' : 'Japanese';
        },
        /**
         * @method getLanguageCode
         * @returns {String}
         */
        getLanguageCode: function() {
            var language = this.get('language');
            if (language === 'zh' || language === 'ja') {
                return language;
            }
            return skritter.user.settings.get('targetLang');
        },
        /**
         * @method getVersion
         * @returns {String}
         */
        getVersion: function() {
            var version = this.get('version');
            if (version.indexOf('@') === -1) {
                return version;
            }
            return 'localhost';
        },
        /**
         * @method isChinese
         * @returns {Boolean}
         */
        isChinese: function() {
            if (this.getLanguageCode() === 'zh') {
                return true;
            }
            return false;
        },
        /**
         * @method isIndexedDB
         * @returns {Boolean}
         */
        isIndexedDB: function() {
            if (this.get('storageType') === 'IndexedDB') {
                return true;
            }
            return false;
        },
        /**
         * @method isJapanese
         * @returns {Boolean}
         */
        isJapanese: function() {
            if (this.getLanguageCode() === 'ja') {
                return true;
            }
            return false;
        },
        /**
         * @method isLandscape
         * @returns {Boolean}
         */
        isLandscape: function() {
            if (this.contentWidth() >= this.contentHeight()) {
                return true;
            }
            return false;
        },
        /**
         * @method isPortrait
         * @returns {Boolean}
         */
        isPortrait: function() {
            if (this.contentWidth() < this.contentHeight()) {
                return true;
            }
            return false;
        }
    });

    return Settings;
});