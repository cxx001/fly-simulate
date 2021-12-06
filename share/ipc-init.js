﻿var Ipc = require('electron').ipcMain;

/**
 * @module Editor
 */

/**
 * This option is used to indicate that the message should not send to self.
 * It must be supplied as the last argument of your message if you want.
 * @property selfExcluded
 * @type {Object}
 */
Editor.selfExcluded = {
    '__is_ipc_option__': true,
    'self-excluded': true,
};

/**
 * This option is used to indicate that the message listener should receive a ipc event as its first argument.
 * It must be supplied as the last argument of your message if you want.
 * @property requireIpcEvent
 * @type {Object}
 */
Editor.requireIpcEvent = {
    '__is_ipc_option__': true,
    'require-ipc-event': true,
};

/**
 * IpcListener for easily manage ipc events
 * @class IpcListener
 * @constructor
 */
function IpcListener () {
    this.listeningIpcs = [];
}

/**
 * Register ipc message and respond it with the callback function
 * @method on
 * @param {string} ipc message name
 * @param {function} callback
 */
IpcListener.prototype.on = function (message, callback) {
    Ipc.on( message, callback );
    this.listeningIpcs.push( [message, callback] );
};

/**
 * Register ipc message and respond it once with the callback function
 * @method once
 * @param {string} ipc message name
 * @param {function} callback
 */
IpcListener.prototype.once = function (message, callback) {
    Ipc.once( message, callback );
    this.listeningIpcs.push( [message, callback] );
};

/**
 * Clear all registered ipc messages in this ipc listener
 * @method clear
 */
IpcListener.prototype.clear = function () {
    for (var i = 0; i < this.listeningIpcs.length; i++) {
        var pair = this.listeningIpcs[i];
        Ipc.removeListener( pair[0], pair[1] );
    }
    this.listeningIpcs.length = 0;
};

Editor.IpcListener = IpcListener;
