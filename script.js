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
  ".clubs-heading > *",
  ".club-card",
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
const statusFeedback = document.querySelector("#status-feedback");
const gradeSelect = document.querySelector("#grade");
const strandRow = document.querySelector("#strand-row");
const strandSelect = document.querySelector("#strand");
const submitButton = inquiryForm.querySelector('button[type="submit"]');
const responseFrame = document.querySelector('iframe[name="google-form-response"]');
const accountLoginTrigger = document.querySelector("#account-login-trigger");
const accountLoginDialog = document.querySelector("#account-login-dialog");
const accountLoginForm = document.querySelector("#account-login-form");
const accountLoginEmail = document.querySelector("#account-login-email");
const accountLoginEmailField = document.querySelector("#account-login-email-field");
const accountLoginSubmit = document.querySelector("#account-login-submit");
const accountLogoutButton = document.querySelector("#account-logout");
const accountLoginFeedback = document.querySelector("#account-login-feedback");
let submissionInProgress = false;
let statusCheckInProgress = false;
let accountStatusRefreshTimer = null;

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

const applicationStatusCsvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSdLE3Iwag4JTKcZs8JPrwL2Gj4L9eQG6GycI-1BOqQMvcEzcozHvYJ7lVTk_rUJW5NmSS2Bx3JAO-t/pub?output=csv";
const inquiryEmailInput = inquiryForm.querySelector("#email");
const accountEmailStorageKey = "dhla-demo-account-email";
const accountStatusRefreshInterval = 5000;

function parseCsvRows(csv) {
  const rows = [];
  let row = [];
  let field = "";
  let insideQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];

    if (insideQuotes) {
      if (character === '"' && csv[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        insideQuotes = false;
      } else {
        field += character;
      }
    } else if (character === '"' && field.length === 0) {
      insideQuotes = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && csv[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((value) => value.trim() !== "")) rows.push(row);
  }

  return rows;
}

function displayApplicationStatus(kind, status, detail) {
  const statusKey = JSON.stringify([kind, status, detail]);
  if (statusFeedback.dataset.statusKey !== statusKey) {
    statusFeedback.className = `status-feedback status-${kind}`;
    statusFeedback.setAttribute("role", "region");
    statusFeedback.setAttribute("aria-label", "Enrollment application status");
    const badge = makeElement("span", "status-badge", status);
    const message = makeElement("p", "status-detail", detail);
    message.setAttribute("role", "status");
    message.setAttribute("aria-live", "polite");
    const updated = makeElement("span", "status-updated");
    updated.setAttribute("aria-live", "off");
    statusFeedback.replaceChildren(badge, message, updated);
    statusFeedback.dataset.statusKey = statusKey;
  }
  const updated = statusFeedback.querySelector(".status-updated");
  updated.textContent = `Updated ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · auto-refreshes every 5 seconds`;
  updated.classList.remove("is-stale");
  updated.removeAttribute("title");
  statusFeedback.hidden = false;
}

async function lookupApplication(email) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);
  let response;
  try {
    response = await fetch(applicationStatusCsvUrl, {
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }
  if (!response.ok) {
    throw new Error(`The published spreadsheet returned ${response.status}.`);
  }

  const rows = parseCsvRows(await response.text());
  const headers = rows.shift()?.map((header) => header.trim().replace(/^\uFEFF/, "").toLowerCase()) ?? [];
  const emailColumn = headers.indexOf("email address");
  const statusColumn = headers.indexOf("status");
  if (emailColumn < 0 || statusColumn < 0) {
    throw new Error("The published spreadsheet needs “Email Address” and “Status” columns.");
  }
  const matchingRow = rows.slice().reverse().find((values) => (
    (values[emailColumn] ?? "").trim().toLowerCase() === email.trim().toLowerCase()
  ));
  if (!matchingRow) return null;

  const recordedStatus = (matchingRow[statusColumn] ?? "").trim();
  const status = recordedStatus || "Pending";
  const normalizedStatus = status.toLocaleLowerCase();
  const kind = normalizedStatus === "accepted"
    ? "accepted"
    : normalizedStatus === "pending" || !recordedStatus
      ? "pending"
      : "other";
  const detail = !recordedStatus
    ? "No review status has been entered yet; this demo shows it as pending."
    : kind === "accepted"
      ? "Your application is marked as accepted."
      : kind === "pending"
        ? "Your application is awaiting review."
        : "This is the latest status listed for your application.";
  return { kind, status, detail };
}

function showStatus(kind, status, detail, { focus = true } = {}) {
  displayApplicationStatus(kind, status, detail);
  if (focus) statusFeedback.focus();
}

function setDemoAccount(email) {
  localStorage.setItem(accountEmailStorageKey, email);
  accountLoginTrigger.textContent = "My account";
  accountLoginTrigger.setAttribute("aria-label", `Signed in as ${email}`);
  accountLoginEmail.value = email;
  accountLoginEmail.readOnly = true;
  accountLoginEmailField.hidden = true;
  accountLoginSubmit.disabled = true;
  accountLoginSubmit.hidden = true;
  accountLogoutButton.hidden = false;
  inquiryEmailInput.value = email;
  inquiryEmailInput.readOnly = true;
}

function showNoApplicationMessage(detail, { focus = true } = {}) {
  showStatus("not-found", "No application found", detail, { focus });
  inquiryForm.hidden = false;
}

async function checkAndDisplayAccount(email, { focus = true, requireSavedAccount = false } = {}) {
  if (statusCheckInProgress) return null;
  statusCheckInProgress = true;
  try {
    const application = await lookupApplication(email);
    if (requireSavedAccount && localStorage.getItem(accountEmailStorageKey)?.toLowerCase() !== email.toLowerCase()) {
      return null;
    }
    if (application) {
      showStatus(application.kind, application.status, application.detail, { focus });
      inquiryForm.hidden = true;
    } else {
      showNoApplicationMessage("No inquiry is recorded for this email yet. You can complete the form below.", { focus });
    }
    return application;
  } finally {
    statusCheckInProgress = false;
  }
}

function stopAccountStatusRefresh() {
  if (accountStatusRefreshTimer !== null) {
    window.clearInterval(accountStatusRefreshTimer);
    accountStatusRefreshTimer = null;
  }
}

function startAccountStatusRefresh(email) {
  stopAccountStatusRefresh();
  accountStatusRefreshTimer = window.setInterval(async () => {
    if (statusCheckInProgress || localStorage.getItem(accountEmailStorageKey)?.toLowerCase() !== email.toLowerCase()) return;

    try {
      await checkAndDisplayAccount(email, { focus: false, requireSavedAccount: true });
    } catch (error) {
      console.error("Unable to refresh the application status.", error);
      if (localStorage.getItem(accountEmailStorageKey)?.toLowerCase() === email.toLowerCase()) {
        const updated = statusFeedback.querySelector(".status-updated");
        if (updated) {
          updated.textContent = "Could not refresh; retrying in 5 seconds";
          updated.title = error.message;
          updated.classList.add("is-stale");
        }
      }
    }
  }, accountStatusRefreshInterval);
}

accountLoginTrigger.addEventListener("click", () => {
  const savedEmail = localStorage.getItem(accountEmailStorageKey);
  accountLoginEmail.value = savedEmail || inquiryEmailInput.value;
  accountLoginEmail.readOnly = Boolean(savedEmail);
  accountLoginEmailField.hidden = Boolean(savedEmail);
  accountLoginSubmit.disabled = Boolean(savedEmail);
  accountLoginSubmit.hidden = Boolean(savedEmail);
  accountLogoutButton.hidden = !savedEmail;
  accountLoginFeedback.textContent = "";
  accountLoginFeedback.hidden = true;
  accountLoginDialog.showModal();
  accountLoginEmail.focus();
});

document.querySelector("#account-login-close").addEventListener("click", () => {
  accountLoginDialog.close();
});

accountLogoutButton.addEventListener("click", () => {
  stopAccountStatusRefresh();
  localStorage.removeItem(accountEmailStorageKey);
  accountLoginTrigger.textContent = "Account login";
  accountLoginTrigger.removeAttribute("aria-label");
  accountLoginEmail.value = "";
  accountLoginEmail.readOnly = false;
  accountLoginEmailField.hidden = false;
  accountLoginSubmit.disabled = false;
  accountLoginSubmit.hidden = false;
  accountLogoutButton.hidden = true;
  inquiryEmailInput.value = "";
  inquiryEmailInput.readOnly = false;
  inquiryForm.hidden = false;
  statusFeedback.hidden = true;
  statusFeedback.replaceChildren();
  delete statusFeedback.dataset.statusKey;
  accountLoginDialog.close();
});

accountLoginDialog.addEventListener("click", (event) => {
  if (event.target === accountLoginDialog) accountLoginDialog.close();
});

accountLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const savedEmail = localStorage.getItem(accountEmailStorageKey);
  if (savedEmail) return;
  if (!accountLoginForm.reportValidity() || statusCheckInProgress) return;
  const email = accountLoginEmail.value.trim();
  accountLoginSubmit.disabled = true;
  accountLoginFeedback.textContent = "Checking the published enrollment spreadsheet…";
  accountLoginFeedback.hidden = false;
  try {
    await checkAndDisplayAccount(email);
    setDemoAccount(email);
    startAccountStatusRefresh(email);
    accountLoginDialog.close();
    document.querySelector("#enrollment").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    console.error("Unable to check the application status.", error);
    accountLoginFeedback.textContent = error.name === "AbortError"
      ? "The status check timed out. Please try again."
      : "The published spreadsheet could not be reached. Please try again before sending an inquiry.";
  } finally {
    accountLoginSubmit.disabled = false;
  }
});

inquiryForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!inquiryForm.reportValidity() || submissionInProgress || statusCheckInProgress) return;
  const email = inquiryEmailInput.value.trim();
  submitButton.disabled = true;
  formFeedback.textContent = "Checking for an existing inquiry before sending…";
  formFeedback.hidden = false;

  try {
    const application = await lookupApplication(email);
    if (application) {
      showStatus(application.kind, application.status, "An inquiry with this email is already recorded. No duplicate inquiry was sent.");
      inquiryForm.hidden = true;
      return;
    }

    showNoApplicationMessage("No previous inquiry was found. Your inquiry is being sent now.");
    formFeedback.textContent = "Sending your inquiry to Google Forms…";
    formFeedback.hidden = false;
    submissionInProgress = true;
    HTMLFormElement.prototype.submit.call(inquiryForm);
  } catch (error) {
    console.error("Unable to check for an existing inquiry.", error);
    showStatus(
      "unavailable",
      "Unable to verify",
      error.name === "AbortError"
        ? "The spreadsheet check timed out. Your inquiry was not sent; please try again."
        : "The spreadsheet could not be reached. Your inquiry was not sent; please try again later or contact the academy.",
    );
    formFeedback.textContent = "Your inquiry was not sent because the duplicate check could not be completed.";
    formFeedback.hidden = false;
  } finally {
    if (!submissionInProgress) submitButton.disabled = false;
  }
});

const savedAccountEmail = localStorage.getItem(accountEmailStorageKey);
if (savedAccountEmail) {
  setDemoAccount(savedAccountEmail);
  startAccountStatusRefresh(savedAccountEmail);
  checkAndDisplayAccount(savedAccountEmail).catch((error) => {
    console.error("Unable to restore the demo account status.", error);
    showStatus("unavailable", "Status unavailable", "The spreadsheet could not be reached. Automatic checks will retry every 5 seconds.");
    const updated = statusFeedback.querySelector(".status-updated");
    if (updated) {
      updated.textContent = "Could not refresh; retrying in 5 seconds";
      updated.classList.add("is-stale");
    }
  });
}

responseFrame.addEventListener("load", () => {
  if (!submissionInProgress) return;

  submissionInProgress = false;
  submitButton.disabled = false;
  formFeedback.replaceChildren(
    document.createTextNode("Google Forms may require sign-in, and this page cannot confirm whether your inquiry was accepted. If prompted, open the form directly or contact the academy: "),
  );
  const formLink = document.createElement("a");
  formLink.href = "https://docs.google.com/forms/d/e/1FAIpQLSd4diHGpYbc2F1xBsvnhcep1Gwej70uXtsUgeBL7k_y_dfuPQ/viewform";
  formLink.target = "_blank";
  formLink.rel = "noopener noreferrer";
  formLink.textContent = "open the Google Form";
  formFeedback.append(formLink, document.createTextNode(" or email deehwaliongacademy@gmail.com."));
  formFeedback.focus();
});

function makeElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function makeIcon(name, className = "icon") {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  icon.classList.add(...className.split(" "));
  icon.setAttribute("aria-hidden", "true");
  use.setAttribute("href", `#icon-${name}`);
  icon.append(use);
  return icon;
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
    const link = makeElement("a", "update-link");
    link.href = item.link;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.append(document.createTextNode(item.linkLabel), makeIcon("arrow-up-right"));
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

function renderFeaturedClubs(clubs) {
  const grid = document.querySelector("[data-clubs]");
  if (!Array.isArray(clubs) || clubs.length === 0) {
    throw new Error("The featured clubs list needs at least one entry in content.json.");
  }

  const cards = clubs.map((club) => {
    const card = makeElement("article", "club-card");
    const logoFrame = makeElement("div", "club-logo-frame");
    const logo = makeElement("img", "club-logo");
    logo.src = club.logo;
    logo.alt = club.logoAlt;
    logo.loading = "lazy";
    logo.decoding = "async";
    logo.draggable = false;
    logoFrame.append(logo);

    const content = makeElement("div", "club-content");
    content.append(
      makeElement("span", "club-category", club.category),
      makeElement("h3", "", club.name),
      makeElement("p", "", club.description),
    );
    card.append(logoFrame, content);
    return card;
  });

  grid.replaceChildren(...cards);
  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    const clubRevealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });

    cards.forEach((card, index) => {
      card.dataset.reveal = "";
      card.style.transitionDelay = `${Math.min(index, 3) * 70}ms`;
      clubRevealObserver.observe(card);
    });
  }
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
    renderFeaturedClubs(content.clubs);
  } catch (error) {
    console.error("Unable to load the school news, events, and gallery.", error);
    document.querySelectorAll(".carousel-message").forEach((message) => {
      message.textContent = "School updates could not be loaded. Please refresh the page to try again.";
      message.classList.add("carousel-load-error");
    });
    const clubsMessage = document.querySelector("[data-clubs] .club-message");
    if (clubsMessage) {
      clubsMessage.textContent = "Featured clubs could not be loaded. Please refresh the page to try again.";
      clubsMessage.classList.add("carousel-load-error");
    }
  }
}

loadSchoolContent();
