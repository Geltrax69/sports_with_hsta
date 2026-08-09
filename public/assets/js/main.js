// Tailwind Configuration
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#5a0a8f",
                "primary-dark": "#400466",
                "secondary": "#D0001A",
                "accent": "#FF4B3A",
                "warm-bg": "#FFDDB5", // Keeping for backward compatibility if needed
                "warm-highlight": "#FFDDB5",
                "background-light": "#f7f6f8", // Updated to match about.html
                "background-dark": "#1b1022",
                "text-main": "#1A1A1A",
                "text-muted": "#64748B",
                "card-bg": "#FFFFFF",
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"],
                "body": ["Inter", "sans-serif"]
            },
            borderRadius: { "DEFAULT": "0.5rem", "lg": "0.75rem", "xl": "1rem", "full": "9999px" },
        },
    },
};

// Helper to get base path for assets/pages
const getBasePath = () => {
    // Robust detection using script tag source
    // This handles scenarios like:
    // - Localhost root vs subdir
    // - file:// protocol
    // - GitHub Pages
    if (document.currentScript) {
        const src = document.currentScript.getAttribute('src');
        // If script is loaded as "../assets/js/main.js", we are in a subdir
        if (src && src.startsWith('../')) {
            return '../';
        }
    }

    // Fallback: Check URL path if script attribution fails
    if (window.location.pathname.indexOf('/pages/') !== -1) {
        return '../';
    }

    // Default to root (empty string prefixes 'assets/...')
    return '';
};

const BASE_PATH = getBasePath();

// Header HTML Update
const HEADER_HTML = `
    <!-- Top Navigation -->
    <!-- Top Bar: Recognition & Affiliation -->
    <div class="bg-[#1b1022] text-white border-b border-white/10 text-[11px] md:text-xs overflow-hidden">
        <div class="w-full py-2 marquee-container">
            <div class="marquee-content">
                <!-- Set 1 -->
                <div class="flex items-center gap-8 mx-4">
                    <span class="inline-flex items-center gap-2">
                        <span class="font-bold text-warm-highlight uppercase tracking-wider">Recognised By:</span>
                        <span>Ministry of Youth Affairs and Sports</span>
                        <span class="text-gray-400">|</span>
                        <span class="font-bold">युवा कार्यक्रम और खेल मंत्रालय</span>
                    </span>
                    <span class="text-gray-400 hidden sm:inline">|</span>
                    <span class="inline-flex items-center gap-2 opacity-90">
                        Affiliated with International SepakTakraw Federation (ISTAF) & Asian SepakTakraw Federation
                        (ASTAF)
                    </span>
                    <span class="text-warm-highlight">•</span>
                </div>
                <!-- Set 2 (Duplicate) -->
                <div class="flex items-center gap-8 mx-4">
                    <span class="inline-flex items-center gap-2">
                        <span class="font-bold text-warm-highlight uppercase tracking-wider">Recognised By:</span>
                        <span>Ministry of Youth Affairs and Sports</span>
                        <span class="text-gray-400">|</span>
                        <span class="font-bold">युवा कार्यक्रम और खेल मंत्रालय</span>
                    </span>
                    <span class="text-gray-400 hidden sm:inline">|</span>
                    <span class="inline-flex items-center gap-2 opacity-90">
                        Affiliated with International SepakTakraw Federation (ISTAF) & Asian SepakTakraw Federation
                        (ASTAF)
                    </span>
                    <span class="text-warm-highlight">•</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Navigation -->
    <header
        class="sticky top-0 z-50 w-full bg-white border-b border-[#eee7f3] shadow-lg shadow-black/5 backdrop-blur-xl bg-white/95">
        <div class="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-20 md:h-24 transition-all duration-300">
                <!-- Logo & Brand Area -->
                <div class="flex items-center gap-4 group cursor-pointer" onclick="window.location.href='${BASE_PATH}index.html'">
                    <div class="relative">
                        <div
                            class="absolute inset-0 bg-[#5a0a8f]/20 blur-xl rounded-full group-hover:bg-[#5a0a8f]/30 transition-all">
                        </div>
                        <img src="${BASE_PATH}assets/images/logo.png" alt="STFI Logo"
                            class="relative size-12 md:size-14 rounded-full object-contain bg-white shadow-sm border border-gray-100">
                    </div>
                    <div class="flex flex-col">
                        <h1 class="text-lg md:text-2xl font-black leading-none tracking-tighter uppercase font-display">
                            <span class="text-[#5a0a8f]">Haryana Sepak Takraw</span> <br class="md:hidden">
                            <span class="text-[#D0001A]">Association</span>
                        </h1>
                    </div>
                </div>

                <!-- Desktop Navigation -->
                <nav id="desktop-nav"
                    class="hidden lg:flex items-center gap-1 p-1 bg-gray-50 rounded-full border border-gray-100">
                    <!-- Links injected by main.js -->
                </nav>

                <!-- Actions -->
                <div class="hidden md:flex items-center gap-3">
                    <button
                        class="text-gray-600 hover:text-[#5a0a8f] font-bold text-xs uppercase tracking-wider px-3 py-2 transition-colors">
                        Login
                    </button>
                    <button
                        class="bg-[#5a0a8f] hover:bg-[#400466] text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-lg shadow-purple-900/20 transition-all flex items-center gap-2 transform hover:-translate-y-0.5">
                        <span class="material-symbols-outlined text-[16px]">person_add</span>
                        REGISTER
                    </button>
                </div>

                <!-- Mobile Menu Button -->
                <button id="mobile-menu-btn"
                    class="lg:hidden p-2 text-gray-600 hover:text-primary transition-colors rounded-lg">
                    <span class="material-symbols-outlined text-3xl transition-transform duration-300">menu</span>
                </button>
            </div>
        </div>

        <!-- Mobile Menu (Hidden by default) -->
        <div id="mobile-menu"
            class="hidden lg:hidden bg-white border-b border-gray-100 absolute w-full left-0 top-full shadow-lg animate-fade-in-down">
            <div class="px-4 py-6 space-y-4">
                <div class="space-y-1">
                    <!-- Injected by JS -->
                </div>

                <div class="pt-6 border-t border-gray-100">
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-4">Member Area</p>
                    <div class="grid grid-cols-2 gap-3">
                        <button
                            class="w-full text-center text-gray-700 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">
                            Login
                        </button>
                        <button
                            class="w-full bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2">
                            Register
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </header>
`;

function injectHeader() {
    const headerContainer = document.getElementById('global-header');
    if (headerContainer) {
        headerContainer.innerHTML = HEADER_HTML;
    }
}

const SPONSORS_HTML = `
    <section class="py-10 bg-white dark:bg-surface-dark border-t border-gray-100 dark:border-gray-800">
        <div class="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <h3 class="text-center text-sm font-bold uppercase tracking-widest text-gray-400 mb-8">Supported By</h3>
            
            <!-- Scrolling Marquee Container -->
            <div class="marquee-container w-full overflow-hidden">
                <div class="marquee-content flex items-center gap-12 py-4">
                    <!-- Setup: 9 images provided by user -->
                    <!-- We duplicate the set to ensure seamless scrolling -->
                    
                    <!-- Set 1 -->
                    <img src="${BASE_PATH}assets/images/bottom/l1.png" alt="Partner 1" class="h-12 md:h-16 w-auto object-contain transition-transform duration-300 hover:scale-110">
                    <img src="${BASE_PATH}assets/images/bottom/l3.png" alt="Partner 3" class="h-12 md:h-16 w-auto object-contain transition-transform duration-300 hover:scale-110">
                    <img src="${BASE_PATH}assets/images/bottom/l4.jpg" alt="Partner 4" class="h-12 md:h-16 w-auto object-contain transition-transform duration-300 hover:scale-110">
                    <img src="${BASE_PATH}assets/images/bottom/l5.jpg" alt="Partner 5" class="h-12 md:h-16 w-auto object-contain transition-transform duration-300 hover:scale-110">
                    <img src="${BASE_PATH}assets/images/bottom/l6.jpg" alt="Partner 6" class="h-12 md:h-16 w-auto object-contain transition-transform duration-300 hover:scale-110">
                    <img src="${BASE_PATH}assets/images/bottom/l7.jpg" alt="Partner 7" class="h-12 md:h-16 w-auto object-contain transition-transform duration-300 hover:scale-110">
                    <img src="${BASE_PATH}assets/images/bottom/l8.jpg" alt="Partner 8" class="h-12 md:h-16 w-auto object-contain transition-transform duration-300 hover:scale-110">
                    <img src="${BASE_PATH}assets/images/bottom/l9.png" alt="Partner 9" class="h-12 md:h-16 w-auto object-contain transition-transform duration-300 hover:scale-110">

                    <!-- Set 2 (Duplicate for Loop) -->
                    <img src="${BASE_PATH}assets/images/bottom/l1.png" alt="Partner 1" class="h-12 md:h-16 w-auto object-contain transition-transform duration-300 hover:scale-110">
                    <img src="${BASE_PATH}assets/images/bottom/l3.png" alt="Partner 3" class="h-12 md:h-16 w-auto object-contain transition-transform duration-300 hover:scale-110">
                    <img src="${BASE_PATH}assets/images/bottom/l4.jpg" alt="Partner 4" class="h-12 md:h-16 w-auto object-contain transition-transform duration-300 hover:scale-110">
                    <img src="${BASE_PATH}assets/images/bottom/l5.jpg" alt="Partner 5" class="h-12 md:h-16 w-auto object-contain transition-transform duration-300 hover:scale-110">
                    <img src="${BASE_PATH}assets/images/bottom/l6.jpg" alt="Partner 6" class="h-12 md:h-16 w-auto object-contain transition-transform duration-300 hover:scale-110">
                    <img src="${BASE_PATH}assets/images/bottom/l7.jpg" alt="Partner 7" class="h-12 md:h-16 w-auto object-contain transition-transform duration-300 hover:scale-110">
                    <img src="${BASE_PATH}assets/images/bottom/l8.jpg" alt="Partner 8" class="h-12 md:h-16 w-auto object-contain transition-transform duration-300 hover:scale-110">
                    <img src="${BASE_PATH}assets/images/bottom/l9.png" alt="Partner 9" class="h-12 md:h-16 w-auto object-contain transition-transform duration-300 hover:scale-110">
                </div>
            </div>
        </div>
    </section>
`;

function injectSponsors() {
    const sponsorsContainer = document.getElementById('global-sponsors');
    if (sponsorsContainer) {
        sponsorsContainer.innerHTML = SPONSORS_HTML;
    }
}

const FOOTER_HTML = `
    <footer class="bg-[#1a0f24] text-white pt-16 pb-8">
        <div class="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                <!-- Brand Column -->
                <div class="space-y-4">
                    <div class="flex items-center gap-3 mb-2">
                        <img src="${BASE_PATH}assets/images/logo.png" alt="STFI Logo" class="size-10 rounded-full object-contain bg-white">
                        <div class="flex flex-col">
                            <span class="text-xs font-bold text-gray-400 tracking-wider">RECOGNISED BY:</span>
                            <span class="text-sm font-black text-white leading-tight uppercase">HARYANA SEPAK TAKRAW ASSOCIATION</span>
                        </div>
                    </div>
                    <p class="text-gray-400 text-sm leading-relaxed">
                        The governing body for Sepak Takraw in India. Dedicated to promoting the sport, nurturing
                        talent, and organizing world-class competitions across the nation.
                    </p>
                    <div class="flex gap-4 pt-2">
                        <a class="size-8 rounded bg-white/10 flex items-center justify-center hover:bg-primary transition-colors"
                            href="#">
                            <span class="text-xs font-bold">FB</span>
                        </a>
                        <a class="size-8 rounded bg-white/10 flex items-center justify-center hover:bg-primary transition-colors"
                            href="#">
                            <span class="text-xs font-bold">X</span>
                        </a>
                        <a class="size-8 rounded bg-white/10 flex items-center justify-center hover:bg-primary transition-colors"
                            href="#">
                            <span class="text-xs font-bold">IG</span>
                        </a>
                        <a class="size-8 rounded bg-white/10 flex items-center justify-center hover:bg-primary transition-colors"
                            href="#">
                            <span class="text-xs font-bold">YT</span>
                        </a>
                    </div>
                </div>

                <!-- Quick Links -->
                <div>
                    <h4 class="text-lg font-bold mb-6 text-white">Quick Links</h4>
                    <ul class="space-y-3 text-sm text-gray-400">
                        <li><a class="hover:text-primary transition-colors" href="${BASE_PATH}/about.html">About Us</a></li>
                        <li><a class="hover:text-primary transition-colors" href="${BASE_PATH}/news.html">News</a></li>
                        <li><a class="hover:text-primary transition-colors" href="${BASE_PATH}/documents.html">Documents</a></li>
                        <li><a class="hover:text-primary transition-colors" href="${BASE_PATH}/players.html">Players</a></li>
                        <li><a class="hover:text-primary transition-colors" href="${BASE_PATH}/contact.html">Contact Us</a></li>
                    </ul>
                </div>

                <!-- Contact Info -->
                <div>
                    <h4 class="text-lg font-bold mb-6 text-white">Contact Us</h4>
                    <ul class="space-y-4 text-sm text-gray-400">
                        <li class="flex items-start gap-3">
                            <span class="material-symbols-outlined text-primary mt-0.5">location_on</span>
                            <span>Room No. 12, Gate 14,<br>Indira Gandhi Stadium Complex,<br>New Delhi -
                                110002</span>
                        </li>
                        <li class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-primary">call</span>
                            <span>+91 11 2345 6789</span>
                        </li>
                        <li class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-primary">mail</span>
                            <span>contact@stfi.in</span>
                        </li>
                    </ul>
                </div>

                <!-- Newsletter -->
                <div>
                    <h4 class="text-lg font-bold mb-6 text-white">Newsletter</h4>
                    <p class="text-gray-400 text-sm mb-4">Subscribe to get latest updates, tournament schedules and
                        news.</p>
                    <form class="flex flex-col gap-3">
                        <input
                            class="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                            type="email" placeholder="Enter your email" />
                        <button
                            class="w-full py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg text-sm transition-colors"
                            type="submit">
                            Subscribe
                        </button>
                    </form>
                </div>
            </div>

            <div
                class="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                <p>&copy; 2024 Haryana Sepak Takraw Association. All rights reserved.</p>
                <div class="flex gap-6">
                    <a href="#" class="hover:text-white transition-colors">Privacy Policy</a>
                    <a href="#" class="hover:text-white transition-colors">Terms of Service</a>
                </div>
            </div>
        </div>
    </footer>
`;

function injectFooter() {
    const footerContainer = document.getElementById('global-footer');
    if (footerContainer) {
        footerContainer.innerHTML = FOOTER_HTML;
    }
}

// UI Logic
// UI Logic & SPA Router
document.addEventListener('DOMContentLoaded', () => {
    // React SPA mounts into #root — never replace injected header/footer (breaks react-router).
    if (document.getElementById('root')?.childElementCount) {
        return;
    }

    // Initial Load Animation
    setTimeout(() => document.body.classList.add('loaded'), 50);

    // Initialize Global Components
    injectHeader();
    injectSponsors();
    injectFooter();

    // Initialize UI Handlers
    initMobileMenu();
    renderNavigation(); // Render navigation links
    // initRouter(); // Disabled - using normal page navigation instead
});

function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    if (btn && menu) {
        // Clone & replace to remove old listeners if re-initializing
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', () => {
            menu.classList.toggle('hidden');
            const icon = newBtn.querySelector('.material-symbols-outlined');
            if (menu.classList.contains('hidden')) {
                icon.textContent = 'menu';
                icon.style.transform = 'rotate(0deg)';
            } else {
                icon.textContent = 'close';
                icon.style.transform = 'rotate(90deg)';
            }
        });
    }
}

function initRouter() {
    // Intercept clicks
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
        // Ignore external, anchors, or new tab
        if (!href || href.startsWith('#') || link.target === '_blank') return;
        
        // Check if it's an external link
        if (href.startsWith('http')) {
            try {
                const linkUrl = new URL(href);
                if (linkUrl.hostname !== window.location.hostname) return;
            } catch (e) {
                return; // Invalid URL
            }
        }

        e.preventDefault();
        navigateTo(href);
    });

    // Handle Back/Forward
    window.addEventListener('popstate', () => {
        loadPage(window.location.href, false);
    });
}

async function navigateTo(url) {
    // Resolve relative URLs to absolute URLs to prevent path duplication
    const resolvedUrl = new URL(url, window.location.href).href;
    history.pushState(null, null, resolvedUrl);
    await loadPage(resolvedUrl, true);
}

// Route Configuration
const routeConfig = [
    { name: 'Home', path: `${BASE_PATH}index.html` },
    { name: 'About', path: `${BASE_PATH}pages/about.html` },
    { name: 'Events', path: `${BASE_PATH}pages/events.html` },
    { name: 'Documents', path: `${BASE_PATH}pages/documents.html`, disabled: false },
    { name: 'News', path: `${BASE_PATH}pages/news.html`, disabled: false },
    { name: 'Contact Us', path: `${BASE_PATH}pages/contact.html`, disabled: false }
];

// Centralized Navigation Renderer
function renderNavigation() {
    const desktopNav = document.getElementById('desktop-nav');
    const mobileContainer = document.querySelector('#mobile-menu .space-y-1'); // Target inner container
    const currentPath = window.location.pathname; // Gets absolute path like /index.html or /pages/about.html

    // Desktop Styling
    const desktopBase = "px-3 py-2 text-xs font-bold uppercase tracking-normal rounded-full transition-all whitespace-nowrap flex-shrink-0";
    const desktopActive = "text-[#5a0a8f] bg-white shadow-sm";
    const desktopInactive = "text-gray-600 hover:text-[#5a0a8f] hover:bg-white";

    // Mobile Styling
    const mobileBase = "block px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors";
    const mobileActive = "text-[#5a0a8f] bg-primary/5";
    const mobileInactive = "text-gray-700 hover:bg-primary/5 hover:text-primary";

    // Clear existing
    if (desktopNav) desktopNav.innerHTML = '';
    if (mobileContainer) mobileContainer.innerHTML = '';

    routeConfig.forEach(route => {
        // Robust matching to handle trailing slashes or default root
        const normalizedCurrent = currentPath === '/' ? '/index.html' : currentPath;
        const isActive = normalizedCurrent.endsWith(route.path.replace(/^\.\.\//, '').replace(/^\./, '')); // Crude clean up for matching

        // Render Desktop
        if (desktopNav) {
            const a = document.createElement('a');
            a.href = route.path;
            a.textContent = route.name;
            a.className = `${desktopBase} ${isActive ? desktopActive : desktopInactive}`;
            desktopNav.appendChild(a);
        }

        // Render Mobile
        if (mobileContainer) {
            const a = document.createElement('a');
            a.href = route.path;
            a.textContent = route.name;
            a.className = `${mobileBase} ${isActive ? mobileActive : mobileInactive}`;
            mobileContainer.appendChild(a);
        }
    });

    // No need to call updateActiveNav() as invalid, we just rendered everything correctly.
}

// Players & Coaches Data
const playersData = [
    {
        id: "STFI-2023-042",
        name: "Amit Sharma",
        role: "Striker",
        state: "Delhi",
        rank: "#4",
        age: 24,
        category: "MEN",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA2ncxeYUyPpqET6NmAisc5cWT6_28oeM216RdlgEzkDnVJnpaho9CvSymHDS7GoEo52021Y6-Tf5z2oMXFflJ4k-ye1nGC6EhTRtqYZM6J_ct4fRc3XXus0sD0MPuLZIHEs960LU5gIh8B9ONKX7w96VQCi3tbXe6PV3U_IUyWexTnCf32yyY2ZsnhPef3_G1X_6eIbu6Q_27_eWBQwg6ZcBpSDoPEFa0NL2S_uZEhxADRRA_G7rYn1AVfjyUc_a7Pmwwy3naYcmE",
        lastActive: "2d ago",
        badge: "National Team"
    },
    {
        id: "STFI-2023-118",
        name: "Priya Singh",
        role: "Tekong",
        state: "Maharashtra",
        rank: "#12",
        age: 22,
        category: "WOMEN",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDj4ysVWFrEy44G68XUVyWE05Rvhxb06NeJrzSzWAhbWW1xpZ8Wq20G096gev4nzpwIa4rmt-om6OIJH60tPP7s26CBRrAm8ADm09HhnAkpdIetW4eSuOxF0LOk5L3QcALB21IcIqT1rePol74x98qA4H0_buMwJD72bCoWkL_mVZdA4eHgf6LQOGH6KWXmOOqYBfoQLUGZ9B_uaTJwdPi04MvdLS7gPNVePtg3hTozzZjkfpVFx00C6YAqZvST3sZwOZr7KuaA",
        lastActive: "1w ago",
        badge: ""
    },
    {
        id: "STFI-2023-089",
        name: "Rahul Verma",
        role: "Feeder",
        state: "Kerala",
        rank: "#7",
        age: 27,
        category: "MEN",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDI-nIpAKsfK7fouNdh2x1AiqlBZ9co-35EW3_G2FYjViXf7MOYCev5vE2jk6kvk3Vqb5zIgwNdWU1TJZ5tkx7gUliKD0K49FSVJn2SjepwXeXEyojWglm4jcYJPPhjlFAnTFFWS80qOAfiX0bR4Q7mdsdkgTV19K7i--th-mwDYqusS1yBFgJ6Tog6z8w5nlWE0ViBqw7jsceNHKZhEL5xehFpdInUHnS_bpIIyEGwUDGVri0MAiDdazL5LsQt8jtYYVpgUzHNM4M",
        lastActive: "5h ago",
        badge: "National Team"
    },
    {
        id: "STFI-2023-102",
        name: "Sneha Patel",
        role: "Striker",
        state: "Gujarat",
        rank: "#22",
        age: 19,
        category: "JUNIOR",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA5vraIynNuKw9b4_9O1GeYj9pR5InkrMpfKY7eVzqO1qp8A3inaRLcTd3cnFCbUjPVi2L-FYU6Ho7iy4WCT_4DuMumz6Qjay6tpQR_rb6JZ80jiLuZUxuRCk7BCLpZfJpxIwZrCQI4iiGbdT8Nh3wR9QISE5nr9VWBQWgUToZFYk1PGzBdUsyfscvgKrmi5uyC5Onx1_uoa2lGIW46vNLL868eznHnhVhavL2xzsl4S_bMhDPUwUsiZBtPl0DmlZp2rBtRelEkZy4",
        lastActive: "1d ago",
        badge: ""
    }
];

const coachesData = [
    {
        id: "STFI-COACH-001",
        name: "Vikram Rathore",
        role: "Head Coach",
        state: "Punjab",
        rank: "Elite",
        age: 45,
        category: "SENIOR",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBTs8Xk3-2zM4RzSg-pC7Y9O3wK6q5sL2j4M8e7N0aP1cQ5vU9rI3xH2yF4lB6mJ5oK7pG8tS9wR0d1uV3X2E4iY6kZ8n0oM7j3L9hP5qA2sB4tC1vD6eF8wG0yJ7kI4mN3pQ2rS5tU1vW4xY9zO6aH2bC3dE5fG1gH8jI0kL4mM7nP9oR2", // Placeholder
        lastActive: "Active Now",
        badge: "Internal"
    },
    {
        id: "STFI-COACH-012",
        name: "Anjali Deshmukh",
        role: "Assistant Coach",
        state: "Maharashtra",
        rank: "Level 2",
        age: 38,
        category: "WOMEN",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC9kL5mN3oP2jQ6wR8sT5yU4v1xI9nO7gH3fE2aC0d4bJ6mL8pS3tV1wX5yZ9O6aH2bC3dE5fG1gH8jI0kL4mM7nP9oR2sT5uV1wX4yZ9O6aH2bC3dE5fG1gH8jI0kL4mM7nP9oR2sT5uV1wX4yZ9O6aH2bC3dE5fG1gH8jI0kL4mM7nP9oR2sT5uV1wX4y", // Placeholder
        lastActive: "3d ago",
        badge: ""
    },
    {
        id: "STFI-COACH-008",
        name: "Rajesh Kumar",
        role: "Technical Director",
        state: "Karnataka",
        rank: "Level 3",
        age: 52,
        category: "YOUTH",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD2jF4kL9wR8sT5yU4v1xI9nO7gH3fE2aC0d4bJ6mL8pS3tV1wX5yZ9O6aH2bC3dE5fG1gH8jI0kL4mM7nP9oR2sT5uV1wX4yZ9O6aH2bC3dE5fG1gH8jI0kL4mM7nP9oR2sT5u", // Placeholder
        lastActive: "1d ago",
        badge: "Official"
    }
];

function initPlayersPage() {
    const grid = document.getElementById('directory-grid');
    if (!grid) return; // Not on players page

    const btnPlayers = document.getElementById('btn-players');
    const btnCoaches = document.getElementById('btn-coaches');
    const searchInput = document.getElementById('search-input');
    const statsText = document.getElementById('stats-text');
    const sortSelect = document.getElementById('sort-select');

    let currentMode = 'players'; // 'players' or 'coaches'
    let currentData = playersData;

    // Helper: Create HTML for a card
    function createCard(item) {
        // Fallback image if specific placeholder fails or isn't set
        // const imgUrl = item.image && item.image.length > 50 ? item.image : `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=random`;
        // Using provided image directly

        return `
        <div class="group bg-white dark:bg-surface-dark rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden animate-entry">
            <div class="relative h-56 bg-gray-100 dark:bg-gray-800">
                <img alt="Profile photo of ${item.name}" class="w-full h-full object-cover" src="${item.image}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=random&size=200'"/>
                ${item.badge ? `<div class="absolute top-3 right-3 bg-secondary text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-sm">${item.badge}</div>` : ''}
                <div class="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div class="absolute bottom-3 left-4 text-white">
                    <p class="text-xs font-medium opacity-90">ID: ${item.id}</p>
                </div>
            </div>
            <div class="p-5 flex flex-col flex-grow">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">${item.name}</h3>
                        <p class="text-primary font-medium text-sm">${item.role}</p>
                    </div>
                    <div class="flex flex-col items-end">
                        <span class="text-xs font-bold text-gray-400 border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 rounded">${item.category}</span>
                    </div>
                </div>
                <div class="mt-4 space-y-2">
                    <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <span class="material-symbols-outlined text-[18px] text-gray-400">location_on</span>
                        <span>${item.state}</span>
                    </div>
                    <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <span class="material-symbols-outlined text-[18px] text-gray-400">trophy</span>
                        <span>Rank ${item.rank}</span>
                    </div>
                    <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <span class="material-symbols-outlined text-[18px] text-gray-400">cake</span>
                        <span>Age: ${item.age}</span>
                    </div>
                </div>
                <div class="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <span class="text-xs text-gray-400 font-medium">Last active: ${item.lastActive}</span>
                    <button class="text-primary hover:text-primary/80 text-sm font-bold flex items-center gap-1 group/btn">
                        View Profile 
                        <span class="material-symbols-outlined text-[16px] transition-transform group-hover/btn:translate-x-1">arrow_forward</span>
                    </button>
                </div>
            </div>
        </div>
        `;
    }

    // Render Logic
    function render(data = currentData) {
        // Apply Sort if selected
        const sortValue = sortSelect ? sortSelect.value : 'rank';
        const sortedData = [...data].sort((a, b) => {
            if (sortValue === 'name') {
                return a.name.localeCompare(b.name);
            } else if (sortValue === 'age') {
                return a.age - b.age; // Youngest first
            } else {
                // Default: Rank
                // Try to parse rank #4 -> 4
                const rankA = parseInt(a.rank.replace(/\D/g, '')) || 999;
                const rankB = parseInt(b.rank.replace(/\D/g, '')) || 999;
                return rankA - rankB; // Low number = High rank
            }
        });

        grid.innerHTML = sortedData.map(createCard).join('');

        // Update Stats
        const entityName = currentMode === 'players' ? 'players' : 'coaches';
        if (statsText) {
            statsText.innerHTML = `Showing <span class="font-bold text-gray-900 dark:text-white">1-${sortedData.length}</span> of <span class="font-bold text-gray-900 dark:text-white">${sortedData.length}</span> ${entityName}`;
        }
    }

    // Filter Logic
    function filter(query) {
        const lowerQ = query.toLowerCase();
        const filtered = currentData.filter(item =>
            item.name.toLowerCase().includes(lowerQ) ||
            item.id.toLowerCase().includes(lowerQ) ||
            item.state.toLowerCase().includes(lowerQ)
        );
        render(filtered);
    }

    // Toggle Logic
    const activeClass = "bg-white dark:bg-surface-dark shadow-sm text-primary dark:text-primary font-bold";
    const inactiveClass = "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium";

    function setMode(mode) {
        currentMode = mode;
        currentData = mode === 'players' ? playersData : coachesData;

        // Reset Search
        searchInput.value = '';

        // Update Buttons
        if (mode === 'players') {
            btnPlayers.className = `flex-1 lg:flex-none px-6 py-2 rounded-md ${activeClass} text-sm transition-all text-center`;
            btnCoaches.className = `flex-1 lg:flex-none px-6 py-2 rounded-md ${inactiveClass} text-sm transition-all text-center`;
        } else {
            btnPlayers.className = `flex-1 lg:flex-none px-6 py-2 rounded-md ${inactiveClass} text-sm transition-all text-center`;
            btnCoaches.className = `flex-1 lg:flex-none px-6 py-2 rounded-md ${activeClass} text-sm transition-all text-center`;
        }

        render();
    }

    // Event Listeners
    btnPlayers.addEventListener('click', () => setMode('players'));
    btnCoaches.addEventListener('click', () => setMode('coaches'));

    searchInput.addEventListener('input', (e) => filter(e.target.value));
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            // Re-filter with current search val to preserve filter state, then render sorts it
            filter(searchInput.value);
        });
    }

    // Initial Render
    render();
}

// UI Logic
// UI Logic & SPA Router
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('root')?.childElementCount) {
        return;
    }

    // Initial Load Animation
    setTimeout(() => document.body.classList.add('loaded'), 50);

    // 1. Inject Global Header & Sponsors
    injectHeader();
    injectSponsors();
    injectFooter();

    // 2. Render Navigation into the new Header
    renderNavigation();
    // initRouter(); // Disabled - using normal page navigation instead

    // 3. Page Specific Inits
    if (window.location.pathname.includes('about.html')) {
        initTimeline();
    }
    if (window.location.pathname.includes('players.html')) {
        initPlayersPage();
    }
    if (window.location.pathname.includes('documents.html')) {
        initDocumentsPage();
    }

    // Mobile Menu Toggle Logic
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileBtn && mobileMenu) {
        mobileBtn.addEventListener('click', () => {
            const isHidden = mobileMenu.classList.contains('hidden');
            if (isHidden) {
                mobileMenu.classList.remove('hidden');
                // Update icon to 'close'
                const icon = mobileBtn.querySelector('.material-symbols-outlined');
                if (icon) { icon.textContent = 'close'; icon.style.transform = 'rotate(90deg)'; }
            } else {
                mobileMenu.classList.add('hidden');
                // Update icon to 'menu'
                const icon = mobileBtn.querySelector('.material-symbols-outlined');
                if (icon) { icon.textContent = 'menu'; icon.style.transform = 'rotate(0deg)'; }
            }
        });
    }
});

// --- Documents Page Logic ---
const documentsData = [
    {
        id: "DOC-2024-001",
        title: "Official Sepak Takraw Rules 2024",
        category: "Rules",
        year: 2024,
        date: "Jan 15, 2024",
        size: "2.4 MB",
        type: "PDF",
        tags: ["Updated"],
        icon: "description",
        colorClass: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
    },
    {
        id: "DOC-2024-002",
        title: "Player Registration Form - Zone A",
        category: "Forms",
        year: 2024,
        date: "Feb 02, 2024",
        size: "500 KB",
        type: "DOCX",
        tags: [],
        icon: "description",
        colorClass: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
    },
    {
        id: "DOC-2024-003",
        title: "Circular 42: National Championship Updates",
        category: "Circulars",
        year: 2024,
        date: "Mar 10, 2024",
        size: "1.2 MB",
        type: "PDF",
        tags: ["Important"],
        icon: "campaign",
        colorClass: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
    },
    {
        id: "DOC-2024-004",
        title: "Anti-Doping Guidelines & Prohibited List",
        category: "Technical Data",
        year: 2024,
        date: "Jan 05, 2024",
        size: "3.1 MB",
        type: "PDF",
        tags: [],
        icon: "health_and_safety",
        colorClass: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
    },
    {
        id: "DOC-2023-010",
        title: "Annual General Meeting Minutes 2023",
        category: "Circulars",
        year: 2023,
        date: "Dec 20, 2023",
        size: "1.8 MB",
        type: "PDF",
        tags: [],
        icon: "campaign",
        colorClass: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
    },
    {
        id: "DOC-2023-005",
        title: "Technical Handbook: State Championships",
        category: "Technical Data",
        year: 2023,
        date: "Aug 15, 2023",
        size: "4.5 MB",
        type: "PDF",
        tags: [],
        icon: "bar_chart",
        colorClass: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
    },
    {
        id: "DOC-2023-001",
        title: "Team Affiliation Form 2023-24",
        category: "Forms",
        year: 2023,
        date: "Apr 01, 2023",
        size: "600 KB",
        type: "DOCX",
        tags: [],
        icon: "description",
        colorClass: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
    },
    {
        id: "DOC-ARCH-099",
        title: "Legacy Rules Archive (2010-2020)",
        category: "Rules",
        year: "Archived",
        date: "Jan 01, 2021",
        size: "15 MB",
        type: "ZIP",
        tags: ["Archived"],
        icon: "history",
        colorClass: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
    }
];

function initDocumentsPage() {
    const listContainer = document.getElementById('documents-list');
    if (!listContainer) return;

    const searchInput = document.getElementById('doc-search');
    const yearSelect = document.getElementById('doc-year-filter');
    const categoryBtns = document.querySelectorAll('#doc-categories button');
    const paginationContainer = document.getElementById('doc-pagination');

    let currentCategory = 'all';
    let currentPage = 1;
    const itemsPerPage = 5;

    function renderDocs(docs) {
        listContainer.innerHTML = '';

        if (docs.length === 0) {
            listContainer.innerHTML = `
                <div class="text-center py-20 opacity-60">
                    <span class="material-symbols-outlined text-4xl mb-2">folder_off</span>
                    <p>No documents found matching your criteria.</p>
                </div>
            `;
            return;
        }

        docs.forEach(doc => {
            const card = document.createElement('div');
            card.className = "group flex flex-col md:flex-row items-start md:items-center gap-4 bg-white dark:bg-[#251a2d] p-5 rounded-xl shadow-sm border border-[#eee7f3] dark:border-gray-800 hover:border-primary/30 hover:shadow-md transition-all animate-entry";

            // Generate Tags HTML
            const tagsHtml = doc.tags.map(tag => {
                let color = "bg-gray-100 text-gray-700";
                if (tag === "Updated") color = "bg-primary/10 text-primary";
                if (tag === "Important") color = "bg-red-100 text-red-700";
                return `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${color} tracking-wide">${tag}</span>`;
            }).join('');

            card.innerHTML = `
                <div class="flex items-center justify-center rounded-lg ${doc.colorClass} shrink-0 size-14">
                    <span class="material-symbols-outlined text-3xl">${doc.icon}</span>
                </div>
                <div class="flex flex-col flex-1 gap-1">
                    <div class="flex items-center gap-2">
                        <h4 class="text-[#160d1c] dark:text-white text-lg font-bold leading-tight group-hover:text-primary transition-colors">
                            ${doc.title}
                        </h4>
                        ${tagsHtml}
                    </div>
                    <p class="text-gray-500 dark:text-gray-400 text-sm line-clamp-2">
                        Official document classified under ${doc.category}.
                    </p>
                    <div class="flex items-center gap-3 mt-1 text-xs font-medium text-gray-400 dark:text-gray-500">
                        <span class="flex items-center gap-1">
                            <span class="material-symbols-outlined text-[14px]">calendar_today</span> ${doc.date}
                        </span>
                        <span>•</span>
                        <span>${doc.type}</span>
                        <span>•</span>
                        <span>${doc.size}</span>
                        <span>•</span>
                         <span class="bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded">${doc.year}</span>
                    </div>
                </div>
                <div class="w-full md:w-auto mt-3 md:mt-0 shrink-0">
                    <button class="flex w-full md:w-auto cursor-pointer items-center justify-center rounded-lg h-10 px-5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors gap-2 group-hover:bg-primary group-hover:text-white">
                        <span class="material-symbols-outlined text-[18px]">download</span>
                        <span>Download</span>
                    </button>
                </div>
            `;
            listContainer.appendChild(card);
        });
    }

    function updatePagination(totalItems) {
        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        if (totalPages <= 1) return;

        // Prev
        const prevBtn = document.createElement('button');
        prevBtn.className = `flex items-center justify-center size-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors`;
        prevBtn.innerHTML = '<span class="material-symbols-outlined text-lg">chevron_left</span>';
        prevBtn.disabled = currentPage === 1;
        prevBtn.onclick = () => { if (currentPage > 1) { currentPage--; filterAndRender(); } };
        paginationContainer.appendChild(prevBtn);

        // Pages
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            const isActive = i === currentPage;
            pageBtn.className = isActive
                ? "flex items-center justify-center size-10 rounded-lg bg-primary text-white font-medium shadow-md shadow-primary/20 transition-all transform scale-105"
                : "flex items-center justify-center size-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors";

            pageBtn.innerText = i;
            pageBtn.onclick = () => { currentPage = i; filterAndRender(); };
            paginationContainer.appendChild(pageBtn);
        }

        // Next
        const nextBtn = document.createElement('button');
        nextBtn.className = `flex items-center justify-center size-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors`;
        nextBtn.innerHTML = '<span class="material-symbols-outlined text-lg">chevron_right</span>';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.onclick = () => { if (currentPage < totalPages) { currentPage++; filterAndRender(); } };
        paginationContainer.appendChild(nextBtn);
    }

    function filterAndRender() {
        const query = searchInput.value.toLowerCase();
        const year = yearSelect.value;

        let filtered = documentsData.filter(doc => {
            const matchesSearch = doc.title.toLowerCase().includes(query) || doc.category.toLowerCase().includes(query);
            const matchesCategory = currentCategory === 'all' || doc.category === currentCategory;
            const matchesYear = year === 'all' || doc.year.toString() === year || (year === 'archived' && doc.year === 'Archived');

            return matchesSearch && matchesCategory && matchesYear;
        });

        // Pagination Slice
        const totalItems = filtered.length;
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedDocs = filtered.slice(start, end);

        renderDocs(paginatedDocs);
        updatePagination(totalItems);
    }

    // Event Listeners
    searchInput.addEventListener('input', () => { currentPage = 1; filterAndRender(); });
    yearSelect.addEventListener('change', () => { currentPage = 1; filterAndRender(); });

    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            categoryBtns.forEach(b => {
                b.className = "flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 transition-all";
                // Reset icon color if needed, simplified here
            });
            btn.className = "flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-primary text-white px-4 shadow-md shadow-primary/25 transition-transform hover:scale-105 active:scale-95";

            currentCategory = btn.getAttribute('data-category');
            currentPage = 1;
            filterAndRender();
        });
    });

    // Initial Render
    filterAndRender();
}

async function loadPage(url, isSlide) {
    const currentContent = document.getElementById('page-content');
    if (!currentContent) return window.location.reload(); // Fallback

    // Mobile Menu Close on nav
    const menu = document.getElementById('mobile-menu');
    const btn = document.getElementById('mobile-menu-btn');
    if (menu && !menu.classList.contains('hidden')) {
        menu.classList.add('hidden');
        if (btn) {
            const icon = btn.querySelector('.material-symbols-outlined');
            if (icon) { icon.textContent = 'menu'; icon.style.transform = 'rotate(0deg)'; }
        }
    }

    // Slide Out
    if (isSlide) {
        currentContent.classList.add('page-exit-left');
    }

    try {
        // Fetch new content
        const response = await fetch(url);
        const text = await response.text();
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(text, 'text/html');
        const newContent = newDoc.getElementById('page-content');

        if (!newContent) throw new Error('No page content found');

        // Wait for exit animation
        if (isSlide) await new Promise(r => setTimeout(r, 400));

        // Swap Content
        currentContent.innerHTML = newContent.innerHTML;

        // Update Title
        document.title = newDoc.title;

        // Reset Scroll
        window.scrollTo(0, 0);

        // Slide In
        if (isSlide) {
            currentContent.classList.remove('page-exit-left');
            currentContent.classList.add('page-enter-right');

            // Force Reflow
            void currentContent.offsetWidth;

            currentContent.classList.remove('page-enter-right');
        }

        // Re-run scripts/handlers if needed (e.g., if there were specific page scripts)
        // For now, re-init global UI
        initMobileMenu();
        updateActiveNav();
        initTimeline();

    } catch (err) {
        console.error('Navigation error:', err);
        window.location.href = url; // Fallback hard load
    }
}

function updateActiveNav() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('nav a, #mobile-menu a');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        // Basic match for now
        if (href === currentPath || (href === 'index.html' && currentPath === '')) {
            // Apply Active Styles
            // Desktop
            if (link.closest('nav')) {
                link.className = 'px-5 py-2 text-xs font-bold uppercase tracking-wide text-[#5a0a8f] bg-white rounded-full shadow-sm transition-all';
            }
            // Mobile
            else {
                link.classList.add('text-[#5a0a8f]', 'bg-primary/5');
                link.classList.remove('text-gray-700', 'dark:text-gray-200');
            }
        } else {
            // Reset Inactive Styles
            // Desktop
            if (link.closest('nav')) {
                link.className = 'px-5 py-2 text-xs font-bold uppercase tracking-wide text-gray-600 hover:text-[#5a0a8f] hover:bg-white rounded-full transition-all';
            }
            // Mobile
            else {
                link.classList.remove('text-[#5a0a8f]', 'bg-primary/5');
                link.classList.add('text-gray-700', 'dark:text-gray-200'); // Re-add default
            }
        }
    });
}

function initTimeline() {
    const timeline = document.querySelector('.timeline-container');
    const items = document.querySelectorAll('.timeline-item');
    if (!timeline || items.length === 0) return;

    // Set Initial Background
    const firstImg = items[0].querySelector('.timeline__img');
    if (firstImg) {
        timeline.style.backgroundImage = `url(${firstImg.src})`;
    }
    items[0].classList.add('timeline-item--active');

    // Scroll Handler
    const handleScroll = () => {
        const viewportCenter = window.innerHeight / 2;

        let activeItem = null;
        let minDistance = Infinity;

        items.forEach((item) => {
            const rect = item.getBoundingClientRect();
            // Calculate center of item relative to viewport
            const itemCenter = rect.top + (rect.height / 2);
            // Calculate distance from viewport center
            const distance = Math.abs(viewportCenter - itemCenter);

            if (distance < minDistance) {
                minDistance = distance;
                activeItem = item;
            }
        });

        if (activeItem) {
            items.forEach(it => it.classList.remove('timeline-item--active'));
            activeItem.classList.add('timeline-item--active');

            const img = activeItem.querySelector('.timeline__img');
            if (img) {
                const bgUrl = `url(${img.src})`;
                // Only update if changed to prevent flashing
                if (timeline.style.backgroundImage !== bgUrl) {
                    timeline.style.backgroundImage = bgUrl;
                }
            }
        }
    }

    window.addEventListener('scroll', handleScroll);
    // Initial Trigger
    setTimeout(handleScroll, 100); // Slight delay to ensure layout
}

