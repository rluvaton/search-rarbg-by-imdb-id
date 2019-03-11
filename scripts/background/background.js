// Enable chromereload by uncommenting this line:
// import 'chromereload/devonly'

(function () {
  'use strict';
  // this function is strict...

  chrome.runtime.onInstalled.addListener((details) => {
    console.log('previousVersion', details.previousVersion);
  });

  chrome.tabs.onUpdated.addListener((tabId) => {
    chrome.pageAction.show(tabId);
  });

// opens a communication port
  chrome.runtime.onConnect.addListener(function (port) {

    // listen for every message passing throw it
    port.onMessage.addListener(function (o) {

      // if the message comes from the popup
      if (o.from && o.from === 'popup') {

        if (o.code) {

          // inserts a script into your tab content
          chrome.tabs.executeScript(null, {
            // the script will click the button into the tab content
            code: "console.log('insert code');" + ' ' + o.code
          });
        }

        if (o.url) {
          if (o.relative) {
            window.location = o.url;
          } else {
            window.location.href = o.url;
          }
        }
      }
    });
  });

  console.log(`'Allo 'Allo! Event Page for Page Action`);

}());
