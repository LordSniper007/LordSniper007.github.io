(() => {
  const RELEASE_URLS = [
    'https://raw.githubusercontent.com/LordSniper007/LordSniper007.github.io/main/updates/stable.json',
    'https://voidtools.software/updates/stable.json'
  ]
  const HISTORY_URLS = [
    'https://raw.githubusercontent.com/LordSniper007/LordSniper007.github.io/main/updates/history.json',
    'https://voidtools.software/updates/history.json'
  ]
  const RELEASE_FALLBACK = 'https://github.com/LordSniper007/LordSniper007.github.io/releases/download/v2.1.7/VoidTools-Setup-v2.1.7-win64.exe'
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  const year = document.querySelector('#year')
  if (year) year.textContent = new Date().getFullYear()

  class InteractiveDotField {
    constructor(canvas) {
      this.canvas = canvas
      this.context = canvas.getContext('2d', { alpha: true })
      this.width = 0
      this.height = 0
      this.points = []
      this.waves = []
      this.frame = 0
      this.lastWaveAt = 0
      this.lastWavePoint = { x: -1000, y: -1000 }
      this.pointer = {
        x: window.innerWidth / 2,
        y: window.innerHeight * .42,
        targetX: window.innerWidth / 2,
        targetY: window.innerHeight * .42,
        energy: 0,
        active: false
      }

      this.resize = this.resize.bind(this)
      this.draw = this.draw.bind(this)
      this.onPointerMove = this.onPointerMove.bind(this)
      this.onPointerDown = this.onPointerDown.bind(this)
      this.onPointerLeave = this.onPointerLeave.bind(this)

      this.resize()
      window.addEventListener('resize', this.resize, { passive: true })
      window.addEventListener('pointermove', this.onPointerMove, { passive: true })
      window.addEventListener('pointerdown', this.onPointerDown, { passive: true })
      document.documentElement.addEventListener('pointerleave', this.onPointerLeave, { passive: true })

      if (reduceMotion.matches) {
        this.drawStatic()
      } else {
        this.frame = requestAnimationFrame(this.draw)
      }
    }

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      this.width = window.innerWidth
      this.height = window.innerHeight
      this.canvas.width = Math.round(this.width * dpr)
      this.canvas.height = Math.round(this.height * dpr)
      this.canvas.style.width = `${this.width}px`
      this.canvas.style.height = `${this.height}px`
      this.context.setTransform(dpr, 0, 0, dpr, 0, 0)
      this.buildGrid()
      if (reduceMotion.matches) this.drawStatic()
    }

    buildGrid() {
      const targetPointCount = 7200
      const spacing = Math.max(18, Math.ceil(Math.sqrt((this.width * this.height) / targetPointCount)))
      const offsetX = (this.width % spacing) / 2
      const offsetY = (this.height % spacing) / 2
      this.points = []

      for (let y = offsetY; y <= this.height; y += spacing) {
        for (let x = offsetX; x <= this.width; x += spacing) {
          this.points.push({ x, y })
        }
      }
    }

    onPointerMove(event) {
      if (event.pointerType === 'touch' && event.buttons === 0) return

      this.pointer.targetX = event.clientX
      this.pointer.targetY = event.clientY
      this.pointer.active = true

      const now = performance.now()
      const travelled = Math.hypot(
        event.clientX - this.lastWavePoint.x,
        event.clientY - this.lastWavePoint.y
      )

      if (travelled > 22 && now - this.lastWaveAt > 48) {
        this.addWave(event.clientX, event.clientY, .9, 1080)
        this.lastWaveAt = now
        this.lastWavePoint = { x: event.clientX, y: event.clientY }
      }
    }

    onPointerDown(event) {
      this.pointer.targetX = event.clientX
      this.pointer.targetY = event.clientY
      this.pointer.active = true
      this.addWave(event.clientX, event.clientY, 2.1, 1500)
    }

    onPointerLeave() {
      this.pointer.active = false
    }

    addWave(x, y, strength, lifetime) {
      this.waves.push({
        x,
        y,
        born: performance.now(),
        strength,
        lifetime
      })
      if (this.waves.length > 16) this.waves.shift()
    }

    getWaveInfluence(point, now) {
      let offsetX = 0
      let offsetY = 0
      let light = 0

      for (const wave of this.waves) {
        const age = now - wave.born
        if (age >= wave.lifetime) continue

        const fromWaveX = point.x - wave.x
        const fromWaveY = point.y - wave.y
        const distance = Math.hypot(fromWaveX, fromWaveY) || 1
        const radius = age * .215
        const ringDistance = distance - radius
        const ring = Math.exp(-(ringDistance * ringDistance) / (2 * 25 * 25))
        const fade = 1 - age / wave.lifetime
        const pulse = ring * fade * wave.strength

        offsetX += (fromWaveX / distance) * pulse * 5.2
        offsetY += (fromWaveY / distance) * pulse * 5.2
        light = Math.max(light, pulse)
      }

      return { offsetX, offsetY, light }
    }

    drawStatic() {
      const context = this.context
      context.clearRect(0, 0, this.width, this.height)
      context.fillStyle = 'rgba(136, 143, 158, .17)'
      context.beginPath()
      for (const point of this.points) {
        context.moveTo(point.x + .8, point.y)
        context.arc(point.x, point.y, .8, 0, Math.PI * 2)
      }
      context.fill()
    }

    draw(now) {
      const context = this.context
      const pointer = this.pointer
      pointer.x += (pointer.targetX - pointer.x) * .18
      pointer.y += (pointer.targetY - pointer.y) * .18
      pointer.energy += ((pointer.active ? 1 : 0) - pointer.energy) * .09

      this.waves = this.waves.filter(wave => now - wave.born < wave.lifetime)
      context.clearRect(0, 0, this.width, this.height)

      const basePoints = []
      const activePoints = []
      const pointerRadius = 190

      for (const point of this.points) {
        const toPointerX = pointer.x - point.x
        const toPointerY = pointer.y - point.y
        const pointerDistance = Math.hypot(toPointerX, toPointerY) || 1
        const pointerFalloff = Math.max(0, 1 - pointerDistance / pointerRadius) * pointer.energy
        const attraction = pointerFalloff * pointerFalloff * 11
        const wave = this.getWaveInfluence(point, now)
        const x = point.x + (toPointerX / pointerDistance) * attraction + wave.offsetX
        const y = point.y + (toPointerY / pointerDistance) * attraction + wave.offsetY
        const activity = Math.max(pointerFalloff, wave.light * .7)

        if (activity > .018) {
          activePoints.push({ x, y, activity, distance: pointerDistance, baseX: point.x, baseY: point.y })
        } else {
          basePoints.push({ x, y })
        }
      }

      context.fillStyle = 'rgba(132, 139, 153, .16)'
      context.beginPath()
      for (const point of basePoints) {
        context.moveTo(point.x + .78, point.y)
        context.arc(point.x, point.y, .78, 0, Math.PI * 2)
      }
      context.fill()

      for (const point of activePoints) {
        const angle = Math.atan2(point.baseY - pointer.y, point.baseX - pointer.x)
        const hue = (190 + (angle + Math.PI) / (Math.PI * 2) * 105 + point.distance * .08) % 360
        const alpha = Math.min(.92, .22 + point.activity * .68)
        const radius = .8 + Math.min(1, point.activity) * .55
        context.fillStyle = `hsla(${hue}, 82%, 68%, ${alpha})`
        context.beginPath()
        context.arc(point.x, point.y, radius, 0, Math.PI * 2)
        context.fill()
      }

      this.frame = requestAnimationFrame(this.draw)
    }
  }

  const canvas = document.querySelector('#dot-field')
  const dotField = canvas ? new InteractiveDotField(canvas) : null

  function activateVoidEasterEgg(event) {
    if (document.body.dataset.voidActive === 'true') return

    const trigger = event.currentTarget
    const origin = trigger.getBoundingClientRect()
    const originX = origin.left + origin.width / 2
    const originY = origin.top + origin.height / 2
    const sourceWindow = trigger.closest('.product-frame, .release-window')

    document.body.dataset.voidActive = 'true'
    document.body.classList.add('void-awake')
    sourceWindow?.classList.add('is-void-pulsing')

    const overlay = document.createElement('div')
    overlay.className = 'void-easter-egg'
    overlay.setAttribute('role', 'status')
    overlay.setAttribute('aria-live', 'polite')
    overlay.style.setProperty('--void-x', `${originX}px`)
    overlay.style.setProperty('--void-y', `${originY}px`)

    const message = document.createElement('div')
    message.className = 'void-message'

    const sigil = document.createElement('div')
    sigil.className = 'void-sigil'
    sigil.setAttribute('aria-hidden', 'true')

    const label = document.createElement('span')
    label.textContent = 'VOID MODE // 000'

    const title = document.createElement('h2')
    title.textContent = 'You found the Void.'

    const note = document.createElement('p')
    note.textContent = 'Nothing really closes here.'

    message.append(sigil, label, title, note)
    overlay.append(message)
    document.body.append(overlay)

    dotField?.addWave(originX, originY, 3.4, 2000)
    window.setTimeout(() => dotField?.addWave(window.innerWidth / 2, window.innerHeight / 2, 2.6, 1800), 480)
    window.requestAnimationFrame(() => overlay.classList.add('is-active'))

    window.setTimeout(() => sourceWindow?.classList.remove('is-void-pulsing'), 1200)
    window.setTimeout(() => overlay.classList.remove('is-active'), 3000)
    window.setTimeout(() => {
      overlay.remove()
      document.body.classList.remove('void-awake')
      delete document.body.dataset.voidActive
    }, 3550)
  }

  document.querySelectorAll('.window-control-close').forEach(control => {
    control.addEventListener('click', activateVoidEasterEgg)
  })

  function formatDate(value) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Date unavailable'
    return new Intl.DateTimeFormat('en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  function renderReleaseHistory(releases) {
    const list = document.querySelector('#release-list')
    if (!list || !Array.isArray(releases) || !releases.length) return

    list.replaceChildren()
    releases.forEach((release, index) => {
      const row = document.createElement('article')
      row.className = `release-row${index === 0 ? ' is-latest' : ''}`

      const version = document.createElement('div')
      version.className = 'release-version'
      if (index === 0) {
        const badge = document.createElement('span')
        badge.textContent = 'Latest'
        version.append(badge)
      }

      const versionNumber = document.createElement('strong')
      versionNumber.textContent = `v${release.version || '—'}`
      version.append(versionNumber)

      const date = document.createElement('time')
      date.dateTime = release.publishedAt || ''
      date.textContent = formatDate(release.publishedAt)

      const description = document.createElement('p')
      const notes = Array.isArray(release.notes) ? release.notes : []
      description.textContent = notes.length ? notes.slice(0, 3).join(' · ') : 'Maintenance release'

      row.append(version, date, description)
      list.append(row)
    })

    list.setAttribute('aria-busy', 'false')
  }

  function hydrateLatestRelease(release) {
    if (!release) return
    const installer = release.installer || {}
    const version = release.version
    const url = installer.url || RELEASE_FALLBACK

    for (const button of document.querySelectorAll('.js-latest-download')) {
      button.href = url
      if (installer.fileName) button.setAttribute('download', installer.fileName)
    }

    const heroVersion = document.querySelector('#hero-version')
    if (version && heroVersion) heroVersion.textContent = `Latest v${version}`
  }

  async function fetchFirstJson(urls) {
    let lastError = null

    for (const url of urls) {
      try {
        const separator = url.includes('?') ? '&' : '?'
        const response = await fetch(`${url}${separator}t=${Date.now()}`, { cache: 'no-store' })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return { data: await response.json(), url }
      } catch (error) {
        lastError = error
      }
    }

    throw lastError || new Error('No release source available')
  }

  async function loadReleaseData() {
    const latestTask = fetchFirstJson(RELEASE_URLS)
      .then(result => hydrateLatestRelease(result.data))
      .catch(() => {
        // The visible fallback stays usable when the release endpoint is offline.
      })

    const releaseList = document.querySelector('#release-list')
    if (releaseList) {
      try {
        const historyResult = await fetchFirstJson(HISTORY_URLS)
        renderReleaseHistory(historyResult.data?.releases)
      } catch {
        releaseList.setAttribute('aria-busy', 'false')
      }
    }

    await latestTask
  }

  function startRevealAnimations() {
    const sections = document.querySelectorAll('.section-heading, .feature-list, .release-list, .discover-inner, .explore-hero-copy, .explore-feature, .tool-cluster, .explore-end')
    if (reduceMotion.matches || !('IntersectionObserver' in window)) return

    sections.forEach(section => section.classList.add('reveal'))
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      }
    }, { threshold: .12 })

    sections.forEach(section => observer.observe(section))
  }

  if (document.querySelector('#release-list, .js-latest-download')) {
    loadReleaseData()
  }
  startRevealAnimations()
})()
