/* ==========================================================================
   PRIME — the shared premium interaction layer for /templates/*.html
   ==========================================================================
   Each template is a self-contained Tailwind page. This script gives all six
   the same commissioned feel without a build step, a framework or a
   dependency:

     loader        a short brand card that wipes away on load
     progress      a reading hairline at the top of the window
     reveals       sections and cards rise in as they enter the viewport
     cursor        a soft accent ring that trails a fine pointer
     menu          a full-screen navigation for every breakpoint where the
                   template's own header nav is hidden
     lightbox      large content images open full size
     top           a quiet return-to-top control after one screen

   Configuration lives on the script tag itself, one line per template:

     <script src="prime.js"
       data-brand="Atelier Structura"
       data-note="Surveying the site"
       data-accent="#e2c399"
       data-bg="#0d0e11"
       data-ink="#e3e2e6"
       data-font="Syne, sans-serif"
       data-nav='{"projects":"#portfolio","services":"section:4"}'></script>

   `data-nav` maps a link's `data-path` to a real destination — an id selector
   or `section:N` (the Nth section of the page). Dead `href="#"` navigation is
   the one thing a template cannot ship with, so links are rewritten before
   the menu is built.

   Everything is progressive: if this file fails to load, the template is
   exactly the static page it was before. That also means no element is ever
   hidden by CSS unless this script has already marked it.
   ========================================================================== */

(function () {
  "use strict";

  var script = document.currentScript;
  var root = document.documentElement;

  /* ------------------------------------------------------------------------
     Config
     ------------------------------------------------------------------------ */

  var data = (script && script.dataset) || {};

  var brand = data.brand || document.title || "Studio";
  var note = data.note || "Preparing the page";
  var accent = data.accent || "#e2c399";
  var bg = data.bg || "#0d0e11";
  var ink = data.ink || "#e3e2e6";
  var displayFont = data.font || '"Space Grotesk", ui-sans-serif, sans-serif';
  var navMap = readNavMap(data.nav);

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  function readNavMap(raw) {
    if (!raw) return {};
    try {
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      // A typo in one template's map must never take the page down.
      if (window.console) console.warn("prime: data-nav is not valid JSON", error);
      return {};
    }
  }

  function parseHex(hex) {
    var value = String(hex).replace("#", "").trim();
    if (value.length === 3) {
      value = value
        .split("")
        .map(function (character) {
          return character + character;
        })
        .join("");
    }
    var number = parseInt(value, 16);
    if (isNaN(number)) return { r: 226, g: 195, b: 153 };
    return { r: (number >> 16) & 255, g: (number >> 8) & 255, b: number & 255 };
  }

  function rgba(hex, alpha) {
    var colour = parseHex(hex);
    return "rgba(" + colour.r + ", " + colour.g + ", " + colour.b + ", " + alpha + ")";
  }

  function luminance(hex) {
    var colour = parseHex(hex);
    var channel = function (value) {
      value /= 255;
      return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(colour.r) + 0.7152 * channel(colour.g) + 0.0722 * channel(colour.b);
  }

  function writeTokens() {
    var style = root.style;
    style.setProperty("--prime-accent", accent);
    style.setProperty("--prime-accent-soft", rgba(accent, 0.16));
    style.setProperty("--prime-on-accent", luminance(accent) > 0.55 ? "#111111" : "#ffffff");
    style.setProperty("--prime-bg", bg);
    style.setProperty("--prime-ink", ink);
    style.setProperty("--prime-muted", rgba(ink, 0.6));
    style.setProperty("--prime-line", rgba(ink, 0.16));
    style.setProperty("--prime-shadow", "rgba(0, 0, 0, 0.4)");
    style.setProperty("--prime-font", displayFont);
  }

  /* ------------------------------------------------------------------------
     Small helpers
     ------------------------------------------------------------------------ */

  var CLOSE_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  var ARROW_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M12 19V5M5 12l7-7 7 7"/></svg>';

  function sections() {
    return Array.prototype.slice.call(document.querySelectorAll("main section"));
  }

  function headerHeight() {
    var header = document.querySelector("header");
    if (!header) return 0;
    var rect = header.getBoundingClientRect();
    return rect.height || 0;
  }

  function scrollToY(top) {
    window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? "auto" : "smooth" });
  }

  function resolveTarget(value) {
    if (value === "top") return { top: true };
    var match = /^section:(\d+)$/.exec(value);
    if (match) {
      var list = sections();
      var index = parseInt(match[1], 10) - 1;
      var section = list[index];
      if (!section) return null;
      if (!section.id) section.id = "prime-section-" + match[1];
      return { el: section };
    }
    if (value.charAt(0) === "#") {
      var el = document.getElementById(value.slice(1));
      return el ? { el: el } : null;
    }
    return null;
  }

  /* ------------------------------------------------------------------------
     01. Navigation destinations
     ------------------------------------------------------------------------ */

  function applyNavMap() {
    var links = Array.prototype.slice.call(document.querySelectorAll("[data-path]"));
    links.forEach(function (link) {
      var path = link.getAttribute("data-path");
      var destination = navMap[path];
      if (!destination) return;
      var target = resolveTarget(destination);
      if (!target) return;
      if (target.top) {
        link.setAttribute("href", "#");
      } else if (target.el && target.el.id) {
        link.setAttribute("href", "#" + target.el.id);
      }
    });
  }

  /* ------------------------------------------------------------------------
     02. Scroll: progress + return-to-top share one passive listener
     ------------------------------------------------------------------------ */

  function initScrollChrome() {
    var bar = document.createElement("div");
    bar.className = "prime-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);

    var topButton = document.createElement("button");
    topButton.type = "button";
    topButton.className = "prime-top";
    topButton.setAttribute("aria-label", "Back to top");
    topButton.innerHTML = ARROW_ICON;
    topButton.addEventListener("click", function () {
      scrollToY(0);
    });
    document.body.appendChild(topButton);

    var queued = false;

    function paint() {
      queued = false;
      var scrollable = root.scrollHeight - window.innerHeight;
      var progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      bar.style.transform = "scaleX(" + progress.toFixed(4) + ")";
      bar.classList.toggle("is-live", progress > 0.004);
      topButton.classList.toggle("is-on", window.scrollY > window.innerHeight * 0.9);
    }

    function onScroll() {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(paint);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    paint();
  }

  /* ------------------------------------------------------------------------
     03. Preloader — removed on load, with a hard timeout so a stalled image
     can never leave the page locked
     ------------------------------------------------------------------------ */

  function initLoader() {
    var navigation = performance.getEntriesByType
      ? performance.getEntriesByType("navigation")[0]
      : null;

    if (reduceMotion || (navigation && navigation.type === "back_forward")) {
      // No loader, but the reveal layer still needs its cue to start.
      window.setTimeout(function () {
        document.dispatchEvent(new CustomEvent("prime:ready"));
      }, 0);
      return;
    }

    var loader = document.createElement("div");
    loader.className = "prime-loader";
    loader.setAttribute("aria-hidden", "true");

    var inner = document.createElement("div");
    inner.className = "prime-loader__inner";

    var label = document.createElement("span");
    label.className = "prime-loader__brand";
    label.textContent = brand;

    var track = document.createElement("span");
    track.className = "prime-loader__track";
    var fill = document.createElement("span");
    fill.className = "prime-loader__fill";
    track.appendChild(fill);

    var caption = document.createElement("span");
    caption.className = "prime-loader__note";
    caption.textContent = note;

    inner.appendChild(label);
    inner.appendChild(track);
    inner.appendChild(caption);
    loader.appendChild(inner);
    document.body.appendChild(loader);

    root.classList.add("prime-booting");
    var finished = false;
    var startedAt = performance.now();

    function finish() {
      if (finished) return;
      finished = true;
      loader.classList.add("is-done");
      root.classList.remove("prime-booting");
      document.dispatchEvent(new CustomEvent("prime:ready"));
      window.setTimeout(function () {
        loader.remove();
      }, 900);
    }

    function release() {
      // Give the fill animation time to read as a deliberate beat, not a flash.
      var wait = Math.max(0, 560 - (performance.now() - startedAt));
      window.setTimeout(finish, wait + 420);
    }

    if (document.readyState === "complete") release();
    else window.addEventListener("load", release, { once: true });

    // Belt and braces: a slow font or a dead image must not trap the page.
    window.setTimeout(finish, 2600);
  }

  /* ------------------------------------------------------------------------
     04. Reveals — only real content blocks, never the fixed scrims
     ------------------------------------------------------------------------ */

  function initReveals() {
    if (reduceMotion || !("IntersectionObserver" in window)) return;

    var targets = [];
    var sectionList = sections();

    sectionList.forEach(function (section) {
      Array.prototype.slice.call(section.children).forEach(function (child, index) {
        if (!child || child.nodeType !== 1) return;
        if (child.matches("script, style")) return;
        var position = window.getComputedStyle(child).position;
        if (position === "absolute" || position === "fixed") return;
        targets.push({ el: child, delay: Math.min(index, 6) * 70 });
      });
    });

    var footer = document.querySelector("footer");
    if (footer) {
      Array.prototype.slice.call(footer.children).forEach(function (child, index) {
        if (!child || child.nodeType !== 1) return;
        targets.push({ el: child, delay: Math.min(index, 5) * 70 });
      });
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          el.classList.add("is-in");
          observer.unobserve(el);
          window.setTimeout(function () {
            el.style.willChange = "auto";
          }, 1200);
        });
      },
      { rootMargin: "0px 0px -7% 0px", threshold: 0.06 }
    );

    targets.forEach(function (item) {
      item.el.setAttribute("data-prime-reveal", "");
      item.el.style.setProperty("--prime-delay", item.delay + "ms");
    });

    // Hold the first reveal until the loader has cleared, so the hero rises
    // into view instead of finishing its animation behind the curtain. A
    // timeout covers the case where the loader was skipped entirely.
    var started = false;
    function start() {
      if (started) return;
      started = true;
      targets.forEach(function (item) {
        observer.observe(item.el);
      });
    }

    document.addEventListener("prime:ready", start, { once: true });
    window.setTimeout(start, 2200);
  }

  /* ------------------------------------------------------------------------
     05. Pointer halo — accent ring + dot, fine pointers only, parked when idle
     ------------------------------------------------------------------------ */

  function initCursor() {
    if (reduceMotion || !finePointer) return;

    var ring = document.createElement("div");
    ring.className = "prime-cursor";
    ring.setAttribute("aria-hidden", "true");
    var dot = document.createElement("div");
    dot.className = "prime-cursor__dot";
    dot.setAttribute("aria-hidden", "true");
    document.body.appendChild(ring);
    document.body.appendChild(dot);

    var pointerX = window.innerWidth / 2;
    var pointerY = window.innerHeight / 2;
    var ringX = pointerX;
    var ringY = pointerY;
    var visible = false;
    var frame = 0;

    function tick() {
      frame = 0;
      var deltaX = pointerX - ringX;
      var deltaY = pointerY - ringY;
      ringX += deltaX * 0.16;
      ringY += deltaY * 0.16;
      ring.style.transform =
        "translate3d(" + ringX.toFixed(1) + "px, " + ringY.toFixed(1) + "px, 0)";
      if (Math.abs(deltaX) > 0.25 || Math.abs(deltaY) > 0.25) {
        frame = window.requestAnimationFrame(tick);
      }
    }

    document.addEventListener(
      "pointermove",
      function (event) {
        pointerX = event.clientX;
        pointerY = event.clientY;
        dot.style.transform =
          "translate3d(" + pointerX + "px, " + pointerY + "px, 0)";
        if (!visible) {
          visible = true;
          ring.classList.add("is-on");
          dot.classList.add("is-on");
        }
        if (!frame) frame = window.requestAnimationFrame(tick);
      },
      { passive: true }
    );

    document.addEventListener(
      "pointerover",
      function (event) {
        var interactive = event.target.closest(
          'a, button, input, textarea, select, [role="button"], .prime-zoom'
        );
        ring.classList.toggle("is-active", Boolean(interactive));
      },
      { passive: true }
    );

    document.addEventListener("pointerleave", function () {
      ring.classList.remove("is-on");
      dot.classList.remove("is-on");
      visible = false;
    });
  }

  /* ------------------------------------------------------------------------
     06. Full-screen menu — shown only when the template's own nav is hidden
     ------------------------------------------------------------------------ */

  function initMenu() {
    var navs = Array.prototype.slice.call(document.querySelectorAll("header nav"));
    var firstNav = navs[0] || null;

    var sourceLinks = [];
    var seen = {};

    navs.forEach(function (nav) {
      Array.prototype.slice.call(nav.querySelectorAll("a")).forEach(function (link) {
        var text = (link.textContent || "").trim().replace(/\s+/g, " ");
        if (!text) return;
        var key = text + "|" + (link.getAttribute("href") || "");
        if (seen[key]) return;
        seen[key] = true;
        sourceLinks.push({ text: text, href: link.getAttribute("href") || "#" });
      });
    });

    if (!sourceLinks.length) return;

    var fab = document.createElement("button");
    fab.type = "button";
    fab.className = "prime-fab";
    fab.setAttribute("aria-label", "Open navigation");
    fab.setAttribute("aria-expanded", "false");
    fab.innerHTML = "<span></span><span></span>";
    document.body.appendChild(fab);

    var menu = document.createElement("div");
    menu.className = "prime-menu";
    menu.setAttribute("role", "dialog");
    menu.setAttribute("aria-modal", "true");
    menu.setAttribute("aria-label", "Navigation");

    var top = document.createElement("div");
    top.className = "prime-menu__top";

    var menuBrand = document.createElement("span");
    menuBrand.className = "prime-menu__brand";
    menuBrand.textContent = brand;

    var close = document.createElement("button");
    close.type = "button";
    close.className = "prime-menu__close";
    close.setAttribute("aria-label", "Close navigation");
    close.innerHTML = CLOSE_ICON;

    top.appendChild(menuBrand);
    top.appendChild(close);

    var list = document.createElement("ul");
    list.className = "prime-menu__links";

    sourceLinks.forEach(function (link, index) {
      var item = document.createElement("li");
      var anchor = document.createElement("a");
      anchor.href = link.href;
      anchor.style.setProperty("--i", String(index));
      var number = document.createElement("span");
      number.className = "prime-menu__num";
      number.textContent = (index + 1 < 10 ? "0" : "") + (index + 1);
      anchor.appendChild(number);
      anchor.appendChild(document.createTextNode(link.text));
      item.appendChild(anchor);
      list.appendChild(item);
    });

    var foot = document.createElement("div");
    foot.className = "prime-menu__foot";

    var ctaSource = Array.prototype.slice
      .call(document.querySelectorAll("header a"))
      .filter(function (link) {
        if (link.closest("nav")) return false;
        return /start a project|reserve|order online|get a free quote|book/i.test(
          link.textContent || ""
        );
      })[0];

    if (ctaSource) {
      var cta = document.createElement("a");
      cta.className = "prime-menu__cta";
      cta.href = ctaSource.getAttribute("href") || "#";
      cta.textContent = (ctaSource.textContent || "").trim().replace(/\s+/g, " ") + " →";
      foot.appendChild(cta);
    }

    var hint = document.createElement("span");
    hint.className = "prime-menu__hint";
    hint.textContent = "Tap outside or press Esc to close";
    foot.appendChild(hint);

    menu.appendChild(top);
    menu.appendChild(list);
    menu.appendChild(foot);
    document.body.appendChild(menu);

    var isOpen = false;

    function focusables() {
      return Array.prototype.slice
        .call(menu.querySelectorAll("a[href], button:not([disabled])"))
        .filter(function (el) {
          return el.offsetParent !== null;
        });
    }

    function open() {
      if (isOpen) return;
      isOpen = true;
      menu.classList.add("is-open");
      root.classList.add("prime-locked");
      fab.setAttribute("aria-expanded", "true");
      fab.setAttribute("aria-label", "Close navigation");
      window.setTimeout(function () {
        close.focus();
      }, 30);
    }

    function shut(restoreFocus) {
      if (!isOpen) return;
      isOpen = false;
      menu.classList.remove("is-open");
      root.classList.remove("prime-locked");
      fab.setAttribute("aria-expanded", "false");
      fab.setAttribute("aria-label", "Open navigation");
      if (restoreFocus) fab.focus();
    }

    fab.addEventListener("click", function () {
      if (isOpen) shut(true);
      else open();
    });

    close.addEventListener("click", function () {
      shut(true);
    });

    menu.addEventListener("click", function (event) {
      if (event.target === menu) shut(true);
    });

    list.addEventListener("click", function (event) {
      if (event.target.closest("a")) shut(false);
    });

    menu.addEventListener("keydown", function (event) {
      if (event.key !== "Tab" || !isOpen) return;
      var items = focusables();
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen) shut(true);
    });

    function sync() {
      var hidden = !firstNav || window.getComputedStyle(firstNav).display === "none";
      document.body.classList.toggle("prime-nav-hidden", hidden);
      if (!hidden && isOpen) shut(false);
    }

    sync();
    window.addEventListener("resize", sync, { passive: true });
    window.addEventListener("orientationchange", sync, { passive: true });
  }

  /* ------------------------------------------------------------------------
     07. Lightbox — large content images only; hero art and icons are left
     ------------------------------------------------------------------------ */

  function initLightbox() {
    var hero = sections()[0];
    var images = Array.prototype.slice
      .call(document.querySelectorAll("main img"))
      .filter(function (img) {
        if (img.closest("header, footer, nav")) return false;
        if (hero && hero.contains(img)) return false;
        var anchor = img.closest("a[href]");
        var href = anchor ? anchor.getAttribute("href") : "";
        if (href && href !== "#") return false;
        var rect = img.getBoundingClientRect();
        return rect.width >= 220 && rect.height >= 120;
      });

    if (!images.length) return;

    var box = document.createElement("div");
    box.className = "prime-lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Image preview");

    var figure = document.createElement("figure");
    var picture = document.createElement("img");
    picture.alt = "";
    var caption = document.createElement("figcaption");

    var close = document.createElement("button");
    close.type = "button";
    close.className = "prime-lightbox__close";
    close.setAttribute("aria-label", "Close image preview");
    close.innerHTML = CLOSE_ICON;

    figure.appendChild(picture);
    figure.appendChild(caption);
    box.appendChild(figure);
    box.appendChild(close);
    document.body.appendChild(box);

    var opener = null;
    var isOpen = false;

    images.forEach(function (img) {
      img.classList.add("prime-zoom");
      img.setAttribute("tabindex", "0");
      img.setAttribute("role", "button");
      img.setAttribute("aria-label", "Expand image: " + (img.alt || "photograph"));
    });

    function open(img) {
      opener = img;
      picture.src = img.currentSrc || img.src;
      picture.alt = img.alt || "";
      caption.textContent = img.alt || "";
      box.classList.add("is-open");
      root.classList.add("prime-locked");
      isOpen = true;
      close.focus();
    }

    function shut() {
      if (!isOpen) return;
      isOpen = false;
      box.classList.remove("is-open");
      root.classList.remove("prime-locked");
      if (opener) opener.focus();
    }

    document.addEventListener("click", function (event) {
      var img = event.target.closest("img.prime-zoom");
      if (!img) return;
      event.preventDefault();
      open(img);
    });

    images.forEach(function (img) {
      img.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open(img);
        }
      });
    });

    close.addEventListener("click", shut);
    box.addEventListener("click", function (event) {
      if (event.target === box) shut();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen) shut();
    });
  }

  /* ------------------------------------------------------------------------
     08. Anchor scrolling — all in-page links get the header offset and the
     same easing as the rest of the site
     ------------------------------------------------------------------------ */

  function initAnchors() {
    document.addEventListener("click", function (event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (event.target.closest("img.prime-zoom")) return;

      var anchor = event.target.closest("a[href]");
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      var href = anchor.getAttribute("href");
      if (!href || href.charAt(0) !== "#") return;

      event.preventDefault();

      if (href === "#") {
        scrollToY(0);
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
        return;
      }

      var target = document.getElementById(href.slice(1));
      if (!target) return;

      scrollToY(target.getBoundingClientRect().top + window.scrollY - headerHeight() - 8);
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, "", href);
      }
    });
  }

  /* ------------------------------------------------------------------------
     Boot. Each block is isolated: one unsupported API must not stop the rest.
     ------------------------------------------------------------------------ */

  function safely(fn) {
    try {
      fn();
    } catch (error) {
      root.classList.remove("prime-booting");
      if (window.console) console.warn("prime:", error);
    }
  }

  function boot() {
    writeTokens();
    safely(applyNavMap);
    safely(initScrollChrome);
    safely(initLoader);
    safely(initReveals);
    safely(initCursor);
    safely(initMenu);
    safely(initAnchors);

    // Measure images after layout: widths are only reliable once they settle.
    if (document.readyState === "complete") safely(initLightbox);
    else window.addEventListener("load", function () {
      safely(initLightbox);
    });
  }

  root.classList.add("prime-enhanced");
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
