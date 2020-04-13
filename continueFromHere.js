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
    const trackRow = getPlayTrackRow(nextSong)

    Spicetify.Player.addEventListener('songchange', function _listener() {
      const mouseEvent = new MouseEvent('dblclick', {
        view: window,
        bubbles: true,
        cancelable: true,
      })

      trackRow.dispatchEvent(mouseEvent)

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

  function getPlayTrackRow(trackId) {
    const container = 'iframe.active'
    const trackTable = '[class*="tracklist-"]'
    const trackRow = `[data-uri="${trackId}"]`

    const albumTable = '.Table__table'
    const albumRow = `[data-ta-uri="${trackId}"]`

    const documentContainer = document.querySelector(container)
    if (documentContainer == null) {
      console.log(document.querySelector(albumTable).querySelector(albumRow))
      return document
        .querySelector(albumTable)
        .querySelector(albumRow)
    }

    return documentContainer
      .contentDocument
      .querySelector(trackTable)
      .querySelector(trackRow)
  }
})();
