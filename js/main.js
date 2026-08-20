// ========================================
// 1. UTILITY FUNCTIONS
// ========================================

/**
 * Sanitize user input to prevent XSS attacks
 */
function sanitizeInput(input, type = 'text') {
    if (!input) return '';

    let sanitized = input
        .replace(/<[^>]*>/g, '')
        .replace(/[&<>"]/g, function (m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            if (m === '"') return '&quot;';
            return m;
        })
        .trim();

    // Type-specific validation
    switch (type) {
        case 'email':
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized)) return '';
            break;
        case 'url':
            try { new URL(sanitized); } catch (e) { return ''; }
            break;
        case 'text':
            sanitized = sanitized
                .replace(/javascript:/gi, '')
                .replace(/on\w+=/gi, '')
                .replace(/data:/gi, '');
            break;
    }
    return sanitized;
}

/**
 * Generate CSRF token
 */
function generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get or create CSRF token
 */
function getCSRFToken() {
    let token = sessionStorage.getItem('csrfToken');
    if (!token) {
        token = generateCSRFToken();
        sessionStorage.setItem('csrfToken', token);
    }
    return token;
}

/**
 * Validate CSRF token
 */
function validateCSRFToken(token) {
    return token === sessionStorage.getItem('csrfToken');
}

/**
 * Add CSRF token to all forms
 */
function addCSRFTokenToForms() {
    const token = getCSRFToken();
    document.querySelectorAll('form').forEach(form => {
        if (!form.querySelector('input[name="_csrf"]')) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = '_csrf';
            input.value = token;
            form.prepend(input);
        }
    });
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('cookieToast');
    const toastMessage = document.getElementById('cookieToastMessage');
    if (!toast || !toastMessage) return;

    toastMessage.textContent = message;
    toast.className = 'cookie-toast show';
    toast.style.borderLeft = type === 'success' ? '4px solid #34d399' : '4px solid #f87171';

    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ========================================
// 2. COOKIE CONSENT
// ========================================

(function initCookieConsent() {
    const COOKIE_KEY = 'cookiePreferences';

    // DOM refs
    const banner = document.getElementById('cookieConsent');
    const modal = document.getElementById('cookieModal');

    // Get saved preferences
    function getPreferences() {
        try {
            return JSON.parse(localStorage.getItem(COOKIE_KEY));
        } catch {
            return null;
        }
    }

    function savePreferences(prefs) {
        localStorage.setItem(COOKIE_KEY, JSON.stringify(prefs));
        applySettings(prefs);
        hideBanner();
        closeModal();
        showToast('Preferences saved successfully!');
    }

    function applySettings(prefs) {
        // Apply analytics
        if (typeof gtag !== 'undefined' && !prefs.analytics) {
            window['ga-disable-UA-XXXXXX-X'] = true;
        }
        // Apply marketing
        if (typeof fbq !== 'undefined' && !prefs.marketing) {
            // Disable FB pixel if needed
        }
        console.log('🍪 Cookie preferences applied:', prefs);
    }

    function hasConsent() { return getPreferences() !== null; }

    function showBanner() {
        if (!hasConsent() && banner) {
            banner.classList.add('show');
            banner.classList.remove('hidden');
        }
    }

    function hideBanner() {
        if (banner) {
            banner.classList.remove('show');
            banner.classList.add('hidden');
        }
    }

    function openModal() {
        if (!modal) return;
        const prefs = getPreferences();
        if (prefs) {
            document.getElementById('cookieFunctional').checked = prefs.functional !== false;
            document.getElementById('cookieAnalytics').checked = prefs.analytics !== false;
            document.getElementById('cookieMarketing').checked = prefs.marketing !== false;
        }
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        if (!modal) return;
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    function getCurrentPrefs() {
        return {
            essential: true,
            functional: document.getElementById('cookieFunctional')?.checked !== false,
            analytics: document.getElementById('cookieAnalytics')?.checked !== false,
            marketing: document.getElementById('cookieMarketing')?.checked !== false
        };
    }

    // --- Event listeners ---
    document.getElementById('cookieAcceptBtn')?.addEventListener('click', () => {
        savePreferences({ essential: true, functional: true, analytics: true, marketing: true });
    });

    document.getElementById('cookieDeclineBtn')?.addEventListener('click', () => {
        savePreferences({ essential: true, functional: false, analytics: false, marketing: false });
    });

    document.getElementById('cookiePreferencesBtn')?.addEventListener('click', openModal);

    document.getElementById('cookieModalAccept')?.addEventListener('click', () => {
        document.getElementById('cookieFunctional').checked = true;
        document.getElementById('cookieAnalytics').checked = true;
        document.getElementById('cookieMarketing').checked = true;
        savePreferences(getCurrentPrefs());
    });

    document.getElementById('cookieModalDecline')?.addEventListener('click', () => {
        document.getElementById('cookieFunctional').checked = false;
        document.getElementById('cookieAnalytics').checked = false;
        document.getElementById('cookieMarketing').checked = false;
        savePreferences(getCurrentPrefs());
    });

    document.getElementById('cookieModalSave')?.addEventListener('click', () => {
        savePreferences(getCurrentPrefs());
    });

    document.getElementById('cookieModalClose')?.addEventListener('click', closeModal);

    // Click outside modal to close
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // ESC key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.classList.contains('show')) closeModal();
    });

    // Init
    if (!hasConsent()) {
        setTimeout(showBanner, 800);
    } else {
        const prefs = getPreferences();
        if (prefs) applySettings(prefs);
        hideBanner();
    }
})();

// ========================================
// 3. NAVIGATION
// ========================================

(function initNavigation() {
    const navbar = document.getElementById('navbar');

    // Scroll effect
    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        });
    }

    // Mobile menu
    const toggle = document.getElementById('menuToggle');
    const closeBtn = document.getElementById('closeMenu');
    const panel = document.getElementById('mobilePanel');
    const overlay = document.getElementById('mobileOverlay');

    if (toggle && panel) {
        const open = () => {
            panel.classList.add('active');
            overlay?.classList.add('active');
            document.body.style.overflow = 'hidden';
        };
        const close = () => {
            panel.classList.remove('active');
            overlay?.classList.remove('active');
            document.body.style.overflow = '';
        };

        toggle.addEventListener('click', open);
        closeBtn?.addEventListener('click', close);
        overlay?.addEventListener('click', close);
        document.querySelectorAll('.mobile-panel a').forEach(a => a.addEventListener('click', close));
    }
})();

// ========================================
// 4. SMOOTH SCROLL
// ========================================

(function initSmoothScroll() {
    const navbar = document.getElementById('navbar');
    const navHeight = navbar ? navbar.offsetHeight : 80;

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                const offset = navHeight + 20;
                window.scrollTo({
                    top: target.getBoundingClientRect().top + window.scrollY - offset,
                    behavior: 'smooth'
                });
            }
        });
    });
})();

// ========================================
// 5. HERO SPORT SELECTION
// ========================================

(function initHeroSports() {
    const hero = document.getElementById('heroSection');
    if (!hero) return;

    const pills = document.querySelectorAll('.pill');
    const highlight = document.getElementById('sportHighlight');
    const icon = document.getElementById('sportIcon');
    const description = document.getElementById('sportDescription');

    const sportData = {
        basketball: {
            icon: 'fa-basketball-ball',
            label: 'GAME.',
            description: 'Discover pickup games, tournaments, and leagues near you. Built for players who want to connect and compete.',
            bg: '/assets/images/basketball-hero.jpg'
        },
        soccer: {
            icon: 'fa-futbol',
            label: 'PITCH.',
            description: 'Find soccer matches, tournaments, and leagues in your area. Connect with local players and teams.',
            bg: '/assets/images/soccer-hero.jpg'
        },
        volleyball: {
            icon: 'fa-volleyball-ball',
            label: 'NET.',
            description: 'Discover volleyball games, beach tournaments, and indoor leagues. Join the community and spike your way to victory.',
            bg: '/assets/images/volleyball-hero.jpg'
        },
        tennis: {
            icon: 'fa-table-tennis-paddle-ball',
            label: 'COURT.',
            description: 'Find tennis matches, tournaments, and training sessions near you. Connect with players of all skill levels.',
            bg: '/assets/images/tennis-hero.jpg'
        }
    };

    let currentSport = 'basketball';

    function updateHero(sport) {
        const data = sportData[sport];
        if (!data) return;

        hero.setAttribute('data-sport', sport);
        hero.style.backgroundImage = `url('${data.bg}')`;

        if (highlight) highlight.textContent = data.label;
        if (description) description.textContent = data.description;
        if (icon) {
            const i = icon.querySelector('i');
            if (i) i.className = `fas ${data.icon}`;
        }

        pills.forEach(p => p.classList.remove('active'));
        document.querySelector(`.pill[data-sport="${sport}"]`)?.classList.add('active');
        currentSport = sport;
    }

    // Click handlers
    pills.forEach(pill => {
        pill.addEventListener('click', function () {
            updateHero(this.getAttribute('data-sport'));
        });
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        const sports = ['basketball', 'soccer', 'volleyball', 'tennis'];
        const idx = sports.indexOf(currentSport);
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            updateHero(sports[(idx + 1) % sports.length]);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            updateHero(sports[(idx - 1 + sports.length) % sports.length]);
        }
    });

    // Init
    updateHero('basketball');
})();

// ========================================
// 6. WAITLIST FORM — With Formspree + Security
// ========================================

(function initWaitlistForm() {
    const form = document.getElementById('waitlistForm');
    if (!form) return;

    // Rate limiting
    const rateLimiter = {
        max: 3,
        window: 60000,
        key: 'huddleFormSubmissions',

        get submissions() {
            try {
                return JSON.parse(localStorage.getItem(this.key)) || [];
            } catch { return []; }
        },
        set submissions(val) {
            localStorage.setItem(this.key, JSON.stringify(val));
        },

        clean() {
            const now = Date.now();
            this.submissions = this.submissions.filter(t => now - t < this.window);
        },

        canSubmit() {
            this.clean();
            return this.submissions.length < this.max;
        },

        record() {
            this.submissions.push(Date.now());
        },

        getTimeLeft() {
            this.clean();
            if (this.submissions.length === 0) return 0;
            const oldest = this.submissions[0];
            return Math.max(0, this.window - (Date.now() - oldest));
        }
    };

    // Add CSRF token
    const csrfInput = document.createElement('input');
    csrfInput.type = 'hidden';
    csrfInput.name = '_csrf';
    csrfInput.value = getCSRFToken();
    form.prepend(csrfInput);

    // Form submit handler
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Validate CSRF
        const csrfField = this.querySelector('input[name="_csrf"]');
        if (csrfField && !validateCSRFToken(csrfField.value)) {
            alert('Security validation failed. Please refresh the page.');
            return;
        }

        // Rate limiting
        if (!rateLimiter.canSubmit()) {
            const seconds = Math.ceil(rateLimiter.getTimeLeft() / 1000);
            alert(`⏳ Please wait ${seconds} seconds before submitting again.`);
            return;
        }

        // Sanitize inputs
        const name = sanitizeInput(document.getElementById('wlName').value, 'text');
        const email = sanitizeInput(document.getElementById('wlEmail').value, 'email');
        const sport = sanitizeInput(document.getElementById('wlSport').value, 'text');

        if (!name || !email || !sport) {
            alert('Please fill in all fields.');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert('Please enter a valid email address.');
            return;
        }

        // Record submission
        rateLimiter.record();

        // Submit via Formspree
        const btn = this.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        btn.disabled = true;

        try {
            const response = await fetch(this.action, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, sport, _csrf: getCSRFToken() })
            });

            if (response.ok) {
                this.reset();
                showToast('🎉 Thanks for joining the waitlist!');
            } else {
                throw new Error('Submission failed');
            }
        } catch (error) {
            console.error('Form error:', error);
            alert('Oops! Something went wrong. Please try again.');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
})();

// ========================================
// 7. FAQ & HELP CENTER (for pages/faq.html & pages/help.html)
// ========================================

(function initFAQ() {
    // FAQ Accordion toggle
    window.toggleFaq = function (element) {
        const item = element.closest('.faq-item');
        if (!item) return;

        const section = item.closest('.faq-section');
        if (section) {
            section.querySelectorAll('.faq-item.open').forEach(open => {
                if (open !== item) open.classList.remove('open');
            });
        }
        item.classList.toggle('open');
    };

    // FAQ Search
    function searchFAQ(query) {
        const items = document.querySelectorAll('.faq-item');
        const noResults = document.getElementById('noResults');
        const searchQuery = document.getElementById('searchQuery');
        let found = false;

        items.forEach(item => {
            const q = item.querySelector('.q-text')?.textContent?.toLowerCase() || '';
            const a = item.querySelector('.faq-answer')?.textContent?.toLowerCase() || '';
            const match = q.includes(query) || a.includes(query);

            item.style.display = match ? '' : 'none';
            if (match) {
                item.classList.add('open');
                found = true;
            } else {
                item.classList.remove('open');
            }
        });

        if (noResults && searchQuery) {
            noResults.style.display = (query && !found) ? 'block' : 'none';
            if (query && !found) searchQuery.textContent = query;
        }

        document.querySelectorAll('.faq-nav a').forEach(a => a.classList.remove('active'));
        document.querySelector('.faq-nav a:first-child')?.classList.add('active');
    }

    // FAQ Category filter
    document.querySelectorAll('.faq-nav a').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelectorAll('.faq-nav a').forEach(a => a.classList.remove('active'));
            this.classList.add('active');

            const target = this.getAttribute('href');
            const sections = document.querySelectorAll('.faq-section');

            if (target && target !== '#') {
                const sectionId = target.replace('#', '');
                sections.forEach(s => {
                    s.style.display = s.id === sectionId ? '' : 'none';
                });
                document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));

                const section = document.querySelector(target);
                if (section) {
                    setTimeout(() => {
                        const top = section.getBoundingClientRect().top + window.scrollY - 100;
                        window.scrollTo({ top, behavior: 'smooth' });
                    }, 100);
                }
                const noResults = document.getElementById('noResults');
                if (noResults) noResults.style.display = 'none';
            } else {
                sections.forEach(s => s.style.display = '');
                document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
                const noResults = document.getElementById('noResults');
                if (noResults) noResults.style.display = 'none';
            }
        });
    });

    // Handle search from help page
    window.addEventListener('load', function () {
        const params = new URLSearchParams(window.location.search);
        const query = params.get('search');
        if (query) {
            document.querySelectorAll('.faq-section').forEach(s => s.style.display = '');
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
            searchFAQ(query.toLowerCase());
        }

        // Handle hash scroll
        const hash = window.location.hash;
        if (hash) {
            const target = document.querySelector(hash);
            if (target) {
                target.querySelector('.faq-item')?.classList.add('open');
                setTimeout(() => {
                    const top = target.getBoundingClientRect().top + window.scrollY - 100;
                    window.scrollTo({ top, behavior: 'smooth' });
                }, 300);
            }
        }
    });

    // Help Center search
    window.searchHelp = function () {
        const input = document.getElementById('helpSearch');
        if (input?.value.trim()) {
            window.location.href = 'faq.html?search=' + encodeURIComponent(input.value.trim());
        }
    };

    document.getElementById('helpSearch')?.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') window.searchHelp();
    });

    // Scroll to FAQ section (from help page)
    window.scrollToFaq = function (section) {
        window.location.href = 'faq.html#' + section;
    };
})();

// ========================================
// 8. INIT — Run on DOM ready
// ========================================

document.addEventListener('DOMContentLoaded', function () {
    addCSRFTokenToForms();
    console.log('🏀 Huddle — Ready to play!');
});