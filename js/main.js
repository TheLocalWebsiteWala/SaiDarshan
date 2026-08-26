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

  /* ---- Google Apps Script Endpoint & Appointment Conflict System ---- */
  var GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzzZzwmbL26Y88JohpGJ6ovHbEx5rXLWHytgnGFk7DpMyc8UfFbCZ-BL24ZFMldxbhDQg/exec"; // Paste your deployed Google Apps Script Web App URL here

  /* ---- Modal Popup Handler for Conflicts & Booking Success ---- */
  function showBookingModal(config) {
    var existing = document.getElementById("bookingModalBackdrop");
    if (existing) existing.remove();

    var backdrop = document.createElement("div");
    backdrop.id = "bookingModalBackdrop";
    backdrop.className = "booking-modal-backdrop";

    var card = document.createElement("div");
    card.className = "booking-modal-card is-" + (config.type || "success");

    var iconChar = config.type === "conflict" ? "⚠️" : (config.type === "error" ? "❌" : "✓");
    var iconEl = document.createElement("div");
    iconEl.className = "booking-modal-icon";
    iconEl.textContent = iconChar;

    var titleEl = document.createElement("h3");
    titleEl.className = "booking-modal-title";
    titleEl.textContent = config.title || "Appointment Status";

    var descEl = document.createElement("p");
    descEl.className = "booking-modal-desc";
    descEl.innerHTML = config.message || "";

    var actionsEl = document.createElement("div");
    actionsEl.className = "booking-modal-actions";

    if (config.type === "conflict") {
      var changeBtn = document.createElement("button");
      changeBtn.type = "button";
      changeBtn.className = "booking-modal-btn booking-modal-btn--primary";
      changeBtn.textContent = "Change Time / Stylist";
      changeBtn.addEventListener("click", function () {
        backdrop.classList.remove("is-visible");
        setTimeout(function () { backdrop.remove(); }, 300);
        var timeEl = document.getElementById("bookingTime");
        if (timeEl) {
          var trigger = timeEl.closest(".custom-clock-wrap") ? timeEl.closest(".custom-clock-wrap").querySelector(".custom-clock-trigger") : (timeEl.closest(".custom-select-wrap") ? timeEl.closest(".custom-select-wrap").querySelector(".custom-select-trigger") : timeEl);
          if (trigger) trigger.focus();
        }
      });
      actionsEl.appendChild(changeBtn);
    } else if (config.type === "success") {
      if (config.waUrl) {
        var waBtn = document.createElement("a");
        waBtn.href = config.waUrl;
        waBtn.target = "_blank";
        waBtn.rel = "noopener noreferrer";
        waBtn.className = "booking-modal-btn booking-modal-btn--whatsapp";
        waBtn.innerHTML = "💬 Send Confirmation on WhatsApp";
        actionsEl.appendChild(waBtn);
      }

      var doneBtn = document.createElement("button");
      doneBtn.type = "button";
      doneBtn.className = "booking-modal-btn booking-modal-btn--primary";
      doneBtn.textContent = "Done";
      doneBtn.addEventListener("click", function () {
        backdrop.classList.remove("is-visible");
        setTimeout(function () { backdrop.remove(); }, 300);
      });
      actionsEl.appendChild(doneBtn);
    } else {
      var closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "booking-modal-btn booking-modal-btn--primary";
      closeBtn.textContent = "Try Again";
      closeBtn.addEventListener("click", function () {
        backdrop.classList.remove("is-visible");
        setTimeout(function () { backdrop.remove(); }, 300);
      });
      actionsEl.appendChild(closeBtn);
    }

    card.appendChild(iconEl);
    card.appendChild(titleEl);
    card.appendChild(descEl);
    card.appendChild(actionsEl);
    backdrop.appendChild(card);
    document.body.appendChild(backdrop);

    // Trigger smooth fade-in
    setTimeout(function () {
      backdrop.classList.add("is-visible");
    }, 10);

    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop) {
        backdrop.classList.remove("is-visible");
        setTimeout(function () { backdrop.remove(); }, 300);
      }
    });
  }

  /* ---- contact form & Google Sheets / WhatsApp integration ---------------- */
  var bookingDateInput = document.getElementById("bookingDate");
  if (bookingDateInput) {
    try {
      var todayStr = new Date().toISOString().split("T")[0];
      bookingDateInput.setAttribute("min", todayStr);
      if (!bookingDateInput.value) {
        bookingDateInput.value = todayStr;
      }
    } catch (e) { }
  }

  var contactForm = document.getElementById("contactForm") || document.querySelector("form[data-contact]");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      var submitBtn = contactForm.querySelector('button[type="submit"]') || contactForm.querySelector(".contact-framer-submit");
      var originalBtnText = submitBtn ? submitBtn.textContent : "Submit";

      var name = document.getElementById("name") ? document.getElementById("name").value.trim() : "Guest";
      var phone = document.getElementById("phone") ? document.getElementById("phone").value.trim() : "";
      var email = document.getElementById("email") ? document.getElementById("email").value.trim() : "";
      var service = document.getElementById("service") ? document.getElementById("service").value : "General Inquiry";
      var stylist = document.getElementById("stylist") ? document.getElementById("stylist").value : "Harshal Bhai — Master Barber & Hair Specialist";
      var bookingDate = document.getElementById("bookingDate") ? document.getElementById("bookingDate").value : "";
      var bookingTime = document.getElementById("bookingTime") ? document.getElementById("bookingTime").value : "";
      var notes = document.getElementById("notes") ? document.getElementById("notes").value.trim() : "";

      // Format WhatsApp message for backup/direct messaging
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

      var payload = {
        name: name,
        phone: phone,
        email: email,
        service: service,
        stylist: stylist,
        bookingDate: bookingDate,
        bookingTime: bookingTime,
        notes: notes
      };

      // 1. Prevent duplicate submissions while processing
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Checking availability...";
      }

      // If Google Apps Script URL is configured, perform server-side lock & conflict check
      if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL.indexOf("http") === 0) {
        fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "text/plain;charset=utf-8"
          },
          body: JSON.stringify(payload)
        })
          .then(function (response) {
            return response.json();
          })
          .then(function (result) {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = originalBtnText;
            }

            if (result.success) {
              // Success: Slot available and saved to Google Sheets
              showBookingModal({
                type: "success",
                title: "Appointment Booked Successfully",
                message: "Your appointment has been successfully confirmed and recorded in our calendar.<br /><br /><strong>Date:</strong> " + (result.date || bookingDate) + "<br /><strong>Time:</strong> " + (result.time || bookingTime) + "<br /><strong>Stylist:</strong> " + (result.stylist || stylist),
                waUrl: waUrl
              });

              // Reset form fields
              contactForm.reset();
              if (bookingDateInput) {
                bookingDateInput.value = new Date().toISOString().split("T")[0];
                bookingDateInput.dispatchEvent(new Event("change", { bubbles: true }));
              }
            } else if (result.conflict) {
              // Conflict: Stylist already booked on this slot
              showBookingModal({
                type: "conflict",
                title: "Appointment Unavailable",
                message: (result.message || "This stylist is already booked for the selected date and time.") + "<br /><br />Please choose another preferred time slot, change the date, or select another master stylist."
              });
              // Keep user's entered form data intact
            } else {
              // Generic server/validation error
              showBookingModal({
                type: "error",
                title: "Booking Error",
                message: result.message || "Unable to process the appointment. Please try again or message us on WhatsApp."
              });
            }
          })
          .catch(function (error) {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = originalBtnText;
            }

            // Fallback for network issues or redirect
            showBookingModal({
              type: "error",
              title: "Network Notice",
              message: "We encountered a temporary connection issue. You can instantly book your slot directly via our official WhatsApp concierge below:",
              waUrl: waUrl
            });
          });
      } else {
        // Direct WhatsApp / local preview confirmation when script URL is awaiting deployment
        setTimeout(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
          }

          showBookingModal({
            type: "success",
            title: "Appointment Booked Successfully",
            message: "Your appointment details have been prepared for <strong>" + name + "</strong> with <strong>" + stylist + "</strong> on <strong>" + bookingDate + " (" + bookingTime + ")</strong>.<br /><br />Opening WhatsApp to connect with our concierge...",
            waUrl: waUrl
          });

          try {
            window.open(waUrl, "_blank", "noopener,noreferrer");
          } catch (err) { }

          contactForm.reset();
          if (bookingDateInput) {
            bookingDateInput.value = new Date().toISOString().split("T")[0];
            bookingDateInput.dispatchEvent(new Event("change", { bubbles: true }));
          }
        }, 500);
      }
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
      document.querySelectorAll(".custom-select-wrap, .custom-calendar-wrap, .custom-clock-wrap").forEach(function (w) {
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

  /* ---- Custom Clock & Free Time Picker Enhancer ---- */
  function initCustomClockPicker() {
    var timeInput = document.getElementById("bookingTime");
    if (!timeInput || timeInput.closest(".custom-clock-wrap")) return;

    var wrap = document.createElement("div");
    wrap.className = "custom-clock-wrap";
    timeInput.parentNode.insertBefore(wrap, timeInput);
    wrap.appendChild(timeInput);

    var trigger = document.createElement("div");
    trigger.className = "custom-clock-trigger";
    trigger.setAttribute("tabindex", "0");
    trigger.textContent = timeInput.value || "Select Time (e.g. 02:30 PM)";
    wrap.appendChild(trigger);

    var popup = document.createElement("div");
    popup.className = "custom-clock-popup";
    wrap.appendChild(popup);

    var selectedHour = 2;
    var selectedMinute = 30;
    var selectedMeridian = "PM";

    // If input already has a value, parse it
    if (timeInput.value) {
      var match = timeInput.value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (match) {
        selectedHour = parseInt(match[1], 10);
        selectedMinute = parseInt(match[2], 10);
        if (match[3]) selectedMeridian = match[3].toUpperCase();
      }
    }

    function formatFormattedTime() {
      var hStr = String(selectedHour).padStart(2, "0");
      var mStr = String(selectedMinute).padStart(2, "0");
      return hStr + ":" + mStr + " " + selectedMeridian;
    }

    function updateTimeValue(closePopup) {
      var formatted = formatFormattedTime();
      timeInput.value = formatted;
      trigger.textContent = formatted;
      timeInput.dispatchEvent(new Event("change", { bubbles: true }));
      if (closePopup) {
        wrap.classList.remove("is-open");
      }
    }

    function renderClock() {
      popup.innerHTML = "";

      // Digital Header Display
      var header = document.createElement("div");
      header.className = "clock-display-header";

      var digital = document.createElement("div");
      digital.className = "clock-digital-time";
      digital.innerHTML = "<span>" + String(selectedHour).padStart(2, "0") + "</span><span class='time-sep'>:</span><span>" + String(selectedMinute).padStart(2, "0") + "</span>";

      var toggle = document.createElement("div");
      toggle.className = "clock-meridian-toggle";

      ["AM", "PM"].forEach(function (m) {
        var ampmBtn = document.createElement("button");
        ampmBtn.type = "button";
        ampmBtn.className = "clock-ampm-btn" + (selectedMeridian === m ? " is-active" : "");
        ampmBtn.textContent = m;
        ampmBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          selectedMeridian = m;
          renderClock();
        });
        toggle.appendChild(ampmBtn);
      });

      header.appendChild(digital);
      header.appendChild(toggle);
      popup.appendChild(header);

      // Columns wrap (Hours + Minutes)
      var colsWrap = document.createElement("div");
      colsWrap.className = "clock-columns-wrap";

      // Hours Col (01 - 12)
      var hourCol = document.createElement("div");
      hourCol.className = "clock-col";
      var hourLabel = document.createElement("div");
      hourLabel.className = "clock-col-label";
      hourLabel.textContent = "Hour";
      hourCol.appendChild(hourLabel);

      var hourScroll = document.createElement("div");
      hourScroll.className = "clock-grid-scroll";
      for (var h = 1; h <= 12; h++) {
        var chipH = document.createElement("div");
        chipH.className = "clock-chip" + (selectedHour === h ? " is-selected" : "");
        chipH.textContent = String(h).padStart(2, "0");
        (function (valH) {
          chipH.addEventListener("click", function (e) {
            e.stopPropagation();
            selectedHour = valH;
            renderClock();
          });
        })(h);
        hourScroll.appendChild(chipH);
      }
      hourCol.appendChild(hourScroll);
      colsWrap.appendChild(hourCol);

      // Minutes Col (00, 05, 10, ... 55)
      var minCol = document.createElement("div");
      minCol.className = "clock-col";
      var minLabel = document.createElement("div");
      minLabel.className = "clock-col-label";
      minLabel.textContent = "Minute";
      minCol.appendChild(minLabel);

      var minScroll = document.createElement("div");
      minScroll.className = "clock-grid-scroll";
      for (var m = 0; m < 60; m += 5) {
        var chipM = document.createElement("div");
        chipM.className = "clock-chip" + (selectedMinute === m ? " is-selected" : "");
        chipM.textContent = String(m).padStart(2, "0");
        (function (valM) {
          chipM.addEventListener("click", function (e) {
            e.stopPropagation();
            selectedMinute = valM;
            renderClock();
          });
        })(m);
        minScroll.appendChild(chipM);
      }
      minCol.appendChild(minScroll);
      colsWrap.appendChild(minCol);

      popup.appendChild(colsWrap);

      // Confirm / Set Time Button
      var confirmBtn = document.createElement("button");
      confirmBtn.type = "button";
      confirmBtn.className = "clock-confirm-btn";
      confirmBtn.textContent = "Set Time (" + formatFormattedTime() + ")";
      confirmBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        updateTimeValue(true);
      });
      popup.appendChild(confirmBtn);
    }

    trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      var isOpen = wrap.classList.contains("is-open");
      document.querySelectorAll(".custom-select-wrap, .custom-calendar-wrap, .custom-clock-wrap").forEach(function (w) {
        w.classList.remove("is-open");
      });
      if (!isOpen) {
        renderClock();
        wrap.classList.add("is-open");
      }
    });

    timeInput.addEventListener("change", function () {
      if (timeInput.value) {
        trigger.textContent = timeInput.value;
      }
    });
  }

  // Global click to close custom dropdowns
  document.addEventListener("click", function () {
    document.querySelectorAll(".custom-select-wrap, .custom-calendar-wrap, .custom-clock-wrap").forEach(function (w) {
      w.classList.remove("is-open");
    });
  });

  // Initialize custom components
  initCustomSelects();
  initCustomCalendar();
  initCustomClockPicker();

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
    } catch (e) { }

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
