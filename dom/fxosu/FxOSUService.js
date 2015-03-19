/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const DEBUG = false;
function debug(s) { dump("-*- FxOSUService.js: " + s + "\n"); }

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
var lastMemEventRes = 0;
var lastMemEventExplicit = 0;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/DOMRequestHelper.jsm");
//Cu.import("resource://gre/modules/Battery.jsm"); // Fails on Desktop

XPCOMUtils.defineLazyServiceGetter(this, "cpmm",
                                   "@mozilla.org/childprocessmessagemanager;1",
                                   "nsIMessageSender");

// Component interface import factory
function importFactory(contractIdentification, interfaceName) {
  try {
    return Cc[contractIdentification].createInstance(interfaceName);
  }
  catch(err) {
    try {
      return Cc[contractIdentification].getService(interfaceName);
    } catch(e) {
      return null;
    }
  }
}

// Import components
var networkLinkService = importFactory("@mozilla.org/network/network-link-service;1", Ci.nsINetworkLinkService);
var networkStatsManager = importFactory("@mozilla.org/networkStatsManager;1", Ci.nsIDOMNetworkStatsManager);
var memoryReportManager = importFactory("@mozilla.org/memory-reporter-manager;1", Ci.nsIMemoryReporterManager);

// FxOSUService

function FxOSUService()
{
  if (DEBUG) debug("Constructor");
}

FxOSUService.prototype = {
  __proto__: DOMRequestIpcHelper.prototype,

  // Here be magic. We've declared ourselves as providing the
  // nsIDOMGlobalPropertyInitializer interface, and are registered in the
  // "JavaScript-global-property" category in the XPCOM category manager. This
  // means that for newly created windows, XPCOM will createinstance this
  // object, and then call init, passing in the window for which we need to
  // provide an instance. We then initialize ourselves and return the webidl
  // version of this object using the webidl-provided _create method, which
  // XPCOM will then duly expose as a property value on the window. All this
  // indirection is necessary because webidl does not (yet) support statics
  // (bug 863952). See bug 926712 for more details about this implementation.
  init: function(window) {
    this._window = window;
    Services.obs.addObserver(this, "xpcom-shutdown", false);
    Services.obs.addObserver(this, "memory-pressure", false);
  },

  //private function which is called when low either of the above observers is notified
  //In our case it either removes the observers on shutdown or records a memory-pressure event
  //PRIVATE
  observe: function mem_obs(aSubject, aTopic, aData) 
  {
      if(aTopic == "xpcom-shutdown"){
        Services.obs.removeObserver(this, "xpcom-shutdown", false);
        Services.obs.removeObserver(this, "memory-pressure", false);
      }
      else if(aTopic == "memory-pressure"){
        var usage = this.memoryManager();
        var explicit = " Explicit: " + usage[0].toString();
        var resident = " Resident: " + usage[1].toString();
        lastMemEventExplicit = usage[0];
        lastMemEventRes = usage[1];
        this._window.console.log("Memory Pressure Event Happened! " + aData + explicit + resident);
      }
  },  

  //Callable function which displays the current memory usage.  Is automatically called when a low-memory event occurs 
  memoryManager: function() {
      this._window.console.log("Resident: " + lastMemEventRes + " Explicit: " + lastMemEventExplicit);
      return [memoryReportManager.explicit, 
              memoryReportManager.resident];
  },

    memoryManager: function() {
      this._window.console.log("Resident: " + lastMemEventRes + " Explicit: " + lastMemEventExplicit);
      return [memoryReportManager.explicit, 
              memoryReportManager.resident];
  },

  // Logic of XPCOM compontent
  batteryLevel: function() { // This will be false when device is 100%, more than likely
    return this._window.navigator.battery.level;
  },

  batteryCharging: function() {
    return this._window.navigator.battery.charging;
  },

  recentRxTx: function() {
    if (networkStatsManager) {
      return false; // Treat this as functionality is not present
    } else {
      return true; // Do something useful
    }
  },

  latencyInfo: function() {
      var t = this._window.performance.timing;
      var timeInfo = {};
      timeInfo.navigation_type = this._window.performance.navigation.type;
      timeInfo.navigation_redirectCount = this._window.performance.navigation.redirectCount;
      timeInfo.prep = t.redirectStart - t.navigationStart;
      timeInfo.redirect = t.redirectEnd - t.redirectStart;
      timeInfo.unload = t.unloadEventEnd - t.unloadEventStart;
      timeInfo.r_to_f = t.fetchStart - t.redirectEnd;
      timeInfo.fetch = t.domainLookupStart - t.fetchStart;
      timeInfo.dnslookup = t.domainLookupEnd - t.domainLookupStart;
      timeInfo.d_to_c = t.connectStart - t.domainLookupEnd;
      timeInfo.connection = t.connectEnd - t.connectStart;
      timeInfo.c_to_req = t.requestStart - t.connectEnd;
      timeInfo.request = t.responseStart - t.requestStart;
      timeInfo.response = t.responseEnd - t.responseStart;
      timeInfo.res_to_dom = t.domLoading - t.responseEnd;
      timeInfo.domLoading = t.domInteractive - t.domLoading;
      timeInfo.domInteractive = t.domContentLoadedEventStart - t.domInteractive;
      timeInfo.domContentLoaded = t.domContentLoadedEventEnd - t.domContentLoadedEventStart;
      timeInfo.domComplete = t.domComplete - t.domContentLoadedEventEnd;
      timeInfo.dom_to_onload = t.loadEventStart - t.domComplete;
      timeInfo.loadEvent = t.loadEventEnd - t.loadEventStart;
      timeInfo.networkLatency = t.responseEnd - t.fetchStart;
      timeInfo.pageLoadingTime = t.loadEventEnd - t.responseEnd;
      timeInfo.totalTimeElapsed = t.loadEventEnd - t.navigationStart;
    return timeInfo;
  },

  showLatencyInfo: function() {
    var timeInfo = this.latencyInfo();
    var summary = "navigation_redirectCount: " + timeInfo.navigation_type + "\n" +
    "navigation_redirectCount: " + timeInfo.navigation_redirectCount + "\n" +
    "prep: " + timeInfo.prep + "\n" +
    "redirect: " + timeInfo.redirect + "\n" +
    "unload: " + timeInfo.unload + "\n" +
    "r_to_f: " + timeInfo.r_to_f + "\n" +
    "fetch: " + timeInfo.fetch + "\n" +
    "dnslookup: " + timeInfo.dnslookup + "\n" +
    "d_to_c: " + timeInfo.d_to_c + "\n" +
    "connection: " + timeInfo.connection + "\n" +
    "c_to_req: " + timeInfo.c_to_req + "\n" +
    "request: " + timeInfo.request + "\n" +
    "response: " + timeInfo.response + "\n" +
    "res_to_dom: " + timeInfo.res_to_dom + "\n" +
    "domLoading: " + timeInfo.domLoading + "\n" +
    "domInteractive: " + timeInfo.domInteractive + "\n" +
    "domContentLoaded: " + timeInfo.domContentLoaded + "\n" +
    "domComplete: " + timeInfo.domComplete + "\n" +
    "dom_to_onload: " + timeInfo.dom_to_onload + "\n" +
    "loadEvent: " + timeInfo.loadEvent + "\n" +
    "networkLatency: " + timeInfo.networkLatency + "\n" +
    "pageLoadingTime: " + timeInfo.pageLoadingTime + "\n" +
    "totalTimeElapsed: " + timeInfo.totalTimeElapsed;

    return summary;
  },

  // Non-Requirement functionality
  connectionType: function() {
    // Note: As of Gecko 8.0, all Operating Systems currently return LINK_TYPE_UNKNOWN. 
    //       Android support was backed out due to perceived security concerns, see bug 691054.
    return networkLinkService.linkType; // Returns 0 for UNKNOWN
  },

  connectionUp: function() {
    if (networkLinkService.linkStatusKnown) {
      return networkLinkService.isLinkUp;
    } else {
      return true; // so we don't block
    }
  },

  connectionQuality: function() {
    // Return 0 to 1
    // Possibly Useful
      // navigator.connection.bandwidth;
      // navigator.connection.metered; // pay-per-use
      
    switch (this.connectionType()) {
      case networkLinkService.LINK_TYPE_UNKNOWN:
        return 1.00; // so we don't block
      case networkLinkService.LINK_TYPE_ETHERNET:
        break;
      case networkLinkService.LINK_TYPE_USB:
        break;
      case networkLinkService.LINK_TYPE_WIFI:
        break;
      case networkLinkService.LINK_TYPE_WIMAX:
        break;
      case networkLinkService.LINK_TYPE_2G:
        break;
      case networkLinkService.LINK_TYPE_3G:
        break;
      case networkLinkService.LINK_TYPE_4G:
        break;
      default:
        return 1.00; // so we don't block
    }
  },

  mozIsNowGood: function(level, mustCharge) {
    level = typeof level !== 'undefined' ? level : 2;
    // Levels of certainty
      // 1 - High
      // 2 - Moderate
      // 3 - Low
    var batLev = this.batteryLevel();
    var batCha = this.batteryCharging();
    var rxTx = this.recentRxTx();
    var conUp = this.connectionUp();
    var conQual = this.connectionQuality();

    // Need internet connection
    if (!conUp) {
      return false;
    }
    if(mustCharge && !batCha){
      this._window.console.log("PLUG IN YOUR DEVICE YOU MUTANT");
      this._window.alert("PLUG IN YOUR DEVICE YOU MUTANT, GIFF POWER");
      return false;
    }

    // Certainty level differences
    switch(parseInt(level)) {
      case 1:
        this._window.console.log("Level parsed as 1");
        // if battery is > 90%, go
        // elif battery is >70% and < 90%, but is charging, go
        // else, nogo
        if (batLev > 0.9) {
          if (conQual > 0.5) {
            return true;
          } else {
            return false;
          }
        } else if ((0.7 < batLev < 0.9) && batCha) {
          if (conQual > 0.5) {
            return true;
          } else {
            return false;
          }
          return true;
        } else {
          if (conQual > 0.7) {
            return true;
          } else if ((conQual > 0.5) && batCha) {
            return true;
          } else {
            return false;
          }
        }
        break;
      case 2:
        this._window.console.log("Level parsed as 2");
        // if battery is > 60%, go
        // elif battery is >30% and < 60%, but is charging, go
        // else, nogo
        if (batLev > 0.6) {
          if (conQual > 0.3) {
            return true;
          } else {
            return false;
          }
        } else if ((0.3 < batLev < 0.6) && batCha) {
          if (conQual > 0.3) {
            return true;
          } else {
            return false;
          }
          return true;
        } else {
          if (conQual > 0.5) {
            return true;
          } else if ((conQual > 0.3) && batCha) {
            return true;
          } else {
            return false;
          }
        }
        break;
      case 3:
        this._window.console.log("Level parsed as 3");
        // if battery is >30%, go
        // elif battery is >10% and < 30%, but is charging, go
        // else, nogo
        if (batLev > 0.3) {
          if (conQual > 0.3) {
            return true;
          } else {
            return false;
          }
        } else if ((0.1 < batLev < 0.3) && batCha) {
          if (conQual > 0.3) {
            return true;
          } else {
            return false;
          }
          return true;
        } else {
          if (conQual > 0.5) {
            return true;
          } else if ((conQual > 0.3) && batCha) {
            return true;
          } else {
            return false;
          }
        }
        break;
      default:
        return true; // so we don't block
    }
  },

  classID : Components.ID("{9c72ce25-06d6-4fb8-ae9c-431652fce848}"),
  contractID : "@mozilla.org/fxosuPrototypeService;1",
  QueryInterface : XPCOMUtils.generateQI([Ci.nsISupports,
                                          Ci.nsIObserver,
                                          Ci.nsIDOMGlobalPropertyInitializer]),
}

this.NSGetFactory = XPCOMUtils.generateNSGetFactory([FxOSUService]);
