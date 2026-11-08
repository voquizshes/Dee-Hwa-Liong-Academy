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
const submitButton = inquiryForm.querySelector('button[type="submit"]');
const responseFrame = document.querySelector('iframe[name="google-form-response"]');
let submissionInProgress = false;

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
  submissionInProgress = true;
  submitButton.disabled = true;
  formFeedback.textContent = "Sending your inquiry to Google Forms…";
  formFeedback.hidden = false;
});

responseFrame.addEventListener("load", () => {
  if (!submissionInProgress) return;

  submissionInProgress = false;
  submitButton.disabled = false;
  formFeedback.textContent = "Your inquiry was sent to Google Forms. This page is still open.";
  formFeedback.focus();
});

function makeElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function createCarouselCard(item, index, total, kind) {
  const card = makeElement(kind === "gallery" ? "figure" : "article", `${kind}-card`);
  card.classList.add("carousel-slide");
  if (kind !== "gallery") card.classList.add("update-card");
  card.setAttribute("role", "group");
  card.setAttribute("aria-roledescription", kind === "gallery" ? "slide" : "slide");
  card.setAttribute("aria-label", `${index + 1} of ${total}`);

  if (kind === "gallery") {
    const imageWrap = makeElement("div", "gallery-image");
    const image = makeElement("img");
    image.src = item.image;
    image.alt = item.imageAlt;
    image.loading = index === 0 ? "eager" : "lazy";
    image.decoding = "async";
    image.draggable = false;
    imageWrap.append(image);
    const caption = makeElement("figcaption");
    caption.append(makeElement("span", "", item.title));
    caption.append(makeElement("span", "", String(index + 1).padStart(2, "0")));
    card.append(imageWrap, caption);
    return card;
  }

  const image = makeElement("img", "update-image");
  image.src = item.image;
  image.alt = item.imageAlt;
  image.loading = index === 0 ? "eager" : "lazy";
  image.decoding = "async";
  image.draggable = false;

  const content = makeElement("div", "update-content");
  const meta = makeElement("div", "update-meta");
  meta.append(makeElement("span", "update-category", item.category));
  meta.append(makeElement("time", "", item.dateLabel));
  meta.lastElementChild.dateTime = item.date;
  const title = makeElement("h4", "", item.title);
  const description = makeElement("p", "", item.description);
  content.append(meta, title, description);
  if (item.link && item.linkLabel) {
    const link = makeElement("a", "update-link", `${item.linkLabel} ↗`);
    link.href = item.link;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    content.append(link);
  }

  card.append(image, content);
  return card;
}

function setupCarousel(root, items, kind) {
  const slidesRegion = root.querySelector("[data-slides]");
  const count = root.querySelector("[data-count]");
  const previous = root.querySelector("[data-previous]");
  const next = root.querySelector("[data-next]");
  const carouselName = kind === "gallery" ? "school photos" : kind === "events" ? "school events" : "news stories";

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error(`The ${kind} carousel needs at least one item in content.json.`);
  }

  const slides = items.map((item, index) => createCarouselCard(item, index, items.length, kind));
  slidesRegion.replaceChildren(...slides);
  let activeIndex = 0;
  let pointerStart = null;
  let dragOffset = 0;
  let dragged = false;
  slidesRegion.setAttribute("aria-label", `Swipe or drag to browse ${carouselName}. Arrow buttons are also available.`);
  slidesRegion.setAttribute("tabindex", "0");

  function showSlide(index) {
    activeIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeIndex;
      slide.setAttribute("aria-hidden", String(!isActive));
      slide.inert = !isActive;
      slide.classList.toggle("is-active", isActive);
    });
    slidesRegion.style.transform = `translate3d(-${activeIndex * 100}%, 0, 0)`;
    count.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
  }

  slidesRegion.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showSlide(activeIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      showSlide(activeIndex + 1);
    }
  });

  slidesRegion.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.target.closest("a, button, input, select, textarea")) return;

    event.preventDefault();
    pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
    dragOffset = 0;
    dragged = false;
    slidesRegion.setPointerCapture(event.pointerId);
    slidesRegion.style.transition = "none";
  });

  slidesRegion.addEventListener("pointermove", (event) => {
    if (!pointerStart || event.pointerId !== pointerStart.id) return;

    dragOffset = event.clientX - pointerStart.x;
    const verticalOffset = event.clientY - pointerStart.y;
    if (Math.abs(dragOffset) <= Math.abs(verticalOffset)) return;

    if (Math.abs(dragOffset) > 8) dragged = true;
    slidesRegion.style.transform = `translate3d(calc(-${activeIndex * 100}% + ${dragOffset}px), 0, 0)`;
  });

  function finishDrag(event) {
    if (!pointerStart || event.pointerId !== pointerStart.id) return;

    const threshold = Math.min(80, slidesRegion.clientWidth * 0.18);
    const direction = Math.abs(dragOffset) >= threshold
      ? (dragOffset < 0 ? 1 : -1)
      : 0;
    pointerStart = null;
    dragOffset = 0;
    slidesRegion.style.transition = "";
    showSlide(activeIndex + direction);

    if (dragged) {
      window.setTimeout(() => {
        dragged = false;
      }, 0);
    }
  }

  slidesRegion.addEventListener("pointerup", finishDrag);
  slidesRegion.addEventListener("pointercancel", finishDrag);
  slidesRegion.addEventListener("click", (event) => {
    if (!dragged) return;
    event.preventDefault();
    event.stopPropagation();
    dragged = false;
  }, true);

  previous.addEventListener("click", () => showSlide(activeIndex - 1));
  next.addEventListener("click", () => showSlide(activeIndex + 1));
  showSlide(0);
}

async function loadSchoolContent() {
  try {
    const response = await fetch("content.json");
    if (!response.ok) {
      throw new Error(`Could not load content.json (${response.status}).`);
    }

    const content = await response.json();
    setupCarousel(document.querySelector('[data-carousel="news"]'), content.news, "news");
    setupCarousel(document.querySelector('[data-carousel="events"]'), content.events, "events");
    setupCarousel(document.querySelector('[data-carousel="gallery"]'), content.gallery, "gallery");
  } catch (error) {
    console.error("Unable to load the school news, events, and gallery.", error);
    document.querySelectorAll(".carousel-message").forEach((message) => {
      message.textContent = "School updates could not be loaded. Please refresh the page to try again.";
      message.classList.add("carousel-load-error");
    });
  }
}

loadSchoolContent();
