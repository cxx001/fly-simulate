const Fs = require('fire-fs');
const Path = require('fire-path');

global.__app = {
    path: __dirname,

    initCommander: function ( commander ) {
        // TODO:
    },

    init: function ( options, cb ) {
        // initialize ./.settings
        const settingsPath = Path.join(Editor.appPath, '.settings');
        Fs.ensureDirSync(settingsPath);
        Editor.registerProfilePath( 'local', settingsPath );

        // TODO: load your profile, and disable packages here

        //Editor.registerPackagePath( Editor.url('app://package-examples/') );
        //Editor.registerPackagePath( Editor.url('app://benchmark/') );

        if ( cb ) cb ();
    },

    run: function () {
        // create main window
        const mainWin = new Editor.Window('main', {
            'title': 'Fly Simulate',
            'min-width': 800,
            'min-height': 600,
            'show': false,
            'resizable': true
        });
        Editor.mainWindow = mainWin;

        // restore window size and position
        mainWin.restorePositionAndSize();

        // load and show main window
        mainWin.show();

        // page-level test case
        mainWin.load( 'app://index.html' );

        // open dev tools if needed
        if ( Editor.showDevtools ) {
            mainWin.openDevTools({
                detach: true
            });
        }
        mainWin.focus();
    },

    load: function () {
        // TODO
    },

    unload: function () {
        // TODO
    },

    // TODO: try to create a worker
    // 'app:worker': function () {
    //     const BrowserWindow = require('browser-window');
    //     const workerWin = new BrowserWindow({
    //         show: false,
    //     });

    //     const Url = require('fire-url');
    //     const url = Url.format( {
    //         protocol: 'file',
    //         pathname: Editor.url('editor-framework://static/worker.html' ),
    //         slashes: true,
    //     } );
    //     workerWin.loadFile(url);
    // },
};

require('./init');
