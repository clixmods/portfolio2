// Thème portfolio — interactions légères (vanilla JS)
(function () {
  "use strict";

  // ── Menu mobile ───────────────────────────────────────
  var burger = document.querySelector("[data-burger]");
  var menu = document.querySelector("[data-mobile-menu]");
  if (burger && menu) {
    burger.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        menu.classList.remove("open");
        burger.classList.remove("is-open");
        document.body.style.overflow = "";
      });
    });
  }

  // ── Navbar : état « scrolled » ────────────────────────
  var navbar = document.querySelector("[data-navbar]");
  if (navbar) {
    var onScroll = function () {
      navbar.classList.toggle("scrolled", window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // ── Reveal au scroll ──────────────────────────────────
  var reveals = document.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // ── Filtrage page Projets (catégorie principale + sous-catégorie) ──
  var fbar = document.querySelector("[data-project-filter]");
  if (fbar) {
    var mains = fbar.querySelectorAll("[data-main]");
    var subRows = fbar.querySelectorAll("[data-subs-for]");
    var cards = document.querySelectorAll("[data-project]");
    var curMain = "all";
    var curSub = "all";

    var applyFilter = function () {
      cards.forEach(function (c) {
        var m = c.getAttribute("data-main") || "";
        var s = c.getAttribute("data-sub") || "";
        var ok = (curMain === "all" || m === curMain) && (curSub === "all" || s === curSub);
        c.classList.toggle("is-hidden", !ok);
      });
    };

    var setSub = function (row, key) {
      curSub = key;
      row.querySelectorAll("[data-sub]").forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-sub") === key);
      });
      applyFilter();
    };

    var setMain = function (key, keepHash) {
      curMain = key;
      curSub = "all";
      mains.forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-main") === key);
      });
      subRows.forEach(function (row) {
        var on = row.getAttribute("data-subs-for") === key;
        row.hidden = !on;
        row.querySelectorAll("[data-sub]").forEach(function (b) {
          b.classList.toggle("active", b.getAttribute("data-sub") === "all");
        });
      });
      applyFilter();
      if (!keepHash && history.replaceState) {
        history.replaceState(null, "", key === "all" ? location.pathname + location.search : "#" + key);
      }
    };

    mains.forEach(function (b) {
      b.addEventListener("click", function () { setMain(b.getAttribute("data-main")); });
    });
    subRows.forEach(function (row) {
      row.querySelectorAll("[data-sub]").forEach(function (b) {
        b.addEventListener("click", function () { setSub(row, b.getAttribute("data-sub")); });
      });
    });

    // Pré-sélection via hash (#jv, #app, #mods, #tools)
    var initial = (location.hash || "").replace("#", "");
    var valid = false;
    mains.forEach(function (b) { if (b.getAttribute("data-main") === initial) valid = true; });
    setMain(valid ? initial : "all", true);
  }

  // ── Carrousel témoignages (un à la fois, auto-défilement) ──
  var testi = document.querySelector("[data-testi]");
  if (testi) {
    var slides = Array.prototype.slice.call(testi.querySelectorAll(".testi-slide"));
    var dots = Array.prototype.slice.call(testi.querySelectorAll(".testi-dot"));
    var bar = testi.querySelector(".testi-progress span");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var idx = 0;
    var timer = null;
    var paused = false;

    var durationOf = function (n) {
      return parseInt(slides[n].getAttribute("data-duration"), 10) || 6000;
    };

    var runBar = function (dur) {
      if (!bar) return;
      bar.style.transition = "none";
      bar.style.width = "0%";
      void bar.offsetWidth; // reflow
      if (!paused && !reduce) {
        bar.style.transition = "width " + dur + "ms linear";
        bar.style.width = "100%";
      }
    };

    var schedule = function () {
      clearTimeout(timer);
      if (paused || reduce || slides.length < 2) return;
      var dur = durationOf(idx);
      runBar(dur);
      timer = setTimeout(function () { go(idx + 1); }, dur);
    };

    var go = function (n) {
      slides[idx].classList.remove("is-active");
      if (dots[idx]) dots[idx].classList.remove("is-active");
      idx = (n + slides.length) % slides.length;
      slides[idx].classList.add("is-active");
      if (dots[idx]) dots[idx].classList.add("is-active");
      schedule();
    };

    dots.forEach(function (d) {
      d.addEventListener("click", function () {
        go(parseInt(d.getAttribute("data-i"), 10));
      });
    });

    testi.addEventListener("mouseenter", function () {
      paused = true;
      clearTimeout(timer);
      if (bar) {
        var w = window.getComputedStyle(bar).width;
        bar.style.transition = "none";
        bar.style.width = w;
      }
    });
    testi.addEventListener("mouseleave", function () {
      paused = false;
      schedule();
    });

    schedule();
  }

  // ── Lightbox galerie projet ───────────────────────────
  var lb = document.querySelector("[data-lightbox-overlay]");
  if (lb) {
    var lbImg = lb.querySelector("img");
    var closeLb = function () {
      lb.classList.remove("open");
      lbImg.src = "";
      document.body.style.overflow = "";
    };
    document.querySelectorAll("[data-lightbox]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var inner = a.querySelector("img");
        lbImg.src = a.getAttribute("href");
        lbImg.alt = inner ? inner.alt : "";
        lb.classList.add("open");
        document.body.style.overflow = "hidden";
      });
    });
    lb.addEventListener("click", closeLb);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lb.classList.contains("open")) closeLb();
    });
  }
})();
