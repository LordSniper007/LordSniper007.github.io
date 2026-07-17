document.querySelector('#year').textContent = new Date().getFullYear()

async function hydrateDownloadLinks() {
  const primary = document.querySelector('#download-button')
  const secondary = document.querySelector('#download-button-secondary')
  const meta = document.querySelector('#download-meta')
  const statusTitle = document.querySelector('#download-status-title')
  const statusCopy = document.querySelector('#download-status-copy')

  if (!primary && !secondary) return

  try {
    const response = await fetch('/updates/stable.json', { cache: 'no-store' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const data = await response.json()
    const installer = data?.installer || {}
    const url = installer.url
    const version = data?.version
    const fileName = installer.fileName || 'VoidTools-Setup.exe'
    const sizeMb = typeof installer.size === 'number'
      ? (installer.size / (1024 * 1024)).toFixed(1)
      : null

    if (!url) throw new Error('Missing installer url')

    for (const button of [primary, secondary]) {
      if (!button) continue
      button.href = url
      button.setAttribute('download', fileName)
    }

    if (primary) {
      primary.textContent = version
        ? `Download VoidTools ${version}`
        : 'Download for Windows'
    }

    if (meta) {
      const parts = []
      if (version) parts.push(`Version ${version}`)
      if (sizeMb) parts.push(`${sizeMb} MB`)
      parts.push('Windows x64')
      meta.textContent = parts.join(' · ')
      meta.hidden = false
    }

    if (statusTitle && version) {
      statusTitle.textContent = `Latest release · v${version}`
    }

    if (statusCopy) {
      const notes = Array.isArray(data.notes) && data.notes.length
        ? data.notes.join(' · ')
        : 'Stable Windows installer ready to download.'
      statusCopy.textContent = notes
    }
  } catch {
    // Keep the static /releases/latest fallback already present in the HTML.
  }
}

hydrateDownloadLinks()
