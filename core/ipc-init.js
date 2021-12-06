﻿var Ipc = require('electron').ipcMain;

require('../share/ipc-init');

/**
 * @module Editor
 */

// message operation

function getOptions (args) {
    var options = args[args.length - 1];
    return (options && typeof options === 'object' && options.__is_ipc_option__) && options;
}

function _sendToCore ( event, message ) {
    // jshint validthis:true
    'use strict';
    if (arguments.length > 2) {
        var args;
        // check options
        var options = getOptions(arguments);
        if (options) {
            if (!options['require-ipc-event']) {
                // discard event and options arg
                args = [].slice.call( arguments, 1, -1 );
            }
            else {
                // discard options arg
                args = [].slice.call( arguments, 0, -1 );
                // make message to become first argument
                args[0] = message;
                args[1] = event;
            }
        }
        else {
            // discard event arg
            args = [].slice.call( arguments, 1 );
        }
        return Ipc.emit.apply ( Ipc, args );
    }
    else {
        return Ipc.emit( message );
    }
}

Ipc.on ( 'editor:send2core', function ( event, message ) {
    // jshint validthis:true
    'use strict';
    if ( ! _sendToCore.apply ( Ipc, arguments ) ) {
        Editor.failed( 'send2core "%s" failed, listener not found for "%s" in core-level', message, message );
    }
});

function _sendToWindows ( event, message ) {
    // jshint validthis:true
    'use strict';
    if (arguments.length > 2) {
        var args;
        // check options
        var options = getOptions(arguments);
        if (options) {
            // discard event and options arg
            args = [].slice.call( arguments, 1, -1 );
            if (options['self-excluded']) {
                // dont send to sender
                Editor.sendToWindowsExclude( args, event.sender );
                return;
            }
        }
        else {
            // discard event arg
            args = [].slice.call( arguments, 1 );
        }
        // send
        Editor.sendToWindows.apply( Editor, args );
    }
    else {
        Editor.sendToWindows( message );
    }
}

Ipc.on ( 'editor:send2wins', _sendToWindows );

Ipc.on ( 'editor:send2mainwin', function (event, message) {
    'use strict';
    var mainWin = Editor.mainWindow;
    if (mainWin) {
        if (arguments.length > 2) {
            // discard event arg
            var args = [].slice.call( arguments, 1 );
            mainWin.sendToPage.apply( mainWin, args );
        }
        else {
            mainWin.sendToPage( message );
        }
    }
    else {
        console.error('Failed to send "%s" because main page not initialized.',
            message);
    }
});

Ipc.on ( 'editor:send2all', function () {
    _sendToCore.apply(Ipc, arguments);
    _sendToWindows.apply(Ipc, arguments);
});

Ipc.on ( 'editor:send2panel', function ( event ) {
    var args = [].slice.call( arguments, 1 );
    Editor.sendToPanel.apply( Editor, args );
});

Ipc.on ( 'editor:sendreq2core', function (event, request, args, sessionId) {
    var called = false;
    function replyCallback () {
        if ( !called ) {
            called = true;
            event.sender.send('editor:sendreq2core:reply', [].slice.call(arguments), sessionId);
        }
        else {
            Editor.error('The callback which reply to "%s" can only be called once!', request);
        }
    }

    var options = getOptions(args);
    if (options && options['require-ipc-event']) {
        args.unshift(request, event, replyCallback);
    }
    else {
        args.unshift(request, replyCallback);
    }
    if ( !Ipc.emit.apply(Ipc, args) ) {
        Editor.error('The listener of request "%s" is not yet registered!', request);
    }
});

// initialize messages APIs

/**
 * Send `args...` to windows except the excluded
 * @method sendToWindowsExclude
 * @param {string} channel
 * @param {...*} [args] - whatever arguments the message needs
 * @param {object} excluded - A [WebContents](https://github.com/atom/electron/blob/master/docs/api/browser-window.md#class-webcontents) object.
 */
Editor.sendToWindowsExclude = function (args, excluded) {
    // NOTE: duplicate windows list since window may close during events
    var winlist = Editor.Window.windows.slice();
    for ( var i = 0; i < winlist.length; ++i ) {
        var win = winlist[i];
        if (win.nativeWin.webContents !== excluded) {
            win.sendToPage.apply( win, args );
        }
    }
};

/**
 * Send `args...` to all opened windows via `channel` in asynchronous message. The `page-level`
 * can handle it by listening to the channel event of the ipc module.
 *
 * @method sendToWindows
 * @param {string} channel
 * @param {...*} [args] - whatever arguments the message needs
 * @example
 * In `core-level`:
 *
 * ```js
 * Editor.sendToWindows('foo:bar', 'Hello World!');
 * ```
 *
 * In `page-level`:
 *
 * ```html
 * // index.html
 * <html>
 * <body>
 *   <script>
 *     require('ipc').on('foo:bar', function(message) {
 *       console.log(message);  // Prints "Hello World!"
 *     });
 *   </script>
 * </body>
 * </html>
 * ```
 */
Editor.sendToWindows = function () {
    // NOTE: duplicate windows list since window may close during events
    var winlist = Editor.Window.windows.slice();
    for ( var i = 0; i < winlist.length; ++i ) {
        var win = winlist[i];
        win.sendToPage.apply( win, arguments );
    }
};

/**
 * Send `args...` to core itself via `channel` in asynchronous message.
 * @method sendToCore
 * @param {string} channel
 * @param {...*} [args] - whatever arguments the message needs
 */
Editor.sendToCore = function () {
    if ( Ipc.emit.apply ( Ipc, arguments ) === false ) {
        Editor.failed( 'sendToCore ' + arguments[0] + ' failed, not responded.' );
    }
};

/**
 * Send `args...` to all opened window and core via `channel` in asynchronous message.
 * @method sendToAll
 * @param {string} channel
 * @param {...*} [args] - whatever arguments the message needs
 */
Editor.sendToAll = function () {
    if (arguments.length > 1) {
        var toSelf = true;
        var args = arguments;
        // check options
        var options = getOptions(arguments);
        if (options) {
            // discard options arg
            args = [].slice.call( arguments, 0, -1 );
            if (options['self-excluded']) {
                toSelf = false;
            }
        }
        // send
        if (toSelf) {
            Ipc.emit.apply(Ipc, args); // sendToCore (dont require receiver)
        }
        Editor.sendToWindows.apply(Editor, args);
    }
    else {
        Ipc.emit(arguments[0]); // sendToCore (dont require receiver)
        Editor.sendToWindows(arguments[0]);
    }
};

// DISABLE: not make sense
// Editor.sendToPackage = function ( packageName, message ) {
//     var panels = Editor.Panel.findPanels(packageName);
//     var args = [].slice.call( arguments, 1 );

//     for ( var i = 0; i < panels.length; ++i ) {
//         var panelID = packageName + '.' + panels[i];
//         Editor.sendToPanel.apply( Editor, [panelID].concat(args) );
//     }
// };

/**
 * Send `args...` to specific panel via `channel` in asynchronous message.
 * @method sendToPanel
 * @param {string} panelID
 * @param {string} channel
 * @param {...*} [args] - whatever arguments the message needs
 * @example
 * ```js
 * Editor.sendToPanel( 'package.panel', 'ipc-foo-bar', 'arg1', 'arg2', ... );
 * ```
 */
Editor.sendToPanel = function ( panelID, message ) {
    var win = Editor.Panel.findWindow( panelID );
    if ( !win ) {
        Editor.warn( "Failed to send %s, can not find panel %s.", message, panelID );
        return;
    }

    var args = [].slice.call( arguments, 0 );
    args.unshift('editor:send2panel');
    win.sendToPage.apply( win, args );
};

/**
 * Send `args...` to main window via `channel` in asynchronous message.
 * @method sendToMainWindow
 * @param {string} channel
 * @param {...*} [args] - whatever arguments the message needs
 */
Editor.sendToMainWindow = function () {
    var mainWin = Editor.mainWindow;
    if (mainWin) {
        mainWin.sendToPage.apply( mainWin, arguments );
    }
    else {
        console.error('Failed to send "%s" because main page not initialized.',
                      arguments[0]);
    }
};
