const SELECTORS = {
  topbar: ".topbar",
  navToggle: ".nav-toggle",
  siteNav: ".site-nav",
  navOverlay: ".nav-overlay",
  navLinks: ".site-nav a",
  navActiveLinks: "[data-nav-link]",
  mainSections: "main section[id]",
  progressBar: ".scroll-progress-bar",
  revealElements: ".reveal",
};

const BREAKPOINTS = {
  mobileNav: 768,
};

function getFocusableElements(container) {
  if (!container) return [];

  const focusableSelector = [
    "a[href]",
    "button:not([disabled])",
    'input:not([disabled]):not([type="hidden"])',
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ].join(",");

  return [...container.querySelectorAll(focusableSelector)].filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      !element.getAttribute("aria-hidden") &&
      element.offsetParent !== null,
  );
}

function setupMobileNav() {
  const navToggle = document.querySelector(SELECTORS.navToggle);
  const siteNav = document.querySelector(SELECTORS.siteNav);
  const navOverlay = document.querySelector(SELECTORS.navOverlay);
  const navLinks = [...document.querySelectorAll(SELECTORS.navLinks)];

  if (!navToggle || !siteNav || !navOverlay || !navLinks.length) return;

  let isMenuOpen = false;
  let lastFocusedElement = null;

  const syncMenuA11yState = (open) => {
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute(
      "aria-label",
      open ? "Close navigation menu" : "Open navigation menu",
    );

    navToggle.classList.toggle("is-active", open);
    siteNav.classList.toggle("is-open", open);
    navOverlay.classList.toggle("is-visible", open);

    navOverlay.hidden = !open;
    navOverlay.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("nav-open", open);
  };

  const openMenu = () => {
    if (isMenuOpen) return;

    isMenuOpen = true;
    lastFocusedElement = document.activeElement;
    syncMenuA11yState(true);

    const focusableItems = getFocusableElements(siteNav);
    focusableItems[0]?.focus();
  };

  const closeMenu = ({ returnFocus = false } = {}) => {
    if (!isMenuOpen) return;

    isMenuOpen = false;
    syncMenuA11yState(false);

    if (returnFocus && lastFocusedElement instanceof HTMLElement) {
      lastFocusedElement.focus();
    }
  };

  const handleTrapFocus = (event) => {
    if (!isMenuOpen || event.key !== "Tab") return;

    const focusableItems = getFocusableElements(siteNav);
    if (!focusableItems.length) return;

    const firstElement = focusableItems[0];
    const lastElement = focusableItems[focusableItems.length - 1];
    const currentElement = document.activeElement;

    if (event.shiftKey && currentElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && currentElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  navToggle.addEventListener("click", () => {
    if (isMenuOpen) {
      closeMenu({ returnFocus: true });
    } else {
      openMenu();
    }
  });

  navOverlay.addEventListener("click", () => {
    closeMenu({ returnFocus: true });
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (!isMenuOpen) return;

    if (event.key === "Escape") {
      closeMenu({ returnFocus: true });
      return;
    }

    handleTrapFocus(event);
  });

  document.addEventListener("click", (event) => {
    if (!isMenuOpen) return;

    const clickedInsideNav = siteNav.contains(event.target);
    const clickedToggle = navToggle.contains(event.target);

    if (!clickedInsideNav && !clickedToggle) {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > BREAKPOINTS.mobileNav && isMenuOpen) {
      closeMenu();
    }
  });

  syncMenuA11yState(false);
}

function setupHeaderScrollState() {
  const topbar = document.querySelector(SELECTORS.topbar);
  if (!topbar) return;

  const updateHeaderState = () => {
    topbar.classList.toggle("is-scrolled", window.scrollY > 24);
  };

  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });
}

function setupActiveNavLinks() {
  const sections = [...document.querySelectorAll(SELECTORS.mainSections)];
  const navLinks = [...document.querySelectorAll(SELECTORS.navActiveLinks)];

  if (!sections.length || !navLinks.length) return;

  const linksMap = new Map();

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || !href.startsWith("#")) return;

    linksMap.set(href.slice(1), link);
  });

  const setActiveLink = (sectionId) => {
    navLinks.forEach((link) => {
      link.classList.remove("is-active");
      link.removeAttribute("aria-current");
    });

    const activeLink = linksMap.get(sectionId);
    if (!activeLink) return;

    activeLink.classList.add("is-active");
    activeLink.setAttribute("aria-current", "true");
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visibleSections = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (!visibleSections.length) return;

      const currentSectionId = visibleSections[0].target.id;
      setActiveLink(currentSectionId);
    },
    {
      root: null,
      rootMargin: "-35% 0px -45% 0px",
      threshold: [0.2, 0.35, 0.5, 0.7],
    },
  );

  sections.forEach((section) => observer.observe(section));
}

function setupScrollProgress() {
  const progressBar = document.querySelector(SELECTORS.progressBar);
  if (!progressBar) return;

  const updateProgress = () => {
    const scrollTop = window.scrollY;
    const scrollableHeight =
      document.documentElement.scrollHeight - window.innerHeight;

    const progress =
      scrollableHeight > 0 ? (scrollTop / scrollableHeight) * 100 : 0;

    progressBar.style.width = `${Math.min(Math.max(progress, 0), 100)}%`;
  };

  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
}

function setupRevealAnimations() {
  const revealElements = [
    ...document.querySelectorAll(SELECTORS.revealElements),
  ];
  if (!revealElements.length) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (prefersReducedMotion) {
    revealElements.forEach((element) => {
      element.classList.add("is-visible");
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries, revealObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -5% 0px",
    },
  );

  revealElements.forEach((element) => observer.observe(element));
}

function init() {
  setupMobileNav();
  setupHeaderScrollState();
  setupActiveNavLinks();
  setupScrollProgress();
  setupRevealAnimations();
}

document.addEventListener("DOMContentLoaded", init);
