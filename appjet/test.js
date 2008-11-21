/* appjet:version 0.1 */
// This is by no means a comprehensive test suite, just some examples that
// cover common cases.

import('lib-console');

console.time("t");

console.log("Hello world!");
console.log("Hello %s!", "world", 4, 4, 4);
console.log("Hello %d!", 4, "How", "gosit?");
console.log("Hello %i%d!", 4, 2);
console.info("Multiple", "strings", "separated", 6);
console.debug("Debug");
console.warn("Warn");
console.error("Error");

console.group("Unimplemented");
console.assert();
console.dir();
console.dirxml();
console.profile();
console.profileEnd();
console.count();
console.table();
console.dump();
console.groupEnd();

console.log({ a : 1, b : 2 });

try {
throw new Error("Oh no!");
} catch (e) { console.error(e); }

console.timeEnd("t");

console.disable();
console.log("This", "should", "not", "show", "up");
console.enable();
console.log("This", "should", "be", "here");

// Try a really long message
var s = []
s.length = 5000;
//    console.log(s);
