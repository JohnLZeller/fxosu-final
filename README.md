# FxOSU Final Requirements Demo - FxOSUService

# Overview

I used [PhoneNumberService.js](http://mxr.mozilla.org/mozilla-central/source/dom/phonenumberutils/PhoneNumberService.js) and [PhoneNumberService.manifest](http://mxr.mozilla.org/mozilla-central/source/dom/phonenumberutils/PhoneNumberService.manifest) as a base. I then rewrote all of the PhoneNumberService stuff into my own name, FxOSUService.

Here is the [diff of mozilla-central with my changes](https://github.com/JohnLZeller/fxosu-midterm/blob/master/prototype.diff) to [mozilla-central](http://hg.mozilla.org/mozilla-central/).

It is currently working for the following platforms:
* Firefox Desktop
* B2G Desktop (untested)
* B2G Device (untested)
* Firefox for Android (untested)

# How to Build w/ Changes
Pull down this repo, then cd into the mozilla-central (m-c) repo that you've already pulled down. Once in the m-c repo, run the command 'hg import path/to/prototype.diff' and that will apply the changes. Then when you run './mach build' it will build with the new changes!

Once it is done building Firefox Desktop, you can launch it and proceed to the next step.

# How to Use
Once you've built and launched your new Firefox, you can open the console and get access to the API via navigator.mozFxOSUService and the following commands are available:
* navigator.mozFxOSUService.batteryLevel();
* navigator.mozFxOSUService.batteryCharging();
* navigator.mozFxOSUService.recentRxTx();
* navigator.mozFxOSUService.latencyInfo();
* navigator.mozFxOSUService.showLatencyInfo(); # Use this to grab data
* navigator.mozFxOSUService.connectionType();
* navigator.mozFxOSUService.connectionUp();
* navigator.mozFxOSUService.connectionQuality();
* navigator.mozFxOSUService.mozIsNowGood();

Additionally, there is a simple demo html page [here](https://github.com/JohnLZeller/fxosu-midterm/blob/master/demo.html).

## Changes I've Made

I have added the following files:
* dom/fxosu/[FxOSUService.js](https://github.com/JohnLZeller/fxosu-midterm/blob/master/dom/fxosu/FxOSUService.js)
* dom/fxosu/[FxOSUService.manifest](https://github.com/JohnLZeller/fxosu-midterm/blob/master/dom/fxosu/FxOSUService.manifest)
* dom/fxosu/[moz.build](https://github.com/JohnLZeller/fxosu-midterm/blob/master/dom/fxosu/moz.build)
* dom/webidl/[FxOSUService.webidl](https://github.com/JohnLZeller/fxosu-midterm/blob/master/dom/webidl/FxOSUService.webidl)

And I have modified these files:
* b2g/installer/[package-manifest.in](https://github.com/JohnLZeller/fxosu-midterm/blob/master/b2g/installer/package-manifest.in#L366-L367) (Lines 366 to 376)
* browser/installer/[package-manifest.in](https://github.com/JohnLZeller/fxosu-midterm/blob/master/browser/installer/package-manifest.in#L561-L562) (Lines 561 to 562)
* mobile/android/installer/[package-manifest.in](https://github.com/JohnLZeller/fxosu-midterm/blob/master/mobile/android/installer/package-manifest.in#L303-L304) (Lines 303 to 304)
* dom/apps/[PermissionsTable.jsm](https://github.com/JohnLZeller/fxosu-midterm/blob/master/dom/apps/PermissionsTable.jsm#L218-L223) (Lines 218 to 223)
* dom/webidl/[moz.build](https://github.com/JohnLZeller/fxosu-midterm/blob/master/dom/webidl/moz.build#L146) (Line 146)
* dom/[moz.build](https://github.com/JohnLZeller/fxosu-midterm/blob/master/dom/moz.build#L55) (Line 55)

## Requirements
### Week 10 (March 9th to 13th)
1. :heavy_check_mark: The API should be written in C++ or JavaScript.
2. :x: The API should integrate with existing efforts wherever possible.
3. :heavy_check_mark: The API should be developer configurable, to provide a level of certainty about network quality
4. :heavy_check_mark: Write a Web IDL specification for the API implementation.
5. :x: The API should take into account the type of network connection, whether it be wifi, cellular data, etc
6. :heavy_check_mark: The API should be able to access data about system load on the device in order to determine if the device can handle another task.
7. :heavy_check_mark: The API should be able to access data on the battery level of the device in order to determine if a task should be executed.
8. :x: The API should be able to access data about recent tx/rx data
9. :heavy_check_mark: The API should be able to access latency-related network information to determine if a task should be executed.
