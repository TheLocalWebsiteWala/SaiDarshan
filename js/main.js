/* TrimHub & Lumière Unisex Salon — interactions */
(function () {
  "use strict";

  /* ---- sticky header ---------------------------------------------- */
  var header = document.querySelector(".header");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-stuck", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- mobile menu -------------------------------------------------- */
  var burger = document.querySelector(".burger");
  if (burger) {
    burger.addEventListener("click", function () {
      document.body.classList.toggle("menu-open");
    });
  }
  document.querySelectorAll(".mobile-menu a").forEach(function (a) {
    a.addEventListener("click", function () {
      document.body.classList.remove("menu-open");
    });
  });

  /* ---- hero dual-card interactive slider ------------------------------ */
  var heroSection = document.getElementById("heroSliderSection");
  var heroPrev = document.getElementById("heroPrevBtn");
  var heroNext = document.getElementById("heroNextBtn");
  var maleCard = document.getElementById("heroMaleCard");
  var femaleCard = document.getElementById("heroFemaleCard");
  var maleDots = document.querySelectorAll("#heroMaleDots span");
  var femaleDots = document.querySelectorAll("#heroFemaleDots span");

  if (maleCard && femaleCard) {
    var maleSlides = maleCard.querySelectorAll(".hero-bm__slide");
    var femaleSlides = femaleCard.querySelectorAll(".hero-bm__slide");
    var totalSlides = Math.min(maleSlides.length, femaleSlides.length);
    var currentHeroIndex = 0;
    var heroTimer = null;

    function goToHeroSlide(index) {
      currentHeroIndex = (index + totalSlides) % totalSlides;

      // Update male slides
      maleSlides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === currentHeroIndex);
      });
      maleDots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === currentHeroIndex);
      });

      // Update female slides
      femaleSlides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === currentHeroIndex);
      });
      femaleDots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === currentHeroIndex);
      });
    }

    function nextHeroSlide() {
      goToHeroSlide(currentHeroIndex + 1);
    }

    function prevHeroSlide() {
      goToHeroSlide(currentHeroIndex - 1);
    }

    function startHeroAuto() {
      stopHeroAuto();
      heroTimer = setInterval(nextHeroSlide, 4500);
    }

    function stopHeroAuto() {
      if (heroTimer) {
        clearInterval(heroTimer);
        heroTimer = null;
      }
    }

    if (heroNext) {
      heroNext.addEventListener("click", function () {
        nextHeroSlide();
        startHeroAuto();
      });
    }

    if (heroPrev) {
      heroPrev.addEventListener("click", function () {
        prevHeroSlide();
        startHeroAuto();
      });
    }

    // Dot navigation
    maleDots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        goToHeroSlide(i);
        startHeroAuto();
      });
    });

    femaleDots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        goToHeroSlide(i);
        startHeroAuto();
      });
    });

    // Pause on hover
    if (heroSection) {
      heroSection.addEventListener("mouseenter", stopHeroAuto);
      heroSection.addEventListener("mouseleave", startHeroAuto);
    }

    // Start auto rotation
    startHeroAuto();
  }

  /* ---- scroll reveal ------------------------------------------------ */
  var revealables = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealables.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealables.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---- counters ------------------------------------------------------ */
  var counters = document.querySelectorAll("[data-count]");
  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var start = null;
    var duration = 1600;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var value = target * eased;
      el.textContent = (target % 1 ? value.toFixed(1) : Math.round(value)) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (counters.length && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            runCounter(e.target);
            cio.unobserve(e.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach(function (c) {
      cio.observe(c);
    });
  }

  /* ---- accordion ------------------------------------------------------ */
  document.querySelectorAll(".acc__btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.parentElement;
      var body = item.querySelector(".acc__body");
      var open = item.classList.contains("is-open");
      item.parentElement.querySelectorAll(".acc").forEach(function (other) {
        other.classList.remove("is-open");
        var otherBody = other.querySelector(".acc__body");
        if (otherBody) otherBody.style.maxHeight = null;
      });
      if (!open) {
        item.classList.add("is-open");
        if (body) body.style.maxHeight = body.scrollHeight + "px";
      }
    });
  });
  var firstAcc = document.querySelector(".acc.is-open .acc__body");
  if (firstAcc) firstAcc.style.maxHeight = firstAcc.scrollHeight + "px";

  /* ---- testimonial slider -------------------------------------------- */
  var slider = document.querySelector(".slider");
  if (slider) {
    var track = slider.querySelector(".slider__track");
    var slides = track ? track.children : [];
    var dotsWrap = document.querySelector(".dots");
    var index = 0;

    function perView() {
      if (window.innerWidth < 760) return 1;
      if (window.innerWidth < 1024) return 2;
      return 3;
    }
    function pages() {
      return Math.max(1, slides.length - perView() + 1);
    }
    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = "";
      for (var i = 0; i < pages(); i++) {
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", "Go to slide " + (i + 1));
        (function (n) {
          b.addEventListener("click", function () {
            index = n;
            update();
          });
        })(i);
        dotsWrap.appendChild(b);
      }
    }
    function update() {
      if (!slides.length) return;
      if (index >= pages()) index = 0;
      var slideW = slides[0].getBoundingClientRect().width + 22;
      track.style.transform = "translateX(" + -index * slideW + "px)";
      if (dotsWrap) {
        Array.prototype.forEach.call(dotsWrap.children, function (d, i) {
          d.classList.toggle("is-active", i === index);
        });
      }
    }
    buildDots();
    update();
    window.addEventListener("resize", function () {
      buildDots();
      update();
    });
    setInterval(function () {
      index++;
      update();
    }, 5500);
  }

  /* ---- lightbox ------------------------------------------------------- */
  var lightbox = document.getElementById("lightbox");
  if (lightbox) {
    var lbImg = lightbox.querySelector("img");
    var lbCap = lightbox.querySelector(".lightbox__caption");
    var lbClose = lightbox.querySelector(".lightbox__close");

    document.querySelectorAll(".gallery-grid figure img").forEach(function (img) {
      img.style.cursor = "pointer";
      img.addEventListener("click", function () {
        if (lbImg) lbImg.src = img.src;
        if (lbCap) {
          var figcap = img.parentElement.querySelector("figcaption");
          lbCap.textContent = figcap ? figcap.textContent : "";
        }
        lightbox.classList.add("is-open");
      });
    });

    if (lbClose) {
      lbClose.addEventListener("click", function () {
        lightbox.classList.remove("is-open");
      });
    }
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) lightbox.classList.remove("is-open");
    });
  }

  /* ---- contact form --------------------------------------------------- */
  var contactForm = document.getElementById("contactForm") || document.querySelector("form[data-contact]");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var feedback = document.getElementById("formFeedback") || contactForm.querySelector(".form-note");
      var name = document.getElementById("name") ? document.getElementById("name").value : "Valued Guest";
      var service = document.getElementById("service") ? document.getElementById("service").value : "Service";
      
      if (feedback) {
        feedback.style.display = "block";
        feedback.innerHTML = "✓ Thank you, <strong>" + name + "</strong>! Your reservation request for <em>" + service + "</em> in Surat has been received. Our concierge will contact you via WhatsApp shortly.";
      }
      contactForm.reset();
    });
  }

  /* ---- current year --------------------------------------------------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
