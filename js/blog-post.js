/* Blog post page — loads content from blogs.json by data-slug */
(function () {
    const slug = document.body.dataset.slug;
    if (!slug) return;

    let currentLang = document.documentElement.lang || 'he';

    function getLang() {
        return document.documentElement.lang || currentLang;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function renderPost(post) {
        const lang = getLang();
        const container = document.getElementById('blogPostContent');
        if (!container) return;

        const title = post.title[lang];
        const paragraphs = post.content[lang];
        const imageAlt = title;

        let linksHtml = '';
        if (post.type === 'internal' && post.links) {
            linksHtml = '<div class="blog-post-links"><h3 data-he="קישורים רלוונטיים" data-en="Related Links">קישורים רלוונטיים</h3><ul>' +
                post.links.map(link =>
                    `<li><a href="${link.href}">${escapeHtml(link.label[lang])}</a></li>`
                ).join('') + '</ul></div>';
        }

        let ctaHtml = '';
        if (post.type === 'external' && post.externalUrl) {
            const ctaText = post.cta ? post.cta[lang] : (lang === 'he' ? 'בקרו באתר' : 'Visit Website');
            ctaHtml = `<a href="${post.externalUrl}" class="btn btn-primary btn-lg blog-post-cta" target="_blank" rel="noopener noreferrer">${escapeHtml(ctaText)} <i class="fas fa-external-link-alt"></i></a>`;
        }

        const imgSrc = post.image;
        const svgFallback = imgSrc.endsWith('.svg') ? '' : imgSrc.replace(/\.(jpg|jpeg|png|webp)$/i, '.svg');
        const imgHtml = `<div class="blog-post-hero-image">
            <img src="/${imgSrc}" alt="${escapeHtml(imageAlt)}" class="blog-post-img"
                onerror="if(this.dataset.fallback){this.src='/'+this.dataset.fallback;this.dataset.fallback='';}else{this.classList.add('hidden');this.nextElementSibling.classList.add('visible');}"
                data-fallback="${svgFallback}">
            <div class="blog-image-placeholder blog-post-placeholder"><i class="fas fa-image"></i><span data-he="הוסיפו תמונה" data-en="Add image">הוסיפו תמונה</span></div>
        </div>`;

        container.innerHTML = `
            ${imgHtml}
            <h1 class="blog-post-title">${title}</h1>
            <div class="blog-post-body">
                ${paragraphs.map(p => `<p>${p}</p>`).join('')}
            </div>
            ${linksHtml}
            ${ctaHtml}
            <a href="/#blog" class="blog-back-link" data-he="← חזרה לבלוג" data-en="← Back to Blog">← חזרה לבלוג</a>
        `;

        applyLangToNewElements();
    }

    function applyLangToNewElements() {
        const lang = getLang();
        document.querySelectorAll('[data-he][data-en]').forEach(el => {
            const text = el.getAttribute(`data-${lang}`);
            if (text) el.innerHTML = text;
        });
    }

    function initLangToggle() {
        const btn = document.getElementById('langToggle');
        if (!btn) return;

        btn.addEventListener('click', () => {
            currentLang = currentLang === 'he' ? 'en' : 'he';
            const html = document.documentElement;
            html.setAttribute('lang', currentLang);
            html.setAttribute('dir', currentLang === 'he' ? 'rtl' : 'ltr');
            document.body.style.fontFamily = currentLang === 'he' ? "'Heebo', sans-serif" : "'Inter', sans-serif";
            btn.querySelector('.lang-he').style.display = currentLang === 'he' ? '' : 'none';
            btn.querySelector('.lang-en').style.display = currentLang === 'en' ? '' : 'none';

            document.querySelectorAll('[data-he][data-en]').forEach(el => {
                const text = el.getAttribute(`data-${currentLang}`);
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = text;
                } else if (text) {
                    el.innerHTML = text;
                }
            });

            if (window.__blogPost) renderPost(window.__blogPost);
        });
    }

    function initNavbar() {
        const navbar = document.getElementById('navbar');
        if (!navbar) return;
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.pageYOffset > 50);
        });
    }

    function initHamburger() {
        const hamburger = document.getElementById('hamburger');
        const navLinks = document.getElementById('navLinks');
        if (!hamburger || !navLinks) return;

        const overlay = document.createElement('div');
        overlay.className = 'mobile-overlay';
        document.body.appendChild(overlay);

        function closeMenu() {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }

        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
            overlay.classList.toggle('active');
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
        });
        overlay.addEventListener('click', closeMenu);
        navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    }

    async function loadPost() {
        try {
            const res = await fetch('/content/blogs.json');
            const data = await res.json();
            const post = data.posts.find(p => p.slug === slug);
            if (!post) {
                document.getElementById('blogPostContent').innerHTML =
                    '<p data-he="המאמר לא נמצא." data-en="Article not found.">המאמר לא נמצא.</p>';
                return;
            }
            window.__blogPost = post;

            const lang = getLang();
            document.title = `${post.title[lang]} | Pro Algorithm`;
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) metaDesc.content = post.excerpt[lang];

            renderPost(post);
        } catch (err) {
            console.error('Failed to load blog post:', err);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        initNavbar();
        initHamburger();
        initLangToggle();
        loadPost();
    });
})();
