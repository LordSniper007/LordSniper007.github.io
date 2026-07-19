const releaseEndpoint = 'updates/stable.json'
const historyEndpoint = 'updates/history.json'

document.querySelector('#year').textContent = new Date().getFullYear()

function formatReleaseDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Release date unavailable'
  return new Intl.DateTimeFormat('en', {
    year: 'numeric', month: 'short', day: 'numeric'
  }).format(date)
}

function getReleaseEntries(history, latestRelease) {
  const entries = Array.isArray(history?.releases) ? history.releases : []
  if (entries.length) return entries
  return latestRelease ? [latestRelease] : []
}

function renderReleaseTimeline(releases, latestVersion) {
  const timeline = document.querySelector('#release-timeline')
  if (!timeline) return

  timeline.replaceChildren()
  if (!releases.length) {
    const empty = document.createElement('p')
    empty.className = 'release-empty'
    empty.textContent = 'Release history will appear here after the first published build.'
    timeline.append(empty)
    return
  }

  releases.forEach((release, index) => {
    const entry = document.createElement('article')
    entry.className = 'release-entry'

    const date = document.createElement('time')
    date.className = 'release-date'
    date.dateTime = release.publishedAt || ''
    date.textContent = formatReleaseDate(release.publishedAt)

    const version = document.createElement('div')
    version.className = 'release-version'
    version.append(`v${release.version || '—'}`)
    if (index === 0 || release.version === latestVersion) {
      const badge = document.createElement('small')
      badge.textContent = 'LATEST'
      version.append(badge)
    }

    const notes = document.createElement('ul')
    notes.className = 'release-notes'
    const noteItems = Array.isArray(release.notes) && release.notes.length
      ? release.notes
      : ['Maintenance release']
    noteItems.forEach(note => {
      const item = document.createElement('li')
      item.textContent = note
      notes.append(item)
    })

    entry.append(date, version, notes)
    timeline.append(entry)
  })
}

function hydrateDownloadLinks(data) {
  const primary = document.querySelector('#download-button')
  const secondary = document.querySelector('#download-button-secondary')
  const statusTitle = document.querySelector('#download-status-title')
  const statusCopy = document.querySelector('#download-status-copy')
  const installer = data?.installer || {}
  const url = installer.url
  const version = data?.version
  const fileName = installer.fileName || 'VoidTools-Setup.exe'

  if (!url) return
  for (const button of [primary, secondary]) {
    if (!button) continue
    button.href = url
    button.setAttribute('download', fileName)
  }
  if (primary) primary.querySelector('span').textContent = version ? `Download VoidTools ${version}` : 'Download for Windows'
  if (statusTitle) statusTitle.textContent = version ? `VoidTools ${version}` : 'Latest release'
  if (statusCopy) {
    statusCopy.textContent = Array.isArray(data.notes) && data.notes.length
      ? data.notes.slice(0, 2).join(' · ')
      : 'Stable Windows installer ready to download.'
  }
}

async function loadReleaseData() {
  let latestRelease = null
  try {
    const response = await fetch(releaseEndpoint, { cache: 'no-store' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    latestRelease = await response.json()
    hydrateDownloadLinks(latestRelease)
  } catch {
    // The static GitHub Releases link remains available when the manifest is offline.
  }

  try {
    const response = await fetch(historyEndpoint, { cache: 'no-store' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const history = await response.json()
    renderReleaseTimeline(getReleaseEntries(history, latestRelease), latestRelease?.version)
  } catch {
    renderReleaseTimeline(latestRelease ? [latestRelease] : [], latestRelease?.version)
  }
}

function startWordAnimation() {
  const word = document.querySelector('#rotating-word')
  if (!word || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const phrases = ['Without the clutter.', 'Without the noise.', 'Without the friction.', 'Under your control.']
  let phraseIndex = 0
  let charIndex = phrases[0].length
  let deleting = false

  function tick() {
    const phrase = phrases[phraseIndex]

    if (!deleting && charIndex >= phrase.length) {
      deleting = true
      setTimeout(tick, 1900)
      return
    }

    if (deleting) {
      charIndex -= 1
      word.textContent = phrase.slice(0, charIndex)
      if (charIndex === 0) {
        deleting = false
        phraseIndex = (phraseIndex + 1) % phrases.length
        setTimeout(tick, 260)
        return
      }
      setTimeout(tick, 31)
      return
    }

    charIndex += 1
    word.textContent = phrase.slice(0, charIndex)
    setTimeout(tick, 48)
  }

  setTimeout(tick, 1900)
}

function celebrateDownload(event) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const link = event.currentTarget
  const destination = link.href
  if (!destination) return

  event.preventDefault()
  const colors = ['#ab8cff', '#d2c5ff', '#87e7bd', '#ffffff', '#6e52cc']
  const buttonBounds = link.getBoundingClientRect()
  const hasPointerPosition = event.clientX !== 0 || event.clientY !== 0
  const originX = hasPointerPosition ? event.clientX : buttonBounds.left + buttonBounds.width / 2
  const originY = hasPointerPosition ? event.clientY : buttonBounds.top + buttonBounds.height / 2
  const layer = document.createElement('div')
  layer.className = 'confetti-layer'
  layer.setAttribute('aria-hidden', 'true')

  for (let index = 0; index < 72; index += 1) {
    const piece = document.createElement('i')
    piece.className = 'confetti-piece'
    piece.style.left = `${originX}px`
    piece.style.top = `${originY}px`
    piece.style.backgroundColor = colors[index % colors.length]
    piece.style.setProperty('--drift', `${(Math.random() - .5) * 38}vw`)
    piece.style.setProperty('--drop', `${18 + Math.random() * 48}vh`)
    piece.style.setProperty('--turn', `${Math.round((Math.random() - .5) * 1080)}deg`)
    piece.style.animationDelay = `${Math.random() * 100}ms`
    layer.append(piece)
  }

  document.body.append(layer)
  window.setTimeout(() => window.location.assign(destination), 620)
  window.setTimeout(() => layer.remove(), 1800)
}

document.querySelectorAll('#download-button, #download-button-secondary').forEach(button => {
  button.addEventListener('click', celebrateDownload)
})

loadReleaseData()
startWordAnimation()
