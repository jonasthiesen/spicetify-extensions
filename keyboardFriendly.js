// @ts-check

// NAME: Keyboard Friendly
// AUTHOR: jonasthiesen
// DESCRIPTION: Make Spotify much more keyboard friendly

/// <reference path="./globals.d.ts" />

(function KeyboardFriendly() {
  /*********************************
   * WAIT FOR DEPENDENCIES TO LOAD *
   *********************************/

  const dependencies = [
    Spicetify.Keyboard,
  ]

  if (dependencies.filter(d => !d).length > 0) {
    setTimeout(KeyboardFriendly, 1000)
    return
  }

  /*************
   * EXTENTION *
   *************/

  const LOOKUP_INTERVAL = 100
  const RETRIES = 5

  const targetNode = document.getElementById('view-content')
  const config = { attributes: true, childList: true, subtree: true };

  function callback(mutationList) {
    for (const mutation of mutationList) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-app-uri') {
        let retryCount = 0
        const interval = setInterval(() => {
          try {
            retryCount = retryCount + 1
            if (retryCount > RETRIES) {
              clearInterval(interval)
            }

            const container = document.querySelector('iframe.active').contentDocument
            const firstRow = container.querySelector('tr[tabindex="0"]')

            if (firstRow != null) {
              firstRow.focus()
              clearInterval(interval)
            }
          } catch (error) {
            clearInterval(interval)
          }
        }, LOOKUP_INTERVAL)
      }
    }
  }

  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
})();
