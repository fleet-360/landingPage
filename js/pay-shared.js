/* ============================================
   PRO ALGORITHM - Shared payment helpers
   Used by /payment.html and /payment-link.html
   ============================================ */

window.ProAlgoPay = (function () {

    /* Payment API (Grow / Meshulam via cars-server).
       Route: POST /grow/proAlgorithm/createPaymentLink  -> { success, paymentUrl } */
    const PAYMENT_API = {
        url: 'https://api.fleet360.co.il/grow/proAlgorithm/createPaymentLink'
        //url: 'http://localhost:8181/grow/proAlgorithm/createPaymentLink'
    };

    const MIN_SUM = 1;
    const MAX_SUM = 500000;
    const MAX_PAYMENTS = 12;

    const TEXTS = {
        defaultDescription: { he: 'תשלום ל-Pro Algorithm', en: 'Payment to Pro Algorithm' },
        errAmount: {
            he: 'יש להזין סכום תקין (בין 1 ל-500,000 ש"ח)',
            en: 'Please enter a valid amount (between 1 and 500,000 ILS)'
        },
        errName: { he: 'יש להזין שם מלא', en: 'Please enter a full name' },
        errPhone: { he: 'יש להזין מספר טלפון נייד תקין', en: 'Please enter a valid mobile phone number' },
        errEmail: { he: 'יש להזין כתובת אימייל תקינה', en: 'Please enter a valid email address' },
        errDescription: { he: 'יש להזין תיאור לתשלום', en: 'Please enter a payment description' },
        errServer: {
            he: 'אירעה שגיאה ביצירת התשלום. נסו שוב או צרו איתנו קשר.',
            en: 'Something went wrong while creating the payment. Please try again or contact us.'
        },
        redirecting: { he: 'מעבירים אותך לתשלום...', en: 'Redirecting to checkout...' },
        opening: { he: 'פותח את חלון התשלום...', en: 'Opening the payment window...' },
        creating: { he: 'יוצר קישור...', en: 'Creating link...' },
        errPaymentFailed: {
            he: 'התשלום לא אושר. בדקו את פרטי הכרטיס ונסו שוב.',
            en: 'The payment was declined. Check your card details and try again.'
        },
        errPaymentSystem: {
            he: 'שגיאה במערכת התשלומים. נסו שוב בעוד רגע.',
            en: 'The payment system returned an error. Please try again in a moment.'
        },
        errCheckoutUnavailable: {
            he: 'לא הצלחנו לפתוח את חלון התשלום. רעננו את הדף ונסו שוב.',
            en: 'We could not open the payment window. Please refresh the page and try again.'
        },
        onePayment: { he: 'תשלום אחד', en: 'Single payment' },
        nPayments: { he: 'עד {n} תשלומים', en: 'Up to {n} payments' },
        errInvalidLink: {
            he: 'קישור התשלום אינו תקין. בקשו קישור חדש או צרו איתנו קשר.',
            en: 'This payment link is not valid. Please ask for a new one or contact us.'
        },
        errNoLink: {
            he: 'לא נמצאו פרטי תשלום. יש לפתוח את קישור התשלום שנשלח אליכם.',
            en: 'No payment details found. Please open the payment link you were sent.'
        },
        errExpiredLink: {
            he: 'תוקף קישור התשלום פג. בקשו קישור חדש או צרו איתנו קשר.',
            en: 'This payment link has expired. Please ask for a new one or contact us.'
        },
        errNotConfigured: {
            he: 'עמוד זה אינו מוגדר. יש להגדיר את משתני הסביבה של התשלומים.',
            en: 'This page is not configured. The payment environment variables are missing.'
        }
    };

    /* Written at build time by scripts/build-pay-config.js.
       Absent when the site was deployed without the payment env vars. */
    function getConfig() {
        return window.PAY_CONFIG || { configured: false, allowPlainParams: false };
    }

    function getLang() {
        return document.documentElement.lang === 'en' ? 'en' : 'he';
    }

    function t(key, vars) {
        const entry = TEXTS[key];
        let text = entry ? entry[getLang()] : key;
        if (vars) {
            Object.keys(vars).forEach(k => {
                text = text.replace('{' + k + '}', vars[k]);
            });
        }
        return text;
    }

    /* ---------- Formatting & parsing ---------- */

    /* "1,234.5" / "₪1234" / " 1234 " -> 1234.5 ; returns NaN when unparsable */
    function parseAmount(raw) {
        if (raw === null || raw === undefined) return NaN;
        const cleaned = String(raw).replace(/[^\d.]/g, '');
        if (!cleaned) return NaN;
        const num = Number(cleaned);
        if (!isFinite(num)) return NaN;
        return Math.round(num * 100) / 100;
    }

    function isValidAmount(num) {
        return isFinite(num) && num >= MIN_SUM && num <= MAX_SUM;
    }

    function formatAmount(num) {
        if (!isFinite(num)) return '';
        return num.toLocaleString('en-US', {
            minimumFractionDigits: num % 1 === 0 ? 0 : 2,
            maximumFractionDigits: 2
        });
    }

    /* Israeli mobile: 05XXXXXXXX. Accepts +972/972 prefixes and separators. */
    function normalizePhone(raw) {
        let digits = String(raw || '').replace(/[^\d+]/g, '');
        digits = digits.replace(/^\+?972/, '0');
        digits = digits.replace(/\D/g, '');
        return digits;
    }

    function isValidPhone(raw) {
        const phone = normalizePhone(raw);
        return /^0\d{8,9}$/.test(phone);
    }

    function isValidEmail(raw) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(raw || '').trim());
    }

    /* ---------- API ---------- */

    /* Creates a Grow payment process and returns the hosted checkout URL. */
    async function createPaymentLink({ fullName, email, phone, sum, description, paymentNumber, businessTaxId }) {
        const res = await fetch(PAYMENT_API.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: String(fullName || '').trim(),
                email: String(email || '').trim(),
                phone: normalizePhone(phone),
                sum: Number(sum),
                description: String(description || '').trim(),
                paymentNumber: Number(paymentNumber) || 1,
                businessTaxId: String(businessTaxId || '').trim()
            })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.success || !data.paymentUrl) {
            throw new Error(data.error || t('errServer'));
        }

        /* createPaymentProcess answers with { processId, processToken, authCode }.
           There is no `url`: only the sdkWallet variant, which calls Meshulam's
           createPaymentLink instead, returns a hosted page address. So authCode
           is what we require, and url is used only when it happens to be there. */
        const payload = typeof data.paymentUrl === 'string'
            ? { url: data.paymentUrl }
            : (data.paymentUrl || {});

        if (!payload.authCode && !payload.url) throw new Error(t('errServer'));

        return {
            authCode: payload.authCode || '',
            url: payload.url || '',
            processId: payload.processId,
            processToken: payload.processToken,
            raw: payload
        };
    }

    /* ---------- Page chrome (navbar / hamburger / language) ---------- */

    function applyLang(lang) {
        document.querySelectorAll('[data-he][data-en]').forEach(el => {
            const text = el.getAttribute('data-' + lang);
            if (text === null) return;
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = text;
            } else {
                el.innerHTML = text;
            }
        });
    }

    function initChrome(onLangChange) {
        const navbar = document.getElementById('navbar');
        if (navbar) {
            window.addEventListener('scroll', () => {
                navbar.classList.toggle('scrolled', window.pageYOffset > 50);
            }, { passive: true });
        }

        const hamburger = document.getElementById('hamburger');
        const navLinks = document.getElementById('navLinks');
        if (hamburger && navLinks) {
            const overlay = document.createElement('div');
            overlay.className = 'mobile-overlay';
            document.body.appendChild(overlay);

            const closeMenu = () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            };

            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navLinks.classList.toggle('active');
                overlay.classList.toggle('active');
                document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
            });
            overlay.addEventListener('click', closeMenu);
            navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
        }

        const btn = document.getElementById('langToggle');
        if (btn) {
            btn.addEventListener('click', () => {
                setLang(getLang() === 'he' ? 'en' : 'he', onLangChange);
            });
        }
    }

    function setLang(lang, onLangChange) {
        const html = document.documentElement;
        html.setAttribute('lang', lang);
        html.setAttribute('dir', lang === 'he' ? 'rtl' : 'ltr');
        document.body.style.fontFamily = lang === 'he' ? "'Heebo', sans-serif" : "'Inter', sans-serif";

        const btn = document.getElementById('langToggle');
        if (btn) {
            const he = btn.querySelector('.lang-he');
            const en = btn.querySelector('.lang-en');
            if (he) he.style.display = lang === 'he' ? '' : 'none';
            if (en) en.style.display = lang === 'en' ? '' : 'none';
        }

        applyLang(lang);
        if (typeof onLangChange === 'function') onLangChange(lang);
    }

    /* Fills a <select> with 1..MAX_PAYMENTS installment options. */
    function fillPaymentsSelect(select, selected) {
        if (!select) return;
        const value = Number(selected) || Number(select.value) || 1;
        select.innerHTML = '';
        for (let i = 1; i <= MAX_PAYMENTS; i++) {
            const option = document.createElement('option');
            option.value = String(i);
            option.textContent = i === 1 ? t('onePayment') : t('nPayments', { n: i });
            select.appendChild(option);
        }
        select.value = String(Math.min(Math.max(value, 1), MAX_PAYMENTS));
    }

    return {
        PAYMENT_API,
        MIN_SUM,
        MAX_SUM,
        MAX_PAYMENTS,
        getConfig,
        getLang,
        setLang,
        t,
        parseAmount,
        isValidAmount,
        formatAmount,
        normalizePhone,
        isValidPhone,
        isValidEmail,
        createPaymentLink,
        applyLang,
        initChrome,
        fillPaymentsSelect
    };
})();
