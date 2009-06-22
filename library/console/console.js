/**
 * @fileOverview A server-side implementation of the Firebug Console API
 * @author Nathan L Smith
 * @date November 21, 2008
 * @version 0.0.4
 */

/*global console, Jaxer, Request, Response */

if (typeof console === "undefined") {
    /**
     * @namespace console
     *
     * This is a partial implementation of the Firebug Console API using 
     * the Wildfire/FirePHP protocol. 
     *
     * @see http://nlsmith.com/projects/console/
     * @see http://getfirebug.com/console.html
     * @see http://www.firephp.org/HQ/Use.htm
     */
    var console = (function () {
        /**
         * Is the console enabled? Set this with 
         * console.enable()/console.disable()
         */
        var enabled = true;

        /**
         * The possible console levels
         */
        var levels = {
            log : "LOG",
            info : "INFO",
            warn : "WARN",
            error : "ERROR",
            trace : "TRACE",
            table : "TABLE",
            dump : "DUMP",
            group : "GROUP_START",
            groupEnd : "GROUP_END",
            time : "TIME",
            timeEnd : "TIME_END"
        };

        /**
         * Timers for console.time()
         */
        var timers = {};

        /**
         * The platforms object defines objects for the server-side JavaScript 
         * platform on which the console object is used
         */
        var platforms = (function platforms() {
            var p = {}; // Platforms object to return

            try {
                p.jaxer = {
                    addHeader : function addHeader(header, value) { 
                        Jaxer.response.headers[header] = value;
                    },
                    userAgent : Jaxer.request.headers["User-Agent"],
                    toJSON : function toJSON(o) {
                        return Jaxer.Serialization.toJSONString(o, { as : "JSON" });
                    }
                };
            } catch (eJaxer) {}

            try {
                p.asp = {
                    addHeader : function addHeader(header, value) { 
                        Response.addHeader(header, value);
                    },
                    userAgent : String(Request.ServerVariables("HTTP_USER_AGENT")),
                    toJSON : Object.toJSON // This is from Prototype.js
                };
            } catch (eAsp) {}

            try {
                p.appjet = {
                    addHeader : function addHeader(header, value) {
                        response.setHeader(header, value);
                    },
                    userAgent : request.headers["User-Agent"],
                    toJSON : JSON.stringify
                };
            } catch (eAppjet) {}

            p.unknown = { 
                addHeader : function addHeader() { 
                    throw new Error("Unknown platform");
                },
                userAgent : "",
                toJSON : function toJSON() { return ""; }
            };

            return p;
        })();

        /** 
         * Detect the current platform here and assign it to the platform 
         * variable
         */
        var platform = (function platform() {
            if (typeof Jaxer === "object" && Jaxer.isOnServer) { 
                return "jaxer"; 
            } else if (typeof Request === "object"  && 
                       typeof Response === "object" && 
                       typeof Request.ServerVariables === "object") {
                // Require Prototype for ASP
                if (typeof Object.toJSON !== "function") {
                  throw new Error("Prototype ASP (or another implementation of Object.toJSON())is required. Get it from http://nlsmith.com/projects/prototype-asp");
                }
                return "asp";
            } else if (typeof appjet === "object") {
                return "appjet"; 
            } else if (false) {
                // TODO: other platforms
            } else { return "unknown"; }
        })(); 

        /**
         * Add a header
         */
        var addHeader = platforms[platform].addHeader; 

        /** 
         * The User agent string from the agent
         */
        var userAgent = platforms[platform].userAgent;

        /**
         * Convert an object to its JSON representation
         */
        var toJSON = platforms[platform].toJSON;

        /**
         * Does the user agent have FirePHP installed?
         *
         * The official FirePHP library checks the version, etc., but this just
         * checks if "FirePHP" is in the user agent string
         */
        var hasFirePHP = userAgent.match("FirePHP") !== null;

        /**
         * The index of headers to be added. Starts at 1
         */
        var index = 1;

        /**
         * The maximium length of any given message
         */
        var maxLength = 5000;

        /**
         * This is an implementation of the sprintf function based on the one
         * found at http://webtoolkit.info. Takes an array instead of 
         * multiple arguments
         *
         * @see http://www.webtoolkit.info/javascript-sprintf.html
         */
        function sprintf(args) {
            if (typeof args == "undefined") { return null; }
            if (args.length < 1) { return null; }
            if (typeof args[0] != "string") { return null; }
            if (typeof RegExp == "undefined") { return null; }

            function convert(match, nosign){
                if (nosign) {
                    match.sign = '';
                } else {
                    match.sign = match.negative ? '-' : match.sign;
                }
                var l = match.min - match.argument.length + 1 - match.sign.length;
                var pad = new Array(l < 0 ? 0 : l).join(match.pad);
                if (!match.left) {
                    if (match.pad == "0" || nosign) {
                            return match.sign + pad + match.argument;
                    } else {
                            return pad + match.sign + match.argument;
                    }
                } else {
                    if (match.pad == "0" || nosign) {
                        return match.sign + match.argument + pad.replace(/0/g, ' ');
                    } else {
                        return match.sign + match.argument + pad;
                    }
                }
            }
 
            var string = args[0];
            var exp = new RegExp(/(%([%]|(\-)?(\+|\x20)?(0)?(\d+)?(\.(\d)?)?([bcdifosxX])))/g);
            var matches = new Array();
            var strings = new Array();
            var convCount = 0;
            var stringPosStart = 0;
            var stringPosEnd = 0;
            var matchPosEnd = 0;
            var newString = '';
            var match = null;

            while (match = exp.exec(string)) {
                if (match[9]) { convCount += 1; }

                stringPosStart = matchPosEnd;
                stringPosEnd = exp.lastIndex - match[0].length;
                strings[strings.length] = string.substring(stringPosStart, stringPosEnd);

                matchPosEnd = exp.lastIndex;
                matches[matches.length] = {
                    match: match[0],
                    left: match[3] ? true : false,
                    sign: match[4] || '',
                    pad: match[5] || ' ',
                    min: match[6] || 0,
                    precision: match[8],
                    code: match[9] || '%',
                    negative: parseInt(args[convCount]) < 0 ? true : false,
                    argument: String(args[convCount])
                };
            }
            strings[strings.length] = string.substring(matchPosEnd);

            if (matches.length == 0) { return string; }
            if ((args.length - 1) < convCount) { return null; }

            var code = null;
            var match = null;
            var i = null;

            for (i=0; i<matches.length; i++) {

                if (matches[i].code == '%') { substitution = '%' }
                else if (matches[i].code == 'b') {
                    matches[i].argument = String(Math.abs(parseInt(matches[i].argument)).toString(2));
                    substitution = convert(matches[i], true);
                }
                else if (matches[i].code == 'c') {
                    matches[i].argument = String(String.fromCharCode(parseInt(Math.abs(parseInt(matches[i].argument)))));
                    substitution = convert(matches[i], true);
                }
                else if (matches[i].code == 'd' || matches[i].code == 'i') {
                    matches[i].argument = String(Math.abs(parseInt(matches[i].argument)));
                    substitution = convert(matches[i]);
                }
                else if (matches[i].code == 'f') {
                    matches[i].argument = String(Math.abs(parseFloat(matches[i].argument)).toFixed(matches[i].precision ? matches[i].precision : 6));
                    substitution = convert(matches[i]);
                }
                else if (matches[i].code == 'o') {
                    matches[i].argument = String(Math.abs(parseInt(matches[i].argument)).toString(8));
                    substitution = convert(matches[i]);
                }
                else if (matches[i].code == 's') {
                    matches[i].argument = matches[i].argument.substring(0, matches[i].precision ? matches[i].precision : matches[i].argument.length)
                    substitution = convert(matches[i], true);
                }
                else if (matches[i].code == 'x') {
                    matches[i].argument = String(Math.abs(parseInt(matches[i].argument)).toString(16));
                    substitution = convert(matches[i]);
                }
                else if (matches[i].code == 'X') {
                    matches[i].argument = String(Math.abs(parseInt(matches[i].argument)).toString(16));
                    substitution = convert(matches[i]).toUpperCase();
                }
                else {
                    substitution = matches[i].match;
                }

                newString += strings[i];
                newString += substitution;

            }
            newString += strings[i];

            return newString;
        }

        /**
         * Combine the arguments to the function and run them through
         * sprintf if necessary
         */
        function handleArgs(args) {
            args = args || [];
            var argc = args.length;
            var s = []; // String to return

            // Number of items to substitute in first argument
            var substitutions = 0; 

            if (argc > 0) {
                if (typeof args[0] === "string") {
                    substitutions = (args[0].match(/\%\w/g) || []).length + 1;
        
                    // Run string through sprintf is needed
                    if (substitutions > 1) { 
                        s.push(sprintf(args.slice(0, substitutions)));
                        args = args.slice(substitutions, argc);
                        argc = args.length;
                    }
                }

                for (var i = 0; i < argc; i += 1) {
                    s.push(String(args[i]));
                }

            }
            return s.join(" ");
        }

        /**
         * The function that does the work of setting the headers and formatting
         */
        function f(level, args) {
            if (!platform || !hasFirePHP || !enabled) { return; }
            level = level || levels.log;
            args = Array.prototype.slice.call(args);
    
            var s = ""; // The string to send to the console
            var msg = ""; // The complete header message
            var meta = { // Metadata for object
                Type : level
            };
            var time; // Value for timer

            if (args.length > 0) { // Proceed if there are arguments
                // If the first argument is an object, only it gets processed
                if (typeof args[0] === "object") { 
                    // Error objects can be handled with more detail if they
                    // were thrown with the "new Error(...)" constructor
                    if (level === levels.error && args[0] instanceof Error) {
                        if (args[0].lineNumber) { 
                            meta.Line = args[0].lineNumber;
                        }
                        if (args[0].fileName) {
                            meta.File = args[0].fileName;
                        }
                    }
                    s = args[0];
                // If the first argument is not an object, we assume it's a 
                // string or number and process it accordingly
                } else { 
                    if (level === levels.group) { // Handle groups
                        meta.Label = args[0];
                    } else if (level === levels.time) { // Handle time
                        timers[args[0]] = { start : (new Date()).getTime() };
                        return;
                    } else if (level === levels.timeEnd) { // Handle time end
                        meta.Type = levels.info;
                        if (args[0] in timers) {
                            timers[args[0]].end = (new Date()).getTime(); 
                            // Calculate elapsed time
                            time = timers[args[0]].end - timers[args[0]].start;
                            if (isFinite(time)) {
                                args[0] = args[0] + ": " + time + "ms";
                            } else { args[0] = "Invalid timer"; }
                        }
                    }
                        
                    s = handleArgs(args);
                }
            } else { return; } // Do nothing if no arguments

            // If the starting headers haven't been added, add them
            if (index <= 1) {
                addHeader("X-Wf-Protocol-1", "http://meta.wildfirehq.org/Protocol/JsonStream/0.2");
                addHeader("X-Wf-1-Plugin-1", " http://meta.firephp.org/Wildfire/Plugin/FirePHP/Library-FirePHPCore/0.2.0");
                addHeader("X-Wf-1-Structure-1", "http://meta.firephp.org/Wildfire/Structure/FirePHP/FirebugConsole/0.1");
            }

            s = toJSON(s); // JSONify string
            meta = toJSON(meta); // And meta
            msg = '[' + meta + ',' + s + ']'; // Start message

            if (msg.length < maxLength) {
                addHeader('X-Wf-1-1-1-' + index, msg.length + '|' + msg + '|');
            } else { // Split the message up if it's greater than maxLength
                (function splitMessage() {
                    var keyPrefix = 'X-Wf-1-1-1-';
                    var key = keyPrefix + index;
                    var value = "";
                    var totalLength = msg.length;
                    var messages = [];
                    var chars = msg.split("");                 
                    var part = "";
    
                    // Split the messages up
                    for (var i = 0; i < chars.length; i += maxLength) {
                        part = chars.slice(i, i + maxLength).join("");
                        messages.push(part);
                    }

                    // Add a header for each part
                    for(i = 0; i < messages.length; i += 1) {
                        key = keyPrefix + index;
                        value = '|' + messages[i] + '|';

                        if (i === 0) { value = totalLength + value; }
                        if (i !== messages.length - 1) { value += "\\"; }

                        addHeader(key, value);
                        index += 1;
                    }
                })(); 
            }
            index += 1;
        }

        return {
            log : function log() {
                f(levels.log, arguments); 
            },
            debug : function debug() {
                // log & debug do the same thing
                f(levels.log, arguments);
            },
            info : function info() {
                f(levels.info, arguments);
            },
            warn : function warn() {
                f(levels.warn, arguments);
            },
            error : function error() {
                f(levels.error, arguments);
            },
            assert : function assert() {
                f(levels.warn, ["console.assert() is not implemented"]);
            },
            /**
             * dir is Firebug specific and probably will not be implemented
             */
            dir : function dir() {
                f(levels.warn, ["console.dir() is not implemented"]);
            },
            /**
             * dirxml is Firebug specific and probably will not be implemented
             */
            dirxml : function dirxml() {
                f(levels.warn, ["console.dirxml() is not implemented"]);
            },
            trace : function trace() {
                f(levels.warn, ["console.trace() is not implemented"]);
            },
            group : function group() {
                f(levels.group, [arguments[0] || ""]);
            },
            groupEnd : function groupEnd() {
                f(levels.groupEnd, [""]);
            },
            time : function time() {
                f(levels.time, [arguments[0] || ""]);
            },
            timeEnd : function timeEnd() {
                f(levels.timeEnd, [arguments[0] || ""]);
            },
            /**
             * profile is Firebug specific and probably will not be implemented
             */
            profile : function profile() {
                f(levels.warn, ["console.profile() is not implemented"]);
            },
            /**
             * profileEnd is Firebug specific and probably will not be 
             * implemented
             */
            profileEnd : function profileEnd() {
                f(levels.warn, ["console.profileEnd() is not implemented"]);
            },
            count : function count() {
                f(levels.warn, ["console.count() is not implemented"]);
            },
            /**
             * table shows the logged object in a tablular format. This is NOT
             * part of the Firebug console API and is specific to Wildfire
             */
            table : function table() {
                f(levels.warn, ["console.table() is not implemented"]);
            },
            /**
             * dump is FirePHP specific and shows an object in the Response 
             * pane of the Firebug Net tab.I don't forsee implementing it at 
             * any time.
             */
            dump : function dump() {
                f(levels.warn, ["console.dump() is not implemented"]);
            },
            /**
             * Enable the console 
             */
            enable : function enable() {
                enabled = true;
                f(levels.info, ["console is enabled"]);
            },
            /**
             * Disable the console
             */
            disable : function disable() {
                f(levels.info, ["console is disabled"]);
                enabled = false;
            }
        };
    })();
}
