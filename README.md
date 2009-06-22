
Overview
--------

For an introduction please see [here] [].

The purpose of this fork is to:

  * Reorganize the code and directory layout
  * Integrate the wildfire JS library used in the FirePHP extension to receive messages
  * Enhance the wildfire JS library to:
    * Add support for sending messages
    * Add support for defining and validating message structures using JSON Schema
    * Add support for the complete firebug console API

The resulting library will be used in [FireWidgets] [].


  [Console]:     http://nlsmith.com/projects/console/   "http://nlsmith.com/projects/console/"
  [FireWidgets]: http://code.google.com/p/firewidgets/  "http://code.google.com/p/firewidgets/"


Repository Layout
-----------------

    /library/console/           The core console implementation
    /library/console/platform/  Platform-specific console wrappers
    /library/wildfire/          Out-of-band communication library
    /docs/                      Documentation
