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

  /* ---- contact form & WhatsApp integration --------------------------- */
  var bookingDateInput = document.getElementById("bookingDate");
  if (bookingDateInput) {
    try {
      var todayStr = new Date().toISOString().split("T")[0];
      bookingDateInput.setAttribute("min", todayStr);
      if (!bookingDateInput.value) {
        bookingDateInput.value = todayStr;
      }
    } catch (e) {}
  }

  var contactForm = document.getElementById("contactForm") || document.querySelector("form[data-contact]");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var feedback = document.getElementById("formFeedback") || contactForm.querySelector(".form-note");
      var name = document.getElementById("name") ? document.getElementById("name").value.trim() : "Guest";
      var phone = document.getElementById("phone") ? document.getElementById("phone").value.trim() : "";
      var email = document.getElementById("email") ? document.getElementById("email").value.trim() : "";
      var service = document.getElementById("service") ? document.getElementById("service").value : "General Inquiry";
      var stylist = document.getElementById("stylist") ? document.getElementById("stylist").value : "Any Available Stylist";
      var bookingDate = document.getElementById("bookingDate") ? document.getElementById("bookingDate").value : "";
      var bookingTime = document.getElementById("bookingTime") ? document.getElementById("bookingTime").value : "";
      var notes = document.getElementById("notes") ? document.getElementById("notes").value.trim() : "";

      // Format WhatsApp message
      var waMsg = "Hello Sai Darshan Salon! I would like to book an appointment:\n\n" +
        "👤 *Name:* " + name + "\n" +
        "📞 *Phone:* " + phone + "\n" +
        (email ? "📧 *Email:* " + email + "\n" : "") +
        "✂️ *Service:* " + service + "\n" +
        (stylist ? "💈 *Stylist / Artist:* " + stylist + "\n" : "") +
        (bookingDate ? "📅 *Date:* " + bookingDate + "\n" : "") +
        (bookingTime ? "⏰ *Time Slot:* " + bookingTime + "\n" : "") +
        (notes ? "📝 *Notes:* " + notes + "\n" : "") +
        "📍 *Location:* Dindoli, Surat";

      var waUrl = "https://api.whatsapp.com/send?phone=919662281908&text=" + encodeURIComponent(waMsg);

      if (feedback) {
        feedback.style.display = "block";
        feedback.innerHTML = "✓ Thank you, <strong>" + name + "</strong>! Opening WhatsApp to connect with our concierge... <br /><small style='color:#cfd3dc; margin-top:4px; display:inline-block;'>If WhatsApp did not open automatically, <a href='" + waUrl + "' target='_blank' rel='noopener noreferrer' style='color:var(--orange); text-decoration:underline;'>click here to message +91 96622 81908</a>.</small>";
      }

      // Open WhatsApp in new tab
      try {
        window.open(waUrl, "_blank", "noopener,noreferrer");
      } catch (err) {
        // Popups might be blocked
      }

      contactForm.reset();
    });
  }

  /* ---- Custom Select Enhancer ---- */
  function initCustomSelects() {
    var selects = document.querySelectorAll(".contact-framer-field select");
    selects.forEach(function (select) {
      if (select.closest(".custom-select-wrap")) return;

      var wrap = document.createElement("div");
      wrap.className = "custom-select-wrap";
      select.parentNode.insertBefore(wrap, select);
      wrap.appendChild(select);

      var trigger = document.createElement("div");
      trigger.className = "custom-select-trigger";
      trigger.setAttribute("tabindex", "0");
      
      var selectedOpt = select.options[select.selectedIndex] || select.options[0];
      trigger.textContent = selectedOpt ? selectedOpt.textContent : "Select Option";
      wrap.appendChild(trigger);

      var menu = document.createElement("div");
      menu.className = "custom-select-menu";

      function renderOptions() {
        menu.innerHTML = "";
        Array.from(select.options).forEach(function (opt, idx) {
          var optionEl = document.createElement("div");
          optionEl.className = "custom-select-option" + (idx === select.selectedIndex ? " is-selected" : "");
          optionEl.textContent = opt.textContent;
          optionEl.addEventListener("click", function (e) {
            e.stopPropagation();
            select.selectedIndex = idx;
            trigger.textContent = opt.textContent;
            menu.querySelectorAll(".custom-select-option").forEach(function (o, i) {
              o.classList.toggle("is-selected", i === idx);
            });
            wrap.classList.remove("is-open");
            select.dispatchEvent(new Event("change", { bubbles: true }));
          });
          menu.appendChild(optionEl);
        });
      }

      renderOptions();
      wrap.appendChild(menu);

      trigger.addEventListener("click", function (e) {
        e.stopPropagation();
        var isOpen = wrap.classList.contains("is-open");
        document.querySelectorAll(".custom-select-wrap, .custom-calendar-wrap").forEach(function (w) {
          w.classList.remove("is-open");
        });
        if (!isOpen) {
          renderOptions();
          wrap.classList.add("is-open");
        }
      });

      // Update trigger if select value changed programmatically
      select.addEventListener("change", function () {
        var opt = select.options[select.selectedIndex];
        if (opt) {
          trigger.textContent = opt.textContent;
          menu.querySelectorAll(".custom-select-option").forEach(function (o, i) {
            o.classList.toggle("is-selected", i === select.selectedIndex);
          });
        }
      });
    });
  }

  /* ---- Custom Calendar / Date Picker Enhancer ---- */
  function initCustomCalendar() {
    var dateInput = document.getElementById("bookingDate");
    if (!dateInput || dateInput.closest(".custom-calendar-wrap")) return;

    var wrap = document.createElement("div");
    wrap.className = "custom-calendar-wrap";
    dateInput.parentNode.insertBefore(wrap, dateInput);
    wrap.appendChild(dateInput);

    var trigger = document.createElement("div");
    trigger.className = "custom-calendar-trigger";
    trigger.setAttribute("tabindex", "0");
    wrap.appendChild(trigger);

    var popup = document.createElement("div");
    popup.className = "custom-calendar-popup";
    wrap.appendChild(popup);

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var selectedDate = new Date();
    if (dateInput.value) {
      var parts = dateInput.value.split("-");
      if (parts.length === 3) {
        selectedDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
    }
    selectedDate.setHours(0, 0, 0, 0);

    var viewYear = selectedDate.getFullYear();
    var viewMonth = selectedDate.getMonth();

    var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    function formatDateForInput(d) {
      var y = d.getFullYear();
      var m = String(d.getMonth() + 1).padStart(2, "0");
      var day = String(d.getDate()).padStart(2, "0");
      return y + "-" + m + "-" + day;
    }

    function formatTrigger(d) {
      var day = d.getDate();
      var m = monthNames[d.getMonth()].slice(0, 3);
      var y = d.getFullYear();
      var isTod = d.getTime() === today.getTime();
      return (isTod ? "Today, " : "") + day + " " + m + " " + y;
    }

    function updateTrigger() {
      dateInput.value = formatDateForInput(selectedDate);
      trigger.textContent = formatTrigger(selectedDate);
    }

    updateTrigger();

    function renderCalendar() {
      popup.innerHTML = "";

      var header = document.createElement("div");
      header.className = "cal-header";

      var prevBtn = document.createElement("button");
      prevBtn.type = "button";
      prevBtn.className = "cal-nav-btn";
      prevBtn.innerHTML = "&larr;";
      prevBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        viewMonth--;
        if (viewMonth < 0) {
          viewMonth = 11;
          viewYear--;
        }
        renderCalendar();
      });

      var title = document.createElement("div");
      title.className = "cal-title";
      title.textContent = monthNames[viewMonth] + " " + viewYear;

      var nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.className = "cal-nav-btn";
      nextBtn.innerHTML = "&rarr;";
      nextBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        viewMonth++;
        if (viewMonth > 11) {
          viewMonth = 0;
          viewYear++;
        }
        renderCalendar();
      });

      header.appendChild(prevBtn);
      header.appendChild(title);
      header.appendChild(nextBtn);
      popup.appendChild(header);

      var weekdays = document.createElement("div");
      weekdays.className = "cal-weekdays";
      ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].forEach(function (wd) {
        var s = document.createElement("span");
        s.textContent = wd;
        weekdays.appendChild(s);
      });
      popup.appendChild(weekdays);

      var daysGrid = document.createElement("div");
      daysGrid.className = "cal-days";

      var firstDay = new Date(viewYear, viewMonth, 1).getDay();
      var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

      for (var i = 0; i < firstDay; i++) {
        var empty = document.createElement("div");
        empty.className = "cal-day is-empty";
        daysGrid.appendChild(empty);
      }

      for (var d = 1; d <= daysInMonth; d++) {
        var dayDate = new Date(viewYear, viewMonth, d);
        dayDate.setHours(0, 0, 0, 0);

        var dayEl = document.createElement("div");
        dayEl.className = "cal-day";
        dayEl.textContent = d;

        if (dayDate.getTime() < today.getTime()) {
          dayEl.classList.add("is-disabled");
        } else {
          if (dayDate.getTime() === today.getTime()) {
            dayEl.classList.add("is-today");
          }
          if (dayDate.getTime() === selectedDate.getTime()) {
            dayEl.classList.add("is-selected");
          }

          (function (curDate) {
            dayEl.addEventListener("click", function (e) {
              e.stopPropagation();
              selectedDate = new Date(curDate);
              updateTrigger();
              wrap.classList.remove("is-open");
              dateInput.dispatchEvent(new Event("change", { bubbles: true }));
            });
          })(dayDate);
        }

        daysGrid.appendChild(dayEl);
      }

      popup.appendChild(daysGrid);
    }

    trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      var isOpen = wrap.classList.contains("is-open");
      document.querySelectorAll(".custom-select-wrap, .custom-calendar-wrap").forEach(function (w) {
        w.classList.remove("is-open");
      });
      if (!isOpen) {
        viewYear = selectedDate.getFullYear();
        viewMonth = selectedDate.getMonth();
        renderCalendar();
        wrap.classList.add("is-open");
      }
    });
  }

  // Global click to close custom dropdowns
  document.addEventListener("click", function () {
    document.querySelectorAll(".custom-select-wrap, .custom-calendar-wrap").forEach(function (w) {
      w.classList.remove("is-open");
    });
  });

  // Initialize custom components
  initCustomSelects();
  initCustomCalendar();

  /* ---- preselect service on contact page (URL query param or sessionStorage) ---- */
  var serviceSelect = document.getElementById("service");
  if (serviceSelect) {
    function cleanStr(str) {
      return (str || "").replace(/[’`]/g, "'").replace(/\+/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
    }

    var selectedService = "";
    try {
      if (window.location.search) {
        var params = new URLSearchParams(window.location.search);
        selectedService = params.get("service") || "";
      }
      if (!selectedService && window.sessionStorage) {
        selectedService = sessionStorage.getItem("selectedService") || "";
        sessionStorage.removeItem("selectedService");
      }
    } catch (e) {}

    if (selectedService) {
      var targetClean = cleanStr(selectedService);
      for (var s = 0; s < serviceSelect.options.length; s++) {
        var optVal = cleanStr(serviceSelect.options[s].value);
        var optText = cleanStr(serviceSelect.options[s].text);
        if (optVal === targetClean || optText.indexOf(targetClean) !== -1 || (targetClean.length > 3 && optVal.indexOf(targetClean) !== -1)) {
          serviceSelect.selectedIndex = s;
          serviceSelect.dispatchEvent(new Event("change", { bubbles: true }));
          break;
        }
      }
      var formEl = document.getElementById("contactForm") || document.querySelector(".contact-framer-card");
      if (formEl) {
        setTimeout(function () {
          formEl.scrollIntoView({ behavior: "smooth", block: "center" });
          var nameInput = document.getElementById("name");
          if (nameInput) nameInput.focus();
        }, 300);
      }
    }
  }

  /* ---- current year --------------------------------------------------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
