(() => {
  "use strict";

  const header = document.querySelector("[data-header]");
  const menuToggle = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".site-nav");
  const yearTargets = document.querySelectorAll("[data-year]");
  const revealTargets = document.querySelectorAll(".reveal");

  yearTargets.forEach((target) => {
    target.textContent = String(new Date().getFullYear());
  });

  if (header) {
    const updateHeader = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  if (menuToggle && navigation) {
    const closeMenu = () => {
      navigation.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-open");
    };

    menuToggle.addEventListener("click", () => {
      const willOpen = !navigation.classList.contains("is-open");
      navigation.classList.toggle("is-open", willOpen);
      menuToggle.setAttribute("aria-expanded", String(willOpen));
      document.body.classList.toggle("menu-open", willOpen);
    });

    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 820) closeMenu();
    });
  }

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14 }
    );

    revealTargets.forEach((target) => revealObserver.observe(target));
  } else {
    revealTargets.forEach((target) => target.classList.add("is-visible"));
  }
})();

/* Hero marquee — boucle continue Safari + Chrome */
const setupHeroMarquee = () => {
  const track = document.querySelector(".hero-marquee__track");
  const groups = track ? [...track.querySelectorAll(".hero-marquee__group")] : [];

  if (!track || groups.length < 2) return;

  const firstGroup = groups[0];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const speed = 115; // px/s — vitesse validée visuellement lors du test précédent

  let loopWidth = 0;
  let offset = 0;
  let lastTime = null;
  let raf = null;

  const measure = () => {
    const frames = [...firstGroup.querySelectorAll(".hero-frame")];

    // Important : on additionne les blocs affichés, jamais la largeur du groupe Safari.
    loopWidth = frames.reduce(
      (sum, frame) => sum + frame.getBoundingClientRect().width,
      0
    );

    if (!loopWidth) return;

    // Force les deux copies à avoir exactement la bonne largeur.
    groups.forEach((group) => {
      group.style.flex = `0 0 ${loopWidth}px`;
      group.style.width = `${loopWidth}px`;
      group.style.minWidth = `${loopWidth}px`;
    });

    track.style.width = `${loopWidth * 2}px`;
    offset %= loopWidth;
  };

  const draw = () => {
    track.style.transform = `translate3d(${-offset}px, 0, 0)`;
  };

  const stop = () => {
    if (raf !== null) cancelAnimationFrame(raf);
    raf = null;
    lastTime = null;
  };

  const tick = (time) => {
    if (lastTime !== null && loopWidth) {
      offset = (offset + speed * ((time - lastTime) / 1000)) % loopWidth;
      draw();
    }

    lastTime = time;
    raf = requestAnimationFrame(tick);
  };

  const start = () => {
    stop();
    measure();

    if (reduceMotion.matches) {
      offset = 0;
      draw();
      return;
    }

    raf = requestAnimationFrame(tick);
  };

  // Mesure une fois les images chargées, puis à chaque redimensionnement.
  const images = [...firstGroup.querySelectorAll("img")];
  let pending = images.filter((img) => !img.complete).length;

  if (pending) {
    images.forEach((img) => {
      if (!img.complete) {
        img.addEventListener("load", () => {
          pending -= 1;
          if (pending === 0) start();
        }, { once: true });
      }
    });
  } else {
    start();
  }

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      measure();
      draw();
    }, 100);
  });

  reduceMotion.addEventListener?.("change", start);
};

setupHeroMarquee();
