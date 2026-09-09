(() => {
  "use strict";

  const projects = window.ABIGAIL_PROJECTS;
  const browser = document.querySelector("[data-work-browser]");
  const grid = document.querySelector("[data-projects-grid]");
  const filtersContainer = document.querySelector("[data-filters]");
  const projectView = document.querySelector("[data-project-view]");

  if (!projects || !browser || !grid || !filtersContainer || !projectView) return;

  const categories = [
    { value: "all", label: "All" },
    { value: "editorial", label: "Editorial" },
    { value: "campaign", label: "Campaign" },
    { value: "talents", label: "Talents" },
    { value: "personal", label: "Personal Projects" }
  ];

  let activeFilter = "all";
  let activeProjectId = null;

  const padNumber = (number) => String(number).padStart(2, "0");
  const getProjectMedia = (project) => [
    ...(project.videos || []).map((src) => ({ type: "video", src })),
    ...project.images.map((src) => ({ type: "image", src }))
  ];

  const renderFilters = () => {
    filtersContainer.innerHTML = categories
      .map((category) => {
        const count = category.value === "all"
          ? projects.length
          : projects.filter((project) => project.category === category.value).length;

        return `
          <button type="button" class="filter-button${category.value === activeFilter ? " is-active" : ""}" data-filter="${category.value}">
            ${category.label} <span>${padNumber(count)}</span>
          </button>
        `;
      })
      .join("");
  };

  const renderGrid = () => {
    const visibleProjects = activeFilter === "all"
      ? projects
      : projects.filter((project) => project.category === activeFilter);

    grid.innerHTML = visibleProjects
      .map((project) => `
        <article class="project-card reveal is-visible">
          <button type="button" data-project-id="${project.id}" aria-label="Ouvrir le projet ${project.title}">
            <span class="project-card__media">
              <img src="${project.images[0]}" alt="${project.title}" loading="lazy">
              <span class="project-card__overlay">${project.title}</span>
            </span>
          </button>
        </article>
      `)
      .join("");
  };

  let videoObserver = null;

  const setupAutoplayVideos = () => {
    if (videoObserver) videoObserver.disconnect();

    const videos = [...projectView.querySelectorAll("[data-project-autoplay-video]")];
    if (!videos.length) return;

    const pauseAllExcept = (activeVideo = null) => {
      videos.forEach((video) => {
        if (video !== activeVideo) video.pause();
      });
    };

    videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
          pauseAllExcept(video);
          video.muted = true;
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, {
      threshold: [0, 0.25, 0.55, 0.75, 1]
    });

    videos.forEach((video) => {
      video.muted = true;
      videoObserver.observe(video);
    });
  };

  const getRelatedProjects = (project) => {
    const sameCategory = projects.filter(
      (candidate) => candidate.category === project.category && candidate.id !== project.id
    );
    const remaining = projects.filter(
      (candidate) => candidate.category !== project.category && candidate.id !== project.id
    );

    return [...sameCategory, ...remaining].slice(0, 3);
  };

  const renderProject = (project) => {
    const relatedProjects = getRelatedProjects(project);

    projectView.innerHTML = `
      <div class="project-view__top page-shell">
        <button class="back-button" type="button" data-back-to-grid>← Back to all projects</button>
      </div>

      <header class="project-detail-header page-shell">
        <div>
          <p class="eyebrow blue-text">${project.categoryLabel} / ${project.year}</p>
          <h1>${project.title}</h1>
        </div>
        ${project.description ? `<p>${project.description}</p>` : ""}
      </header>

<section class="project-linear-gallery" aria-label="Galerie du projet ${project.title}">
        ${getProjectMedia(project).map((media, index, allMedia) => `
          <figure class="project-linear-media">
            <span class="project-linear-media__number" aria-hidden="true">${padNumber(index + 1)}</span>
            <div class="project-linear-media__asset">
              ${media.type === "video" ? `
                <video controls playsinline muted autoplay loop preload="metadata" data-project-autoplay-video>
                  <source src="${media.src}" type="video/mp4">
                  Votre navigateur ne prend pas en charge la lecture vidéo.
                </video>
              ` : `
                <img
                  src="${media.src}"
                  alt="${project.title} — image ${index + 1} sur ${allMedia.length}"
                  loading="lazy"
                >
              `}
            </div>
          </figure>
        `).join("")}
      </section>

      <section class="project-information page-shell">
  <dl>
    ${Object.entries(project.credits).map(([label, value]) => `
      <div>
        <dt>${label}</dt>
        <dd>${value}</dd>
      </div>
    `).join("")}
  </dl>

  ${project.concept ? `
    <div>
      <p class="section-label blue-text">Concept</p>
      <p class="project-concept">${project.concept}</p>
    </div>
  ` : ""}
</section>
      <section class="related-projects">
        <div class="page-shell">
          <p class="section-label">Continue exploring</p>
          <h2>Other projects</h2>
          <div class="related-grid">
            ${relatedProjects.map((related) => `
              <button type="button" data-related-id="${related.id}">
                <img src="${related.images[0]}" alt="${related.title}" loading="lazy">
                <span>${related.categoryLabel} · ${related.year}</span>
                <strong>${related.title}</strong>
              </button>
            `).join("")}
          </div>
        </div>
      </section>
    `;

  };

  const openProject = (projectId, updateHistory = true) => {
    const project = projects.find((item) => item.id === projectId);
    if (!project) return;

    activeProjectId = project.id;
    renderProject(project);

    browser.hidden = true;
    projectView.hidden = false;
    document.body.classList.add("project-is-open");

    if (updateHistory) {
      history.pushState({ projectId: project.id }, "", `#project=${project.id}`);
    }

    window.scrollTo({ top: 0, behavior: "instant" });
    projectView.querySelector("[data-back-to-grid]")?.focus({ preventScroll: true });
  };

  const closeProject = (updateHistory = true) => {
    activeProjectId = null;
    projectView.hidden = true;
    projectView.innerHTML = "";
    browser.hidden = false;
    document.body.classList.remove("project-is-open");

    if (updateHistory) {
      history.pushState({}, "", `${window.location.pathname}${window.location.search}`);
    }

    window.scrollTo({ top: 0, behavior: "instant" });
    grid.querySelector("button")?.focus({ preventScroll: true });
  };


  filtersContainer.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    activeFilter = button.dataset.filter;
    renderFilters();
    renderGrid();
  });

  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-project-id]");
    if (!button) return;
    openProject(button.dataset.projectId);
  });

  projectView.addEventListener("click", (event) => {
    if (event.target.closest("[data-back-to-grid]")) {
      closeProject();
      return;
    }


    const relatedButton = event.target.closest("[data-related-id]");
    if (relatedButton) openProject(relatedButton.dataset.relatedId);
  });

  projectView.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeProject();
  });

  window.addEventListener("popstate", () => {
    const projectId = new URLSearchParams(window.location.hash.replace("#", "")).get("project");
    if (projectId) openProject(projectId, false);
    else if (activeProjectId) closeProject(false);
  });

  renderFilters();
  renderGrid();

  const initialProjectId = new URLSearchParams(window.location.hash.replace("#", "")).get("project");
  if (initialProjectId) openProject(initialProjectId, false);
})();
