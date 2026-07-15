document.querySelector('#year').textContent = new Date().getFullYear()

const hero = document.querySelector('.hero')
const stage = document.querySelector('.void-stage')
const rail = document.querySelector('.void-rail-progress')

hero?.addEventListener('pointermove', event => {
  const rect = hero.getBoundingClientRect()
  const x = (event.clientX - rect.left) / rect.width - 0.5
  const y = (event.clientY - rect.top) / rect.height - 0.5
  stage.style.transform = `translate3d(${x * 12}px, ${y * 10}px, 0) rotateX(${-y * 2}deg) rotateY(${x * 2}deg)`
})

hero?.addEventListener('pointerleave', () => {
  stage.style.transform = ''
})

const updateRail = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight
  const progress = max > 0 ? window.scrollY / max : 0
  rail.style.height = `${Math.min(100, Math.max(0, progress * 100))}%`
}

updateRail()
window.addEventListener('scroll', updateRail, { passive: true })
