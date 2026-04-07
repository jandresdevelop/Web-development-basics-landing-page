function setupMobileNav() {
  const navToggle = document.querySelector(".nav-toggle");
  const siteNav = document.querySelector(".site-nav");
  const navLinks = document.querySelectorAll(".site-nav a");

  if (!navToggle || !siteNav || !navLinks.length) return;

  const firstNavLink = navLinks[0];

  const openMenu = () => {
    siteNav.classList.add("is-open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Close navigation menu");
    document.body.style.overflow = "hidden";
    firstNavLink?.focus();
  };

  const closeMenu = ({ focusToggle = false } = {}) => {
    siteNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation menu");
    document.body.style.overflow = "";

    if (focusToggle) {
      navToggle.focus();
    }
  };

  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.contains("is-open");

    if (isOpen) {
      closeMenu({ focusToggle: true });
    } else {
      openMenu();
    }
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });

  document.addEventListener("click", (event) => {
    const isMenuOpen = siteNav.classList.contains("is-open");
    if (!isMenuOpen) return;

    const clickedInsideNav = siteNav.contains(event.target);
    const clickedToggle = navToggle.contains(event.target);

    if (!clickedInsideNav && !clickedToggle) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && siteNav.classList.contains("is-open")) {
      closeMenu({ focusToggle: true });
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768 && siteNav.classList.contains("is-open")) {
      closeMenu();
    }
  });
}

function setupHeaderScrollState() {
  const topbar = document.querySelector(".topbar");
  if (!topbar) return;

  const updateHeaderState = () => {
    if (window.scrollY > 24) {
      topbar.classList.add("is-scrolled");
    } else {
      topbar.classList.remove("is-scrolled");
    }
  };

  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });
}

function setupActiveNavLinks() {
  const sections = document.querySelectorAll("main section[id]");
  const navLinks = document.querySelectorAll("[data-nav-link]");

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

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visibleSections = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (!visibleSections.length) return;

      const activeSectionId = visibleSections[0].target.id;
      setActiveLink(activeSectionId);
    },
    {
      root: null,
      rootMargin: "-35% 0px -45% 0px",
      threshold: [0.2, 0.35, 0.5, 0.7],
    },
  );

  sections.forEach((section) => sectionObserver.observe(section));
}

function setupScrollProgress() {
  const progressBar = document.querySelector(".scroll-progress-bar");
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
  const revealElements = document.querySelectorAll(".reveal");
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (!revealElements.length) return;

  if (prefersReducedMotion) {
    revealElements.forEach((element) => {
      element.classList.add("is-visible");
    });
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.15 },
  );

  revealElements.forEach((element) => {
    revealObserver.observe(element);
  });
}

function init() {
  setupMobileNav();
  setupHeaderScrollState();
  setupActiveNavLinks();
  setupScrollProgress();
  setupRevealAnimations();
}

document.addEventListener("DOMContentLoaded", init);
