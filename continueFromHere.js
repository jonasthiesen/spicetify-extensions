// @ts-check

// NAME: Continue From Here
// AUTHOR: jonasthiesen
// DESCRIPTION: Waits until current song is finished before playing.

/// <reference path="./globals.d.ts" />

(function ContinueFromHere() {
  const CONTINUE_FROM_HERE_TEXT = 'Continue from here'

  // We need to wait until the dependencies are actually ready.
  const dependencies = [
    Spicetify,
  ]

  // If we have a missing dependency, try again a bit later.
  if (dependencies.filter(d => !d).length > 0) {
    setTimeout(ContinueFromHere, 1000)
    return
  }

  const cntxMenu = new Spicetify.ContextMenu.Item(
    CONTINUE_FROM_HERE_TEXT,
    handleContinueFromHere,
    // @ts-ignore
    shouldAddContextMenu, 
  )

  cntxMenu.register();

  function handleContinueFromHere(uris) {
    const [nextSong] = uris
    const button = getPlayTrackButton(nextSong)

    Spicetify.Player.addEventListener('songchange', function _listener() {
      button.click()

      Spicetify.Player.removeEventListener('songchange', _listener)
    })
  }

  /**
   * Only accept one track or artist URI
   * @param {string[]} uris 
   * @returns {boolean}
   */
  function shouldAddContextMenu(uris) {
    if (uris.length > 1) {
        return false
    }

    const [uri] = uris
    const uriObj = Spicetify.URI.fromString(uri)

    if (uriObj.type === Spicetify.URI.Type.TRACK) {
        this.name = CONTINUE_FROM_HERE_TEXT
        return true
    }

    return false
  }

  function getPlayTrackButton(trackId) {
    const container = 'iframe.active'
    const trackTable = '.tracklist-playlist'
    const trackRow = `[data-uri="${trackId}"]`
    const trackButton = '.tl-play button'

    console.log('IFRAMES', document.querySelectorAll(container))

    return document
      .querySelector(container)
      .contentDocument
      .querySelector(trackTable)
      .querySelector(trackRow)
      .querySelector(trackButton)
  }
})();
