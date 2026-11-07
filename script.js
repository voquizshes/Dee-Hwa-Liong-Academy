const menuToggle = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector("#primary-nav");

function setMenuOpen(isOpen) {
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.querySelector(".sr-only").textContent = isOpen
    ? "Close navigation menu"
    : "Open navigation menu";
  primaryNav.classList.toggle("is-open", isOpen);
}

menuToggle.addEventListener("click", () => {
  const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
  setMenuOpen(!isExpanded);
});

primaryNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    setMenuOpen(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
    setMenuOpen(false);
    menuToggle.focus();
  }
});

const revealTargets = document.querySelectorAll([
  ".intro-heading",
  ".intro-copy",
  ".value-card",
  ".mission-heading",
  ".mission-card",
  ".learning-copy",
  ".learning-list article",
  ".gallery-heading > *",
  ".gallery-card",
  ".enrollment-top > *",
  ".step",
  ".inquiry-form",
  ".closing-content",
].join(", "));
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!prefersReducedMotion && "IntersectionObserver" in window) {
  document.documentElement.classList.add("has-scroll-reveal");
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });

  revealTargets.forEach((target) => {
    target.dataset.reveal = "";
    revealObserver.observe(target);
  });
}

const siteHeader = document.querySelector(".site-header");
const backToTop = document.querySelector(".back-to-top");
let pageChromeFrame = 0;

function updatePageChrome() {
  pageChromeFrame = 0;
  const hasScrolled = window.scrollY > 12;
  siteHeader.classList.toggle("is-scrolled", hasScrolled);
  backToTop.hidden = window.scrollY < 500;

  if (window.scrollY < 200) {
    sectionLinks.forEach((link) => link.removeAttribute("aria-current"));
  }
}

window.addEventListener("scroll", () => {
  if (!pageChromeFrame) {
    pageChromeFrame = window.requestAnimationFrame(updatePageChrome);
  }
}, { passive: true });

const sectionLinks = [...primaryNav.querySelectorAll('a[href^="#"]')];
const navSections = [...new Set(sectionLinks.map((link) => link.hash.slice(1)))]
  .map((id) => document.getElementById(id))
  .filter(Boolean);

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    const activeSection = entries.find((entry) => entry.isIntersecting)?.target;
    if (!activeSection) return;

    sectionLinks.forEach((link) => {
      if (link.hash === `#${activeSection.id}`) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }, { rootMargin: "-25% 0px -65% 0px" });

  navSections.forEach((section) => sectionObserver.observe(section));
}

updatePageChrome();

const inquiryForm = document.querySelector("#inquiry-form");
const formFeedback = document.querySelector("#form-feedback");
const gradeSelect = document.querySelector("#grade");
const strandRow = document.querySelector("#strand-row");
const strandSelect = document.querySelector("#strand");

function updateStrandField() {
  const isSeniorHigh = gradeSelect.value === "SHS";
  strandRow.hidden = !isSeniorHigh;
  strandSelect.disabled = !isSeniorHigh;
  strandSelect.required = isSeniorHigh;

  if (!isSeniorHigh) {
    strandSelect.value = "";
  }
}

gradeSelect.addEventListener("change", updateStrandField);
updateStrandField();

inquiryForm.addEventListener("submit", (event) => {
  formFeedback.textContent = "Google Forms is opening in a new tab. Complete the submission there; this page will stay open.";
  formFeedback.hidden = false;
});
