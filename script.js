/* ============================================
   PRO ALGORITHM - Landing Page JavaScript
   ============================================ */

/* Contact form: API URL and key (must match server CONTACT_FROM_LOADING_PAGE_KEY) */
const CONTACT_API = {
    // url: 'https://fleet360-server-1069352823739.me-west1.run.app/contact',
    url: 'http://localhost:8181/contact',
    key: 'YXdlc29tZUB0b3JvLmNvLmls'
};

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initHamburger();
    initCounters();
    initAOS();
    initParticles();
    initBackToTop();
    initLangToggle();
    initSmoothScroll();
    initContactForm();
    initActiveNav();
});

/* ---------- Navbar Scroll Effect ---------- */
function initNavbar() {
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        lastScroll = currentScroll;
    });
}

/* ---------- Hamburger Menu ---------- */
function initHamburger() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'mobile-overlay';
    document.body.appendChild(overlay);

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });

    overlay.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Close menu on link click
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
}

/* ---------- Counter Animation ---------- */
function initCounters() {
    const counters = document.querySelectorAll('.stat-number');
    let hasAnimated = false;

    function animateCounters() {
        if (hasAnimated) return;

        const statsSection = document.getElementById('statistics');
        const rect = statsSection.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        if (rect.top < windowHeight * 0.85 && rect.bottom > 0) {
            hasAnimated = true;
            counters.forEach(counter => {
                const target = parseInt(counter.getAttribute('data-target'));
                const prefix = counter.getAttribute('data-prefix') || '';
                const suffix = counter.getAttribute('data-suffix') || '';
                const duration = 2000;
                const startTime = performance.now();

                function easeOutExpo(t) {
                    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
                }

                function updateCounter(currentTime) {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const easedProgress = easeOutExpo(progress);
                    const current = Math.floor(easedProgress * target);

                    counter.textContent = prefix + current.toLocaleString() + suffix;

                    if (progress < 1) {
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = prefix + target.toLocaleString() + suffix;
                    }
                }

                requestAnimationFrame(updateCounter);
            });
        }
    }

    window.addEventListener('scroll', animateCounters);
    animateCounters(); // Check on load
}

/* ---------- Custom AOS (Animate On Scroll) ---------- */
function initAOS() {
    const elements = document.querySelectorAll('[data-aos]');

    function checkAOS() {
        const windowHeight = window.innerHeight;

        elements.forEach(el => {
            if (el.classList.contains('aos-animate')) return; // Already animated

            const rect = el.getBoundingClientRect();
            const delay = parseInt(el.getAttribute('data-aos-delay')) || 0;

            // Trigger when element top is within viewport (with 15% buffer below)
            // OR element has already been scrolled past (top is above viewport)
            if (rect.top < windowHeight * 1.15 || rect.bottom < windowHeight) {
                setTimeout(() => {
                    el.classList.add('aos-animate');
                }, delay);
            }
        });
    }

    window.addEventListener('scroll', checkAOS, { passive: true });
    window.addEventListener('resize', checkAOS, { passive: true });
    // Check multiple times on load for reliability
    checkAOS();
    setTimeout(checkAOS, 100);
    setTimeout(checkAOS, 300);
    setTimeout(checkAOS, 600);
}

/* ---------- Hero Particles ---------- */
function initParticles() {
    const container = document.getElementById('heroParticles');
    if (!container) return;

    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'hero-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.width = (Math.random() * 4 + 2) + 'px';
        particle.style.height = particle.style.width;
        particle.style.animationDuration = (Math.random() * 6 + 4) + 's';
        particle.style.animationDelay = (Math.random() * 4) + 's';
        particle.style.opacity = Math.random() * 0.4 + 0.1;

        // Random color - primary or accent
        if (Math.random() > 0.6) {
            particle.style.background = '#6c5ce7';
        }

        container.appendChild(particle);
    }
}

/* ---------- Back to Top ---------- */
function initBackToTop() {
    const btn = document.getElementById('backToTop');

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 500) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/* ---------- Language Toggle ---------- */
function initLangToggle() {
    const btn = document.getElementById('langToggle');
    const html = document.documentElement;
    let currentLang = 'he';

    btn.addEventListener('click', () => {
        currentLang = currentLang === 'he' ? 'en' : 'he';

        html.setAttribute('lang', currentLang);
        html.setAttribute('dir', currentLang === 'he' ? 'rtl' : 'ltr');

        // Update body font
        document.body.style.fontFamily = currentLang === 'he'
            ? "'Heebo', sans-serif"
            : "'Inter', sans-serif";

        // Toggle button text
        btn.querySelector('.lang-he').style.display = currentLang === 'he' ? '' : 'none';
        btn.querySelector('.lang-en').style.display = currentLang === 'en' ? '' : 'none';

        // Update all data-he/data-en elements
        document.querySelectorAll('[data-he][data-en]').forEach(el => {
            const text = el.getAttribute(`data-${currentLang}`);
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = text;
            } else {
                el.innerHTML = text;
            }
        });
    });
}

/* ---------- Smooth Scroll ---------- */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = 80;
                const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });
}

/* ---------- Contact Form ---------- */
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;

        btn.textContent = document.documentElement.lang === 'en' ? 'Sending...' : 'שולח...';
        btn.disabled = true;
        btn.style.opacity = '0.7';

        const payload = {
            name: form.querySelector('#name').value.trim(),
            phone: form.querySelector('#phone').value.trim(),
            email: form.querySelector('#email').value.trim()
        };

        try {
            const res = await fetch(CONTACT_API.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-contact-key': CONTACT_API.key
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                const msg = data?.message || (document.documentElement.lang === 'en' ? 'Something went wrong' : 'משהו השתבש');
                throw new Error(msg);
            }

            btn.textContent = document.documentElement.lang === 'en' ? 'Sent!' : 'נשלח!';
            btn.style.background = 'linear-gradient(135deg, #00b894, #00d4aa)';

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.background = '';
                form.reset();
            }, 2000);
        } catch (err) {
            btn.innerHTML = originalText;
            btn.disabled = false;
            btn.style.opacity = '1';
            alert(err.message);
        }
    });
}

/* ---------- Active Nav Link on Scroll ---------- */
function initActiveNav() {
    const navLinks = document.querySelectorAll('.nav-links a');
    // Map section IDs to their corresponding nav link hash
    const sectionMap = {
        'hero': '#hero',
        'statistics': '#hero',
        'about': '#about',
        'services': '#services',
        'team': '#services',
        'testimonials': '#testimonials',
        'projects': '#projects',
        'contact': '#contact'
    };

    function updateActiveNav() {
        const scrollPos = window.pageYOffset;
        let activeHash = '#hero';

        // Find the current section based on scroll position
        const allSections = document.querySelectorAll('section[id]');
        allSections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            if (scrollPos >= sectionTop) {
                const id = section.getAttribute('id');
                if (sectionMap[id]) {
                    activeHash = sectionMap[id];
                }
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === activeHash) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', updateActiveNav);
    updateActiveNav();
}
