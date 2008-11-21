/**
 * @fileOverview A server-side implementation of the Firebug Console API.
 *   This is a Jaxer extension version of this script. 
 *   Drop this file in your local_jaxer/extensions directory to add the 
 *   Jaxer.console object to all requests
 *
 * @author Nathan L Smith
 * @date November 21, 2008
 * @version 0.0.4
 */

/*global Jaxer */

(function () {
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
     * Log a string to the Jaxer Log using a level from the Console class. If
     * the given level (lowecased) is not an available level, use "info"
     */
    function echoToJaxerLog(message, level) {
        level = level.toLowerCase() in Jaxer.Log ? level.toLowerCase() : "info";
        Jaxer.Log[level](message);
    }

    /**
     * @class Console
     * @constructor
     */
    var Console = function Console() {
        /**
         * Set CONSOLE_DISABLED = true in local_jaxer/conf/config.js to have the
         * console disabled by default. You can enable and disable the console 
         * with console.enable()/console.disable()
         */
        this.isEnabled = !Jaxer.Config.CONSOLE_DISABLED;

        /**
         * Should console messages also be logged to Jaxer.Log? Set 
         * CONSOLE_ECHO_TO_LOG to true in local_jaxer/conf/config.js to enable
         * in your config, or set Jaxer.console.ECHO_TO_LOG directly
         */
        this.echoToJaxerLog = Jaxer.Config.CONSOLE_ECHO_TO_LOG;

        /**
         * The maximum length of any given message
         */
        this.maxLength = 5000;

        /** The possible console levels */
        this.levels = {
            log  : "LOG",
            info  : "INFO",
            warn  : "WARN",
            error  : "ERROR",
            trace  : "TRACE",
            table  : "TABLE",
            dump  : "DUMP",
            group  : "GROUP_START",
            groupEnd : "GROUP_END",
            time  : "TIME",
            timeEnd : "TIME_END"
        };

        /**
         * Timers for console.time()
         * NOTE Jaxer.Stopwatch could be used
         */
        this.timer = Jaxer.Util.Stopwatch;

        this.addHeader = function addHeader(header, value) { 
            Jaxer.response.headers[header] = value;
        };

        this.toJSON = function toJSON(o) {
            return Jaxer.Serialization.toJSONString(o, { as : "JSON" });
        };

        /**
         * The function that does the work of setting the headers and formatting
         */
        this.f = function f(level, args) {
            if ( !this.hasFirePHP || !this.isEnabled) { return; }
            level = level || this.levels.log;
            args = Array.prototype.slice.call(args);

            var s = ""; // The string to send to the console
            var msg = ""; // The complete header message
            var meta = { // Metadata for object
                Type : level
            };
            var time; // The current timer name

            if (args.length > 0) { // Proceed if there are arguments
                // If the first argument is an object, only it gets processed
                if (typeof args[0] === "object") { 
                    // Error objects can be handled with more detail if they
                    // were thrown with the "new Error(...)" constructor
                    if (this.level === this.levels.error && 
                        args[0] instanceof Error) {
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
                    if (level === this.levels.group) { // Handle groups
                        meta.Label = args[0];
                    } else if (level === this.levels.time) { // Handle time
                        this.timer.start(args[0]);
                        return;
                    // Handle time end
                    } else if (level === this.levels.timeEnd) { 
                        meta.Type = this.levels.info;
                        time = args[0];
                        this.timer.stop(time);
                        time = this.timer.timings[time];

                        if (isFinite(Number(time[0])) {
                            args[0] = args[0] + ": " + time[0] + "ms";
                        } else { args[0] = "Invalid time"; }

                        this.timer.timings[time].shift(); // Remove the timer
                    }
                    s = handleArgs(args);
                }
            } else { return; } // Do nothing if no arguments

            // Log to the Jaxer Log if specified
            if (this.echoToJaxerLog) { echoToJaxerLog(s, level); }

            // If the starting headers haven't been added, add them
            if (!Jaxer.response.headers.hasOwnProperty("X-Wf-Protocol-1")) {
                this.addHeader("X-Wf-Protocol-1", "http://meta.wildfirehq.org/Protocol/JsonStream/0.2");
                this.addHeader("X-Wf-1-Plugin-1", "http://meta.firephp.org/Wildfire/Plugin/FirePHP/Library-FirePHPCore/0.2.0");
                this.addHeader("X-Wf-1-Structure-1", "http://meta.firephp.org/Wildfire/Structure/FirePHP/FirebugConsole/0.1");
            }

            s = this.toJSON(s); // JSONify string
            meta = this.toJSON(meta); // And meta
            msg = '[' + meta + ',' + s + ']'; // Start message

            if (msg.length < this.maxLength) {
                this.addHeader('X-Wf-1-1-1-' + Jaxer.response.headers.__count__, msg.length + '|' + msg + '|');
            } else { // Split the message up if it's greater than maxLength
                (function splitMessage() {
                    var key = 'X-Wf-1-1-1-' + Jaxer.response.headers.__count__;
                    var value = "";
                    var totalLength = msg.length;
                    var messages = [];
                    var chars = msg.split("");                 
                    var part = "";

                    // Split the messages up
                    for (var i = 0; i < chars.length; i += this.maxLength) {
                        part = chars.slice(i, i + this.maxLength).join("");
                        messages.push(part);
                    }

                    // Add a header for each part
                    for(i = 0; i < messages.length; i += 1) {
                        key =  key = 'X-Wf-1-1-1-' + Jaxer.response.headers.__count__;
                        value = '|' + messages[i] + '|';
                        if (i === 0) { value = totalLength + value; }
                        if (i !== messages.length - 1) { value += "\\"; }
                        this.addHeader(key, value);
                    }

                })(); 
            }
        };

        this.log = function log() {
            this.f(this.levels.log, arguments); 
        };
        this.debug = function debug() {
            // log & debug do the same thing
            this.f(this.levels.log, arguments);
        };
        this.info = function info() {
            this.f(this.levels.info, arguments);
        };
        this.warn = function warn() {
            this.f(this.levels.warn, arguments);
        };
        this.error = function error() {
            this.f(this.levels.error, arguments);
        };
        this.group = function group() {
            this.f(this.levels.group, [arguments[0] || ""]);
        };
        this.groupEnd = function groupEnd() {
            this.f(this.levels.groupEnd, [""]);
        };
        this.time = function time() {
            this.f(this.levels.time, [arguments[0] || ""]);
        };
        this.timeEnd = function timeEnd() {
            this.f(this.levels.timeEnd, [arguments[0] || ""]);
        };
    };

    /** Is the console enabled? */
    Console.prototype.__defineGetter__("enabled", function enabled() {
        return this.isEnabled;
    });

    /** Enable the console */
    Console.prototype.__defineSetter__("enabled", function enabled(state) {
        var msg = "console is ";
        if (state === true) {
          this.isEnabled = state;
          this.f(this.levels.info, [msg + "enabled"]);
        } else {
          this.f(this.levels.info, [msg + "disabled"]);
          this.isEnabled = state;
        }
        return this.isEnabled;
    });

    /** Getter/Setter for echo to jaxer log */
    Console.prototype.__defineGetter__("echo", function echo() {
        return this.echoToJaxerLog;
    });

    Console.prototype.__defineSetter__("echo", function echo(state) {
        var msg = "Jaxer Log echo is ";
        if (state === true) {
          this.echoToJaxerLog = state;
          this.f(this.levels.info, [msg + "enabled"]);
        } else {
          this.f(this.levels.info, [msg + "disabled"]);
          this.echoToJaxerLog = state;
        }
        return this.echoToJaxerLog;
    });

    /** Enable the console */
    Console.prototype.__defineSetter__("enabled", function enabled(state) {
        if (state === true) {
          this.isEnabled = state;
          this.f(this.levels.info, ["console is enabled"]);
        } else {
          this.f(this.levels.info, ["console is disabled"]);
          this.isEnabled = state;
        }
        return this.isEnabled;
    });

    /**
     * Methods to enable/disable the console
     */
    Console.prototype.enable = function enable() {
      this.enabled = true;
    };

    Console.prototype.disable = function disable() {
      this.enabled = false;
    };

    /** Get the User Agent header from the client */
    Console.prototype.__defineGetter__("userAgent", function userAgent() {
        return Jaxer.request.headers["User-Agent"];
    });

    /** Does the user agent have FirePHP installed?
     *
     * The official FirePHP library checks the version, etc., but this just
     * checks if "FirePHP" is in the user agent string
     */
    Console.prototype.__defineGetter__("hasFirePHP", function()   {
        return this.userAgent.match("FirePHP") !== null;
    });

    /** Notify the user that the method called is not implemented */
    Console.prototype.__noSuchMethod__ = function __noSuchMethod__(id,args) {
        this.f(this.levels.warn, ["console." + id + "() is not implemented"]);
    };

    Jaxer.console = new Console();
    Jaxer.Log.trace("*** Jaxer.console.js attached");
})();

