// @ts-check

// NAME: Quick Switcher
// AUTHOR: jonasthiesen
// DESCRIPTION: Quickly switch between different playlists

/// <reference path="./globals.d.ts" />

(function QuickSwitcher() {
  // We need to wait until the dependencies are actually ready.
  const dependencies = [
    Spicetify.Keyboard,
  ]

  // If we have a missing dependency, try again a bit later.
  if (dependencies.filter(d => !d).length > 0) {
    setTimeout(QuickSwitcher, 1000)
    return
  }

  let memory = {
    quickSwitcherInDOM: false,
    quickSwitcherOpen: false,
  }

  function toggleQuickSwitcher() {
    const QUICK_SWITCHER_ID = '#quick-switcher'
    const PLAYLIST_SELECTOR = '.SidebarListItemLink'

    const playlistNodes = [...document.querySelectorAll(PLAYLIST_SELECTOR)]
    const playlists = playlistNodes
      .map(x => ({ title: x.textContent, id: x.getAttribute('href') }))

    let quickSwitcher = null
    let quickSwitcherInput = null
    if (!memory.quickSwitcherInDOM) {
      quickSwitcher = document.createElement('div')
      quickSwitcher.id = QUICK_SWITCHER_ID.replace('#', '')
      addStyle(quickSwitcher, {
        position: 'absolute',
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: '100%',
        height: '100%',
        zIndex: '100'
      })

      quickSwitcherInput = document.createElement('input')
      addStyle(quickSwitcherInput, {
        position: 'absolute',
        width: '300px',
        padding: '10px',
        top: '150px',
        left: '0',
        right: '0',
        marginLeft: 'auto',
        marginRight: 'auto',
        borderRadius: '10px',
      })

      quickSwitcher.appendChild(quickSwitcherInput)
      document.body.appendChild(quickSwitcher)

      memory.quickSwitcherInDOM = true
    } else {
      quickSwitcher = document.querySelector(QUICK_SWITCHER_ID)
      quickSwitcherInput = quickSwitcher.querySelector('input')
    }

    if (memory.quickSwitcherOpen) {
      addStyle(quickSwitcher, { display: 'none' })
      memory.quickSwitcherOpen = false
    } else {
      addStyle(quickSwitcher, { display: 'initial' })
      quickSwitcherInput.focus()
      quickSwitcherInput.select()
      memory.quickSwitcherOpen = true

      function filterList(needle, haystack) {
        let searchTerm = needle.toLowerCase()
        let results = haystack.filter(({ title }) => title.toLowerCase().includes(searchTerm))
        return results
      }

      function filterPlaylistsInSearch(event) {
        let searchTerm = event.target.value
        let results = filterList(searchTerm, playlists)

        playlistNodes.map(x => addStyle(x, { backgroundColor: 'inherit', zIndex: 'auto' }))
        playlistNodes.filter(x => results.map(x => x.id).includes(x.getAttribute('href')) && searchTerm.length > 0).map(x => addStyle(x, { backgroundColor: '#ff0000 !important', zIndex: '9999 !important' }))
      }

      function handleSelectPlaylist(event) {
        if (event.key === 'Enter') {
          let searchTerm = event.target.value
          let results = filterList(searchTerm, playlists)

          if (results.length > 0) {
            let el = document.createElement('a')
            el.setAttribute('href', results[0].id)
            document.body.appendChild(el)
            el.click()
            document.body.removeChild(el)
            closeQuickSwitcher()
          }
        }
      }

      quickSwitcherInput.addEventListener('input', filterPlaylistsInSearch)
      quickSwitcherInput.addEventListener('keydown', handleSelectPlaylist)

      quickSwitcher.addEventListener('keydown', function _listener({ key }) {
        if (key === 'Escape') {
          closeQuickSwitcher(_listener)
        }
      })

      function closeQuickSwitcher(_listener) {
        addStyle(quickSwitcher, { display: 'none' })
        memory.quickSwitcherOpen = false
        quickSwitcher.removeEventListener('keydown', _listener)
        quickSwitcherInput.removeEventListener('input', filterPlaylistsInSearch)
        quickSwitcherInput.removeEventListener('keydown', handleSelectPlaylist)
        playlistNodes.map(x => addStyle(x, { backgroundColor: 'inherit', zIndex: 'auto' }))
      }
    }
  }

  registerBind({
    keyName: 'K',
    cmd: true,
  }, toggleQuickSwitcher)

  /**
   * Register a keyboard shortcut.
   */
  function registerBind({ keyName, cmd = false, shift = false, alt = false }, callback) {
    if (typeof keyName === "string") {
      keyName = Spicetify.Keyboard.KEYS[keyName];
    }

    Spicetify.Keyboard.registerShortcut({
      key: keyName,
      ctrl: cmd,
      shift,
      alt,
    }, callback);
  }

  /**
   * Add inline styling to the Element.
   * 
   * @param {Element} element The element the styles should be applied to.
   * @param {object} styles The styles to be applied.
   */
  function addStyle(element, styles) {
    let stylesString = ''
    let originalStyles = fromStylesString(element.getAttribute('style'))

    let mergedStyles = { ...originalStyles, ...styles}

    for (let k in mergedStyles) {
      let key = k.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`)
      stylesString += `${key}:${mergedStyles[k]};`
    }

    element.setAttribute('style', stylesString)
  }

  /**
   * Converts inline styling to an object.
   * 
   * @param {string} str The styles tring to convert to an object.
   * 
   * @example
   * "position:absolute;width:20px;" => { position: 'absolute', width: '20px' }
   */
  function fromStylesString(str) {
    if (str == null) return {}

    return str
      .split(';')
      .filter(removeEmpty)
      .reduce((acc, cur) => {
        let [k, val] = cur.split(':')
        let key = k.replace(/([-_][a-z])/ig, (g) => `${g[1].toUpperCase()}`)
        return { ...acc, [key]: val }
      }, {})
  }

  function removeEmpty(x) {
    return x && x.length
  }
})();
