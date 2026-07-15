document.querySelector('#current-year').textContent = new Date().getFullYear()

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return
    entry.target.classList.add('visible')
    observer.unobserve(entry.target)
  })
}, { threshold: 0.12 })

document.querySelectorAll('.reveal').forEach(element => observer.observe(element))

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', event => {
    const target = document.querySelector(link.getAttribute('href'))
    if (!target) return
    event.preventDefault()
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
})
