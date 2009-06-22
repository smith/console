
Overview
--------

For an introduction please see [here] [Console].

The purpose of this fork is to:

  * Reorganize the code and directory layout according to the [ServerJS] [] standard
  * Integrate the [wildfire JS library] [WildfireJSLib] used in the FirePHP extension to receive messages
  * Enhance the wildfire JS library to:
    * Reorganize the code and directory layout according to the [ServerJS] [] standard
    * Add support for sending messages
    * Add support for defining and validating message structures using JSON Schema
    * Add support for the complete firebug console API
  * Add support for logging from [Jack] [] & [Narwhal] []

The resulting library will be used in [FireWidgets] [].


  [Console]:        http://nlsmith.com/projects/console/   "http://nlsmith.com/projects/console/"
  [ServerJS]:       https://wiki.mozilla.org/ServerJS      "https://wiki.mozilla.org/ServerJS"
  [WildfireJSLib]:  http://code.google.com/p/firephp/source/browse/#svn/branches/FirefoxExtension-0.3/chrome/content/firephp/Wildfire  "http://code.google.com/p/firephp/source/browse/"
  [Jack]:           http://jackjs.org/                     "http://jackjs.org/"
  [Narwhal]:        http://narwhaljs.org/                  "http://narwhaljs.org/"   
  [FireWidgets]:    http://code.google.com/p/firewidgets/  "http://code.google.com/p/firewidgets/"


Repository Layout
-----------------

    /library/console/           The core console implementation
    /library/console/platform/  Platform-specific console wrappers
    /library/wildfire/          Out-of-band communication library
    /docs/                      Documentation
