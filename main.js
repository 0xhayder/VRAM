/**
 * VRAM Landing Page - Pure Vanilla JavaScript
 */

(function () {
  "use strict";

  // Configuration & Constants
  const SITE = {
    contract: "0x04250b8b0D6Ce8Cf8b2477F9D451fC508d565472",
    buyUrl: "https://www.ponsfamily.com/launchpad/0x04250b8b0D6Ce8Cf8b2477F9D451fC508d565472",
    xUrl: "https://x.com/VRAMlabs",
    siteUrl: "https://vram.lol",
    cols: 16,
    rows: 8,
    defaultActiveCell: 61,
    litCells: new Set([
      3, 9, 18, 21, 27, 34, 40, 45, 52, 61, 66, 73, 80, 88, 91, 99, 108, 114, 119, 125,
    ]),
  };

  const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // -------------------------------------------------------------
  // 1. Toast Notification System
  // -------------------------------------------------------------
  const noticeContainer = document.getElementById("noticeContainer");
  let noticeTimer = null;

  function showNotice(text) {
    if (!noticeContainer) return;

    if (noticeTimer) {
      clearTimeout(noticeTimer);
    }

    noticeContainer.innerHTML = `
      <div class="notice-box notice-enter">
        <span class="status-dot" style="animation: none;"></span>
        <span class="font-mono text-kicker text-subtle">SYS</span>
        <span class="font-mono" style="font-size: 0.75rem; letter-spacing: 0.025em; color: var(--color-foreground);">
          ${escapeHtml(text)}
        </span>
      </div>
    `;

    noticeTimer = setTimeout(() => {
      noticeContainer.innerHTML = "";
    }, 2300);
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // -------------------------------------------------------------
  // 2. Memory Module Matrix Visualizer
  // -------------------------------------------------------------
  function hexAddr(row) {
    return `0x${(row * 16).toString(16).toUpperCase().padStart(4, "0")}`;
  }

  function initMemoryModule() {
    const gridEl = document.getElementById("memoryGrid");
    const addrEl = document.getElementById("memAddr");
    const bankEl = document.getElementById("memBank");
    const allocEl = document.getElementById("memAlloc");

    if (!gridEl) return;

    const totalCells = SITE.cols * SITE.rows;

    function updateInspector(cellIndex) {
      const active = cellIndex !== null ? cellIndex : SITE.defaultActiveCell;
      const row = Math.floor(active / SITE.cols);
      const bank = String((active % 8) + 1).padStart(2, "0");

      if (addrEl) addrEl.textContent = `ADDR ${hexAddr(row)}`;
      if (bankEl) bankEl.textContent = `BANK ${bank}`;
    }

    // Build the 128 cells
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement("div");
      const isLit = SITE.litCells.has(i);

      cell.className = isLit ? "mem-cell-lit" : "mem-cell";
      if (isLit && !isReducedMotion) {
        cell.style.animationDelay = `${(i % 9) * 180}ms`;
      }

      cell.addEventListener("mouseenter", () => updateInspector(i));
      fragment.appendChild(cell);
    }

    gridEl.appendChild(fragment);
    gridEl.addEventListener("mouseleave", () => updateInspector(null));

    // Initialize display with default active cell
    updateInspector(SITE.defaultActiveCell);

    // Live Allocation Ticker (97.1% - 99.8%)
    if (!isReducedMotion && allocEl) {
      let currentUsage = 97.4;
      setInterval(() => {
        currentUsage = Math.round((currentUsage + 0.1) * 10) / 10;
        if (currentUsage > 99.8) {
          currentUsage = 97.1;
        }
        allocEl.textContent = `ALLOC ${currentUsage.toFixed(1)}%`;
      }, 900);
    }
  }

  // -------------------------------------------------------------
  // 3. Scroll Reveal & VRAM Scale Animation
  // -------------------------------------------------------------
  function initScrollAnimations() {
    const reveals = document.querySelectorAll(".reveal");
    const scaleGrid = document.querySelector(".scale-grid");

    if (isReducedMotion) {
      reveals.forEach((el) => el.classList.add("is-in"));
      if (scaleGrid) {
        scaleGrid.querySelectorAll(".scale-bar").forEach((bar) => bar.classList.add("is-in"));
      }
      return;
    }

    if ("IntersectionObserver" in window) {
      // Reveal observer
      const revealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
      );

      reveals.forEach((el) => revealObserver.observe(el));

      // Scale bars observer
      if (scaleGrid) {
        const scaleObserver = new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const bars = scaleGrid.querySelectorAll(".scale-bar");
                bars.forEach((bar) => bar.classList.add("is-in"));
                observer.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
        );

        scaleObserver.observe(scaleGrid);
      }
    } else {
      // Fallback if IntersectionObserver is not supported
      reveals.forEach((el) => el.classList.add("is-in"));
      if (scaleGrid) {
        scaleGrid.querySelectorAll(".scale-bar").forEach((bar) => bar.classList.add("is-in"));
      }
    }
  }

  // -------------------------------------------------------------
  // 4. Copy Contract to Clipboard
  // -------------------------------------------------------------
  async function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // fall back below
      }
    }

    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      const successful = document.execCommand("copy");
      textArea.remove();
      return successful;
    } catch {
      return false;
    }
  }

  function initCopyButton() {
    const copyBtn = document.getElementById("copyContractBtn");
    const iconBox = document.getElementById("copyIconBox");

    if (!copyBtn || !iconBox) return;

    copyBtn.addEventListener("click", async () => {
      const ok = await copyToClipboard(SITE.contract);
      if (ok) {
        iconBox.classList.add("is-copied");
        showNotice("Copied.");
        setTimeout(() => {
          iconBox.classList.remove("is-copied");
        }, 1800);
      } else {
        showNotice("Copy failed.");
      }
    });
  }

  // -------------------------------------------------------------
  // 5. Interactive Event Listeners
  // -------------------------------------------------------------
  function initInteractiveActions() {
    // Hero 'I NEED MORE VRAM' button
    const needMoreBtn = document.getElementById("needMoreVramBtn");
    if (needMoreBtn) {
      needMoreBtn.addEventListener("click", () => showNotice("Correct."));
    }

    // Token 'BUY $VRAM' action button
    const buyTokenBtn = document.getElementById("buyVramBtnToken");
    if (buyTokenBtn && buyTokenBtn.tagName === "BUTTON") {
      buyTokenBtn.addEventListener("click", () => showNotice("It’s not more VRAM. It’s $VRAM."));
    }

    // Diagnostics / Easter egg buttons
    const eggCpu = document.getElementById("eggCpuBtn");
    if (eggCpu) {
      eggCpu.addEventListener("click", () => showNotice("Absolutely not."));
    }

    const eggGpu = document.getElementById("eggGpuBtn");
    if (eggGpu) {
      eggGpu.addEventListener("click", () => showNotice("Your bank account has declined."));
    }

    const eggVram = document.getElementById("eggVramBtn");
    if (eggVram) {
      eggVram.addEventListener("click", () => showNotice("You already know the answer."));
    }
  }

  // Initialize all components on DOMContentLoaded
  document.addEventListener("DOMContentLoaded", () => {
    initMemoryModule();
    initScrollAnimations();
    initCopyButton();
    initInteractiveActions();
  });
})();
