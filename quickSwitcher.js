// @ts-check

// NAME: Quick Switcher
// AUTHOR: jonasthiesen
// DESCRIPTION: Quickly switch between different playlists

/// <reference path="./globals.d.ts" />

(async function QuickSwitcher() {

  /*********************************
   * WAIT FOR DEPENDENCIES TO LOAD *
   *********************************/

  const dependencies = [
    window['SpicetifyModuleLoader'],
    Spicetify.Keyboard,
    Spicetify.LocalStorage,
  ]

  if (dependencies.filter(d => !d).length > 0) {
    setTimeout(QuickSwitcher, 1000)
    return
  }

  // Get the module loader
  const { use } = window['SpicetifyModuleLoader']

  /******************
   * CORE EXTENSION *
   ******************/

  const { take } = await use('ramda')
  const Fuse = (await use('fuse.js')).default

  let memory = {
    quickSwitcherInDOM: false,
    quickSwitcherOpen: false,
    selectedSearchResult: 0,
    searchResultCount: 0,
    hasBeenOpened: false,
  }

  let domRefs = {
    searchResults: [],
  }

  function toggleQuickSwitcher() {
    const QUICK_SWITCHER_ID = '#quick-switcher'
    const QUICK_SWITCHER_RESULT_CONTAINER_ID = '#quick-switcher-result-container'
    const PLAYLIST_SELECTOR = '.SidebarListItemLink'

    const playlistNodes = [...document.querySelectorAll(PLAYLIST_SELECTOR)]

    var playlists = [
      {"title": "Home", "id": "spotify:app:home"},
      {"title": "Browse", "id": "spotify:app:browse"},
      {"title": "Radio", "id": "spotify:app:radio-hub"},
      {"title": "Made For You", "id": "spotify:app:made-for-you"},
      {"title": "Recently Played", "id": "spotify:app:recently-played"},
      {"title": "Liked Songs", "id": "spotify:app:collection-songs"},
      {"title": "Albums", "id": "spotify:app:collection:albums"},
      {"title": "Artists", "id": "spotify:app:collection:artists"},
      {"title": "Podcasts", "id": "spotify:app:collection:podcasts"},
    ];

    new Promise((resolve, reject) => {
      Spicetify.CosmosAPI.resolver.get("sp://core-playlist/v1/rootlist", (err, raw) => {
        const response = JSON.parse(raw._body);
        resolve(response);
      });
    }).then(response => {
      const formatLink = (link) => ("spotify:app:playlist:"+link.split(':').pop());
      playlists = playlists.concat(response.rows.map(row => ({ title: row.name, id: formatLink(row.link) })));
    });

    let quickSwitcher = null
    let quickSwitcherInput = null
    let quickSwitcherResultContainer = null
    if (!memory.quickSwitcherInDOM) {
      // Qucik switcher container
      quickSwitcher = document.createElement('div')
      quickSwitcher.id = QUICK_SWITCHER_ID.replace('#', '')
      addStyle(quickSwitcher, {
        position: 'absolute',
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: '100%',
        height: '100%',
        zIndex: '100'
      })

      // Quick switcher input
      quickSwitcherInput = document.createElement('input')
      addStyle(quickSwitcherInput, {
        position: 'absolute',
        border: 'none',
        outline: 0,
        fontSize: '20px',
        width: '400px',
        padding: '16px',
        top: '150px',
        left: '0',
        right: '0',
        marginLeft: 'auto',
        marginRight: 'auto',
        borderRadius: '3px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.45)',
      })

      // Quick switcher result container
      quickSwitcherResultContainer = document.createElement('div')
      quickSwitcherResultContainer.id = QUICK_SWITCHER_RESULT_CONTAINER_ID.replace('#', '')
      addStyle(quickSwitcherResultContainer, {
        position: 'absolute',
        flexDirection: 'column',
        display: 'none',
        backgroundColor: '#fff',
        fontSize: '16px',
        width: '400px',
        overflow: 'hidden',
        top: '212px',
        left: '0',
        right: '0',
        marginLeft: 'auto',
        marginRight: 'auto',
        borderRadius: '3px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.45)',
      })

      quickSwitcher.appendChild(quickSwitcherInput)
      quickSwitcher.appendChild(quickSwitcherResultContainer)
      document.body.appendChild(quickSwitcher)

      memory.quickSwitcherInDOM = true
    } else {
      quickSwitcher = document.querySelector(QUICK_SWITCHER_ID)
      quickSwitcherInput = quickSwitcher.querySelector('input')
      quickSwitcherResultContainer = quickSwitcher.querySelector(QUICK_SWITCHER_RESULT_CONTAINER_ID)
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
        return fuzzy(haystack)
          .search(needle)
          .map(({ item }) => item)
      }

      function filterPlaylistsInSearch(event) {
        memory.selectedSearchResult = 0

        let results = []
        if (event) {
          let searchTerm = event.target.value
          results = take(10, filterList(searchTerm, playlists))
        }

        if (results.length === 0) {
          results = take(10, getRecentlySearched())
        }

        memory.searchResultCount = results.length

        // Reset styles
        playlistNodes.map(x => addStyle(x, { backgroundColor: 'inherit', zIndex: 'auto' }))

        if (results.length === 0) {
          addStyle(quickSwitcherResultContainer, { display: 'none' })
        } else {
          addStyle(quickSwitcherResultContainer, { display: 'flex' })
        }

        // Reset search results (remove all children)
        quickSwitcherResultContainer.innerHTML = ''

        domRefs.searchResults = results.map((result, index) => {
          let searchResult = document.createElement('li')
          searchResult.innerText = result.title

          addStyle(searchResult, { padding: '12px', color: '#000', listStyleType: 'none' })

          if (index === memory.selectedSearchResult) {
            addStyle(searchResult, { backgroundColor: '#2E66F4', color: '#fff' })
          }

          quickSwitcherResultContainer.appendChild(searchResult)

          return searchResult
        })
      }

      function handleSelectPlaylist(event) {
        if (event.key === 'Enter') {
          let results = []
          if (event.target.value) {
            let searchTerm = event.target.value
            results = filterList(searchTerm, playlists)
          } else {
            results = getRecentlySearched()
          }

          if (results.length > 0) {
            let el = document.createElement('a')
            el.setAttribute('href', results[memory.selectedSearchResult].id)
            document.body.appendChild(el)
            el.click()
            document.body.removeChild(el)
            closeQuickSwitcher()

            storeRecentlySearched(results[memory.selectedSearchResult])
          }
        }

        const currentSelected = memory.selectedSearchResult
        if (event.key === 'ArrowDown') {
          if (memory.selectedSearchResult < memory.searchResultCount - 1) {
            memory.selectedSearchResult++
          } else {
            memory.selectedSearchResult = 0
          }
        }

        if (event.key === 'ArrowUp') {
          if (memory.selectedSearchResult > 0) {
            memory.selectedSearchResult--
          } else {
            memory.selectedSearchResult = memory.searchResultCount - 1
          }
        }

        if (currentSelected !== memory.selectedSearchResult) {
          domRefs.searchResults.forEach(domNode => addStyle(domNode, { backgroundColor: '#fff', color: '#000' }))
          addStyle(domRefs.searchResults[memory.selectedSearchResult], { backgroundColor: '#2E66F4', color: '#fff' })
        }
      }

      if (!memory.hasBeenOpened) {
        filterPlaylistsInSearch()
        memory.hasBeenOpened = true
      }
      quickSwitcherInput.addEventListener('input', filterPlaylistsInSearch)
      quickSwitcherInput.addEventListener('keydown', handleSelectPlaylist)

      // @ts-ignore
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

  /*************************
   * REGISTER KEY BINDINGS *
   *************************/

  registerBind({
    keyName: 'K',
    cmd: true,
  }, toggleQuickSwitcher)

  /*********************
   * UTILITY FUNCTIONS *
   *********************/

  /**
   * Register a keyboard shortcut.
   */
  function registerBind({ keyName, cmd = false, shift = false, alt = false }, callback) {
    if (typeof keyName === 'string') {
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

  /**
   * Fuzzy search on the title of the playlist/album/etc.
   * 
   * @param {any[]} playlists The playlists to fuzzy search.
   * @returns Fuse instance (use .search()) to actually perform the search.
   */
  function fuzzy(playlists) {
    // Threshold of 0.4 feels about right, default is 0.6.
    // 0.0 = perfect match; 1.0 = match on everything.
    return new Fuse(playlists, { keys: ['title'], threshold: 0.4 })
  }

  function removeDuplicates(array, key) {
    let lookup = {}

    return array.filter(obj => {
      if (!lookup[obj[key]]) {
        lookup[obj[key]] = true
        return true
      }
      return false
    })
}

  /**
   * Retrieve recently searched from LocalStorage.
   */
  function getRecentlySearched() {
    return JSON.parse(Spicetify.LocalStorage.get(
      "RecentlySearched"
    )) || []
  }

  /**
   * Store recently search in LocalStorage.
   */
  function storeRecentlySearched(recentlySearched) {
    const uniqueSearches = removeDuplicates([recentlySearched, ...getRecentlySearched()], 'title')

    Spicetify.LocalStorage.set(
      "RecentlySearched",
      JSON.stringify(uniqueSearches)
    );
  }
})();
