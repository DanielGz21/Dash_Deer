// assets/theme-toggle.js

const body = document.body;
const themeToggle = document.getElementById('themeToggle');

if (themeToggle) {
  const themeIcon = themeToggle.querySelector('i');
  const savedTheme = localStorage.getItem('theme') || 'light';
  body.classList.add(`theme-${savedTheme}`);
  if (savedTheme === 'dark') themeIcon.classList.replace('fa-moon', 'fa-sun');

  themeToggle.addEventListener('click', () => {
    const isDark = body.classList.toggle('theme-dark');
    body.classList.toggle('theme-light');
    themeIcon.classList.toggle('fa-moon');
    themeIcon.classList.toggle('fa-sun');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
}
