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

    var advToggleEl = fbar.querySelector("[data-adv-toggle]");
    var advCountEl = fbar.querySelector("[data-adv-count]");
    var resetBtn = fbar.querySelector("[data-filter-reset]");

    // Reflète l'état des filtres : badge de compte + toggle actif + bouton reset
    var updateIndicators = function () {
      if (advCountEl) {
        if (selTech.length) {
          advCountEl.textContent = selTech.length;
          advCountEl.hidden = false;
        } else {
          advCountEl.hidden = true;
        }
      }
      if (advToggleEl) advToggleEl.classList.toggle("active", selTech.length > 0);
      var anyActive = curMain !== "all" || curSub !== "all" || selTech.length > 0;
      if (resetBtn) resetBtn.hidden = !anyActive;
    };

    var applyFilter = function () {
      cards.forEach(function (c) {
        var m = c.getAttribute("data-main") || "";
        var s = c.getAttribute("data-sub") || "";
        var techs = (" " + (c.getAttribute("data-tech") || "") + " ");
        var catOk = (curMain === "all" || m === curMain) && (curSub === "all" || s === curSub);
        var techOk = selTech.every(function (t) { return techs.indexOf(" " + t + " ") > -1; });
        c.classList.toggle("is-hidden", !(catOk && techOk));
      });
      updateIndicators();
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

    // Réinitialisation : catégorie, sous-catégorie et technos
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        selTech = [];
        fbar.querySelectorAll("[data-tech-key].active").forEach(function (b) {
          b.classList.remove("active");
        });
        setMain("all"); // remet curMain/curSub à « all » puis applyFilter()
      });
    }

    // Sélection par défaut : « all » si l'onglet existe (page Projets),
    // sinon le premier onglet disponible (accueil « mis en avant »).
    var mainKeys = [];
    mains.forEach(function (b) { mainKeys.push(b.getAttribute("data-main")); });
    var fallback = mainKeys.indexOf("all") > -1 ? "all" : (mainKeys[0] || "all");

    // Pré-sélection via hash (#jv, #app, #mods, #tools)
    var initial = (location.hash || "").replace("#", "");
    var valid = mainKeys.indexOf(initial) > -1;
    setMain(valid ? initial : fallback, true);
  }

  // ── Carrousel témoignages (un à la fois, auto-défilement) ──
  // Supporte plusieurs carrousels sur une même page (accueil + formations).
  document.querySelectorAll("[data-testi]").forEach(function (testi) {
    var slides = Array.prototype.slice.call(testi.querySelectorAll(".testi-slide"));
    var dots = Array.prototype.slice.call(testi.querySelectorAll(".testi-dot"));
    var bar = testi.querySelector(".testi-progress span");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var idx = 0;
    var timer = null;
    var paused = false;
    var expanded = false;
    // Suivi du temps pour reprendre là où on s'était arrêté (pause au survol)
    var curDur = 0;       // durée pleine de la slide courante
    var remaining = null; // temps restant avant la prochaine slide
    var startTime = 0;    // horodatage du (re)démarrage du minuteur courant

    var durationOf = function (n) {
      return parseInt(slides[n].getAttribute("data-duration"), 10) || 6000;
    };

    // Anime la barre de progression sur `dur` ms.
    // resume=true : repart de la largeur figée courante (ne remet pas à 0).
    var startBar = function (dur, resume) {
      if (!bar) return;
      if (!resume) {
        bar.style.transition = "none";
        bar.style.width = "0%";
        void bar.offsetWidth; // reflow
      }
      if (!paused && !reduce) {
        bar.style.transition = "width " + dur + "ms linear";
        bar.style.width = "100%";
      }
    };

    var moreLabel = testi.getAttribute("data-more-label") || "Voir plus";
    var lessLabel = testi.getAttribute("data-less-label") || "Voir moins";

    // resume=true : reprend le décompte restant (survol) sans le réinitialiser.
    var schedule = function (resume) {
      clearTimeout(timer);
      if (paused || expanded || reduce || slides.length < 2) return;
      if (!resume || remaining == null) {
        curDur = durationOf(idx);
        remaining = curDur;
      }
      startTime = Date.now();
      startBar(remaining, resume);
      timer = setTimeout(function () { go(idx + 1); }, remaining);
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
      remaining = null; // nouvelle slide → durée pleine
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
          remaining = null;
          schedule();
        }
      });
    });

    dots.forEach(function (d) {
      d.addEventListener("click", function () {
        go(parseInt(d.getAttribute("data-i"), 10));
      });
    });

    var prevBtn = testi.querySelector("[data-prev]");
    var nextBtn = testi.querySelector("[data-next]");
    if (prevBtn) prevBtn.addEventListener("click", function () { go(idx - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { go(idx + 1); });
    // Un seul témoignage : navigation inutile
    if (slides.length < 2) {
      if (prevBtn) prevBtn.hidden = true;
      if (nextBtn) nextBtn.hidden = true;
    }

    window.addEventListener("resize", updateMore);

    testi.addEventListener("mouseenter", function () {
      paused = true;
      clearTimeout(timer);
      // Mémorise le temps déjà écoulé pour reprendre ensuite (pas de reset)
      if (remaining != null) {
        remaining = remaining - (Date.now() - startTime);
        if (remaining < 0) remaining = 0;
      }
      if (bar) {
        var w = window.getComputedStyle(bar).width;
        bar.style.transition = "none";
        bar.style.width = w;
      }
    });
    testi.addEventListener("mouseleave", function () {
      paused = false;
      schedule(true); // reprend sur le temps restant
    });

    updateMore();
    schedule();
  });

  // ── Lightbox galerie projet (avec navigation) ─────────
  var lb = document.querySelector("[data-lightbox-overlay]");
  if (lb) {
    var lbImg = lb.querySelector("img");
    var lbPrev = lb.querySelector("[data-lightbox-prev]");
    var lbNext = lb.querySelector("[data-lightbox-next]");
    var group = []; // [{ src, alt }]
    var current = 0;

    var render = function () {
      var item = group[current];
      if (!item) return;
      lbImg.src = item.src;
      lbImg.alt = item.alt;
    };
    var openLb = function () {
      var multi = group.length > 1;
      if (lbPrev) lbPrev.hidden = !multi;
      if (lbNext) lbNext.hidden = !multi;
      lb.classList.add("open");
      document.body.style.overflow = "hidden";
    };
    var closeLb = function () {
      lb.classList.remove("open");
      lbImg.src = "";
      document.body.style.overflow = "";
    };
    var go = function (dir) {
      if (group.length < 2) return;
      current = (current + dir + group.length) % group.length;
      render();
    };

    document.querySelectorAll("[data-lightbox]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        // On limite la navigation à la galerie contenant l'image cliquée
        var scope = a.closest("[data-gallery]") || document;
        var links = Array.prototype.slice.call(scope.querySelectorAll("[data-lightbox]"));
        group = links.map(function (l) {
          var img = l.querySelector("img");
          return { src: l.getAttribute("href"), alt: img ? img.alt : "" };
        });
        current = links.indexOf(a);
        if (current < 0) current = 0;
        render();
        openLb();
      });
    });

    if (lbPrev) lbPrev.addEventListener("click", function (e) { e.stopPropagation(); go(-1); });
    if (lbNext) lbNext.addEventListener("click", function (e) { e.stopPropagation(); go(1); });

    lb.addEventListener("click", function (e) {
      // Ne pas fermer quand on clique une flèche de navigation
      if (e.target.closest("[data-lightbox-prev], [data-lightbox-next]")) return;
      closeLb();
    });

    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") closeLb();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    });
  }

  // ── Galeries : bouton « voir plus » ───────────────────
  document.querySelectorAll("[data-gallery-more]").forEach(function (btn) {
    var gallery = btn.parentElement.querySelector("[data-gallery]");
    if (!gallery) return;
    btn.addEventListener("click", function () {
      var expanded = gallery.classList.toggle("expanded");
      var lbl = expanded ? gallery.getAttribute("data-less-label") : gallery.getAttribute("data-more-label");
      if (lbl) btn.textContent = lbl;
    });
  });
})();
