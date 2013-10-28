requirejs.config({
    baseUrl: "../js/app",
    main: 'Application',
    urlArgs: 'cb=' + Math.random(),
    paths: {
        //directories
        component: 'view/component',
        media: '../../media',
        prompt: 'view/prompt',
        template: '../../template',
        //libraries
        async: '../lib/async',
        backbone: '../lib/backbone-1.1.0.min',
        base64: '../lib/base64',
        bootstrap: '../lib/bootstrap-3.0.0.min',
        'createjs.easel': '../lib/createjs.easeljs-0.7.0.min',
        'createjs.preload': '../lib/createjs.preloadjs-0.4.0.min',
        'createjs.sound': '../lib/createjs.soundjs-0.5.0.min',
        'createjs.tween': '../lib/createjs.tweenjs-0.5.0.min',
        'indexeddb.shim': '../lib/indexeddb.shim-0.1.2.min',
        jquery: '../lib/jquery-1.10.2.min',
        'jquery.hammer': '../lib/jquery.hammerjs-1.0.5.min',
        'jquery.indexeddb': '../lib/jquery.indexeddb',
        lodash: '../lib/lodash.compat-2.2.1.min',
        'require.text': '../lib/require.text-2.0.10',
        //jasmine
        jasmine: '../../test/lib/jasmine',
        'jasmine-html': '../../test/lib/jasmine-html',
        spec: '../../test/spec/'
    },
    shim: {
        backbone: {
            deps: ['jquery', 'lodash', 'require.text'],
            exports: 'Backbone'
        },
        bootstrap: {
            deps: ['jquery']
        },
        jquery: {
            exports: '$'
        },
        'jquery.hammer': {
            deps: ['jquery']
        },
        'jquery.indexeddb': {
            deps: ['jquery']
        },
        lodash: {
            exports: '_'
        },
        jasmine: {
            exports: 'jasmine'
        },
        'jasmine-html': {
            deps: ['jasmine'],
            exports: 'jasmine'
        }
    }
});


window.store = "SkritterStore";

requirejs(['Application', 'lodash', 'jquery', 'jasmine-html'], function (Application, _, $, jasmine) {

    var jasmineEnv = jasmine.getEnv();
    jasmineEnv.updateInterval = 1000;

    var htmlReporter = new jasmine.HtmlReporter();

    jasmineEnv.addReporter(htmlReporter);

    jasmineEnv.specFilter = function (spec) {
        return htmlReporter.specFilter(spec);
    };

    var specs = [];
    specs.push('spec/Functions');
    specs.push('spec/PinyinConverter');
    specs.push('spec/Storage');
    
    $(document).ready(function () {
        require(specs, function () {
            jasmineEnv.execute();
        });
    });

});