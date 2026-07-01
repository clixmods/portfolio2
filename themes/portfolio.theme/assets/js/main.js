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
    var selTech = [];

    var applyFilter = function () {
      cards.forEach(function (c) {
        var m = c.getAttribute("data-main") || "";
        var s = c.getAttribute("data-sub") || "";
        var techs = (" " + (c.getAttribute("data-tech") || "") + " ");
        var catOk = (curMain === "all" || m === curMain) && (curSub === "all" || s === curSub);
        var techOk = selTech.every(function (t) { return techs.indexOf(" " + t + " ") > -1; });
        c.classList.toggle("is-hidden", !(catOk && techOk));
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

    // Filtres avancés (techno) — panneau repliable
    var advToggle = fbar.querySelector("[data-adv-toggle]");
    var advPanel = fbar.querySelector("[data-adv-panel]");
    if (advToggle && advPanel) {
      advToggle.addEventListener("click", function () {
        var open = advPanel.hasAttribute("hidden");
        if (open) { advPanel.removeAttribute("hidden"); } else { advPanel.setAttribute("hidden", ""); }
        advToggle.setAttribute("aria-expanded", open ? "true" : "false");
        advToggle.classList.toggle("open", open);
      });
    }
    fbar.querySelectorAll("[data-tech-key]").forEach(function (b) {
      b.addEventListener("click", function () {
        var key = b.getAttribute("data-tech-key");
        var on = b.classList.toggle("active");
        if (on) { selTech.push(key); }
        else { selTech = selTech.filter(function (t) { return t !== key; }); }
        applyFilter();
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
    var expanded = false;

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

    var moreLabel = testi.getAttribute("data-more-label") || "Voir plus";
    var lessLabel = testi.getAttribute("data-less-label") || "Voir moins";

    var schedule = function () {
      clearTimeout(timer);
      if (paused || expanded || reduce || slides.length < 2) return;
      var dur = durationOf(idx);
      runBar(dur);
      timer = setTimeout(function () { go(idx + 1); }, dur);
    };

    // Affiche « Voir plus » seulement si la citation déborde (état clampé)
    var updateMore = function () {
      var slide = slides[idx];
      var quote = slide.querySelector(".testi-quote");
      var btn = slide.querySelector("[data-more]");
      if (!quote || !btn) return;
      if (slide.classList.contains("expanded")) { btn.hidden = false; return; }
      btn.hidden = quote.scrollHeight - quote.clientHeight <= 4;
    };

    var collapseAll = function () {
      expanded = false;
      slides.forEach(function (s) {
        s.classList.remove("expanded");
        var b = s.querySelector("[data-more]");
        if (b) b.textContent = moreLabel;
      });
    };

    var go = function (n) {
      slides[idx].classList.remove("is-active");
      if (dots[idx]) dots[idx].classList.remove("is-active");
      idx = (n + slides.length) % slides.length;
      collapseAll();
      slides[idx].classList.add("is-active");
      if (dots[idx]) dots[idx].classList.add("is-active");
      updateMore();
      schedule();
    };

    slides.forEach(function (s) {
      var btn = s.querySelector("[data-more]");
      if (!btn) return;
      btn.addEventListener("click", function () {
        expanded = s.classList.toggle("expanded");
        btn.textContent = expanded ? lessLabel : moreLabel;
        if (expanded) {
          clearTimeout(timer);
          if (bar) { bar.style.transition = "none"; bar.style.width = "0%"; }
        } else {
          schedule();
        }
      });
    });

    dots.forEach(function (d) {
      d.addEventListener("click", function () {
        go(parseInt(d.getAttribute("data-i"), 10));
      });
    });
    window.addEventListener("resize", updateMore);

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

    updateMore();
    schedule();
  }

  // ── Chips spécialités : défilement du texte au survol si débordement ──
  document.querySelectorAll(".proj-chip-spec").forEach(function (chip) {
    var label = chip.querySelector(".chip-label");
    if (!label) return;
    chip.addEventListener("mouseenter", function () {
      var over = label.scrollWidth - label.clientWidth;
      if (over > 2) {
        label.style.textOverflow = "clip";
        label.style.transform = "translateX(-" + over + "px)";
      }
    });
    chip.addEventListener("mouseleave", function () {
      label.style.transform = "";
      label.style.textOverflow = "";
    });
  });

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
