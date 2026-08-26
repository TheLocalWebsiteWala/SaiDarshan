/**
 * Sai Darshan Salon — Appointment Booking & Conflict Detection System
 * Google Apps Script Backend (Code.gs)
 * 
 * Main Features:
 * - Atomic double-booking prevention using LockService.getScriptLock()
 * - Individual Stylist conflict detection based on: Date + Time (with 1-hour overlap calculation) + Stylist
 * - Normalized date, time, and stylist parsing
 * - Structured JSON responses for Success, Conflict, and Error states
 * - 100% compliant with Google Sheets structure
 * 
 * Instructions:
 * 1. Open Google Sheets (create a new sheet or open existing).
 * 2. Extensions > Apps Script > Replace Code.gs with this file.
 * 3. Click Deploy > New Deployment > Web App.
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the Web App URL and configure it in js/main.js (GOOGLE_SCRIPT_URL).
 */

// Configuration
var CONFIG = {
  SHEET_NAME: "Appointments",
  DEFAULT_DURATION_MINUTES: 60, // 1 appointment occupies stylist for 1 hour
  KNOWN_STYLISTS: [
    "Harshal Bhai",
    "Elena Vance",
    "Sophia Laurent",
    "Julian Cole"
  ],
  HEADERS: [
    "Appointment ID",
    "Name",
    "Phone",
    "Email",
    "Service",
    "Stylist/Artist",
    "Appointment Date",
    "Appointment Time",
    "Message",
    "Status",
    "Created At"
  ]
};

/**
 * Handle HTTP POST requests from the website form
 */
function doPost(e) {
  var data = parseRequestData(e);
  return processBooking(data, null);
}

/**
 * Handle HTTP GET requests (supports JSONP, GET bookings, connection verification)
 */
function doGet(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  var callback = params.callback;

  // 1. If checking availability only
  if (params.check === "availability") {
    var sheet = getOrCreateAppointmentsSheet();
    var date = normalizeDate(params.date);
    var timeInterval = parseTimeInterval(params.time);
    var stylist = normalizeStylist(params.stylist);
    var res = checkAppointmentAvailability(sheet, date, timeInterval, stylist);
    return createJsonResponse(res, callback);
  }

  // 2. If submitting a booking via GET / JSONP
  if (params.action === "book" || params.name) {
    return processBooking(params, callback);
  }

  // 3. Status Ping
  return createJsonResponse({
    status: "online",
    service: "Sai Darshan Salon Booking API",
    message: "Google Apps Script backend is active and ready for appointment bookings."
  }, callback);
}

/**
 * Core atomic booking processor with LockService
 */
function processBooking(data, callback) {
  var lock = LockService.getScriptLock();
  
  try {
    // Acquire lock to prevent race conditions & simultaneous double booking (wait up to 30s)
    var lockAcquired = lock.tryLock(30000);
    if (!lockAcquired) {
      return createJsonResponse({
        success: false,
        conflict: false,
        message: "Server is currently busy processing bookings. Please try again in a few seconds."
      }, callback);
    }

    if (!data) {
      return createJsonResponse({
        success: false,
        conflict: false,
        message: "Invalid booking data received."
      }, callback);
    }

    // 1. Validate required fields
    var validationError = validateBookingData(data);
    if (validationError) {
      return createJsonResponse({
        success: false,
        conflict: false,
        message: validationError
      }, callback);
    }

    // 2. Get or initialize Appointments sheet
    var sheet = getOrCreateAppointmentsSheet();

    // 3. Normalize incoming parameters
    var normalizedDate = normalizeDate(data.bookingDate || data.date);
    var newTimeInterval = parseTimeInterval(data.bookingTime || data.time);
    var rawStylist = data.stylist || CONFIG.KNOWN_STYLISTS[0];
    var normalizedStylist = normalizeStylist(rawStylist);

    if (!normalizedDate) {
      return createJsonResponse({
        success: false,
        conflict: false,
        message: "Invalid appointment date format."
      }, callback);
    }

    if (!newTimeInterval) {
      return createJsonResponse({
        success: false,
        conflict: false,
        message: "Invalid appointment time format."
      }, callback);
    }

    // 4. Check appointment availability & conflicts
    var availability = checkAppointmentAvailability(sheet, normalizedDate, newTimeInterval, normalizedStylist);

    // 5. If conflict detected, return clear conflict response (Do not insert into sheet)
    if (!availability.isAvailable) {
      return createJsonResponse({
        success: false,
        conflict: true,
        stylist: availability.conflictingStylist || rawStylist,
        date: normalizedDate,
        time: data.bookingTime || data.time,
        message: availability.message || "This stylist is already booked for the selected date and time. Please choose another preferred time or select another date."
      }, callback);
    }

    // 6. Assign stylist
    var assignedStylist = availability.assignedStylist || rawStylist;

    // 7. Create appointment row in Google Sheets
    var appointmentId = generateAppointmentId();
    createAppointment(sheet, {
      appointmentId: appointmentId,
      name: String(data.name).trim(),
      phone: String(data.phone).trim(),
      email: data.email ? String(data.email).trim() : "",
      service: data.service || "General Salon Service",
      stylist: assignedStylist,
      appointmentDate: normalizedDate,
      appointmentTime: data.bookingTime || data.time,
      message: (data.notes || data.message || "").trim(),
      status: "Confirmed",
      createdAt: new Date()
    });

    // 8. Return success response
    return createJsonResponse({
      success: true,
      conflict: false,
      appointmentId: appointmentId,
      stylist: assignedStylist,
      date: normalizedDate,
      time: data.bookingTime || data.time,
      message: "Appointment booked successfully! Your appointment has been successfully submitted."
    }, callback);

  } catch (error) {
    Logger.log("Error in processBooking: " + error.toString());
    return createJsonResponse({
      success: false,
      conflict: false,
      message: "Unable to process the appointment. Please try again."
    }, callback);
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {}
  }
}

/**
 * Parse incoming data from JSON body or URL-encoded form parameters
 */
function parseRequestData(e) {
  if (!e) return null;
  
  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (err) {
      // If not JSON, parse as form parameters
    }
  }

  if (e.parameter) {
    return e.parameter;
  }

  return null;
}

/**
 * Validate incoming booking fields
 */
function validateBookingData(data) {
  if (!data.name || typeof data.name !== "string" || data.name.trim().length === 0) {
    return "Customer name is required.";
  }
  if (!data.phone || typeof data.phone !== "string" || data.phone.trim().length < 5) {
    return "A valid phone number is required.";
  }
  if (!data.bookingDate && !data.date) {
    return "Appointment date is required.";
  }
  if (!data.bookingTime && !data.time) {
    return "Preferred appointment time is required.";
  }
  return null;
}

/**
 * Check appointment availability and detect conflicts
 * Rule: Stylist cannot have overlapping appointments on the same date.
 */
function checkAppointmentAvailability(sheet, targetDate, newTimeInterval, targetStylistKey) {
  var dataRange = sheet.getDataRange();
  var values = dataRange.getDisplayValues(); // Reads exact formatted text from sheet

  // If only header row exists, sheet is completely free
  if (values.length <= 1) {
    return { isAvailable: true, assignedStylist: CONFIG.KNOWN_STYLISTS[0] };
  }

  // Dynamically find column indices from header row
  var headers = values[0];
  var colDate = -1;
  var colTime = -1;
  var colStylist = -1;

  for (var c = 0; c < headers.length; c++) {
    var h = String(headers[c]).toLowerCase().trim();
    if (h.indexOf("date") !== -1) colDate = c;
    else if (h.indexOf("time") !== -1) colTime = c;
    else if (h.indexOf("stylist") !== -1 || h.indexOf("artist") !== -1) colStylist = c;
  }

  // Fallback defaults based on standard headers (Col F=5, Col G=6, Col H=7)
  if (colDate === -1) colDate = 6;
  if (colTime === -1) colTime = 7;
  if (colStylist === -1) colStylist = 5;

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var rowDateRaw = row[colDate];
    var rowTimeRaw = row[colTime];
    var rowStylistRaw = row[colStylist];

    if (!rowDateRaw || !rowTimeRaw) continue;

    var rowDate = normalizeDate(rowDateRaw);
    if (rowDate !== targetDate) {
      continue; // Different date -> No conflict
    }

    var rowTimeInterval = parseTimeInterval(rowTimeRaw);
    if (!rowTimeInterval) continue;

    // Check time interval overlap
    var hasOverlap = checkTimeOverlap(newTimeInterval, rowTimeInterval);
    if (hasOverlap) {
      var rowStylistKey = normalizeStylist(rowStylistRaw);

      // If requested stylist matches this booked stylist
      if (rowStylistKey === targetStylistKey) {
        return {
          isAvailable: false,
          conflictingStylist: rowStylistRaw,
          message: "This stylist (" + rowStylistRaw + ") is already booked for the selected date and time. Please choose another preferred time or select another stylist."
        };
      }
    }
  }

  // Selected stylist is available
  return {
    isAvailable: true
  };
}

/**
 * Check if two time intervals overlap:
 * Interval 1: [start1, end1]
 * Interval 2: [start2, end2]
 * Overlap condition: start1 < end2 && start2 < end1
 */
function checkTimeOverlap(t1, t2) {
  if (!t1 || !t2) return false;
  return (t1.start < t2.end) && (t2.start < t1.end);
}

/**
 * Normalize Date to "YYYY-MM-DD"
 */
function normalizeDate(dateVal) {
  if (!dateVal) return "";

  if (dateVal instanceof Date) {
    var year = dateVal.getFullYear();
    var month = ("0" + (dateVal.getMonth() + 1)).slice(-2);
    var day = ("0" + dateVal.getDate()).slice(-2);
    return year + "-" + month + "-" + day;
  }

  var str = String(dateVal).trim();
  
  // Format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Format: DD-MM-YYYY or DD/MM/YYYY or YYYY/MM/DD
  var parts = str.split(/[-\/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return parts[0] + "-" + ("0" + parts[1]).slice(-2) + "-" + ("0" + parts[2]).slice(-2);
    } else if (parts[2].length === 4) {
      return parts[2] + "-" + ("0" + parts[1]).slice(-2) + "-" + ("0" + parts[0]).slice(-2);
    }
  }

  var parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    var y = parsed.getFullYear();
    var m = ("0" + (parsed.getMonth() + 1)).slice(-2);
    var d = ("0" + parsed.getDate()).slice(-2);
    return y + "-" + m + "-" + d;
  }

  return str;
}

/**
 * Parse time string into minutes from midnight: { start: number, end: number }
 */
function parseTimeInterval(timeStr) {
  if (!timeStr) return null;

  if (timeStr instanceof Date) {
    var s = timeStr.getHours() * 60 + timeStr.getMinutes();
    return { start: s, end: s + CONFIG.DEFAULT_DURATION_MINUTES };
  }

  var str = String(timeStr).trim();

  // Check if string contains a range separator (–, -, to)
  var rangeParts = str.split(/–|-|\bto\b/i);

  if (rangeParts.length >= 2) {
    var startMin = parseSingleTimeToMinutes(rangeParts[0].trim());
    var endMin = parseSingleTimeToMinutes(rangeParts[1].trim());

    if (startMin !== null && endMin !== null) {
      if (endMin <= startMin) endMin += 1440;
      return { start: startMin, end: endMin };
    }
  }

  // Single time provided: assume 60 minutes duration
  var singleStart = parseSingleTimeToMinutes(str);
  if (singleStart !== null) {
    return {
      start: singleStart,
      end: singleStart + CONFIG.DEFAULT_DURATION_MINUTES
    };
  }

  return null;
}

/**
 * Convert time string (e.g. "02:05 PM", "2:05 PM", "9:30 AM", "14:05") into minutes from midnight (0 - 1440)
 */
function parseSingleTimeToMinutes(timePart) {
  if (!timePart && timePart !== 0) return null;

  if (timePart instanceof Date) {
    return timePart.getHours() * 60 + timePart.getMinutes();
  }

  var t = String(timePart).trim().toUpperCase();

  // Match e.g. "02:05 PM", "2:05 PM", "14:05"
  var match = t.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
  if (match) {
    var hours = parseInt(match[1], 10);
    var minutes = parseInt(match[2], 10);
    var meridian = match[3] ? match[3].toUpperCase() : null;

    if (meridian) {
      if (meridian === "PM" && hours < 12) hours += 12;
      if (meridian === "AM" && hours === 12) hours = 0;
    }
    return hours * 60 + minutes;
  }

  var matchSingle = t.match(/(\d{1,2})\s*(AM|PM)/i);
  if (matchSingle) {
    var hours = parseInt(matchSingle[1], 10);
    var meridian = matchSingle[2].toUpperCase();
    if (meridian === "PM" && hours < 12) hours += 12;
    if (meridian === "AM" && hours === 12) hours = 0;
    return hours * 60;
  }

  return null;
}

/**
 * Normalize stylist name for robust comparison
 */
function normalizeStylist(stylistStr) {
  if (!stylistStr) return "";
  var s = String(stylistStr).toLowerCase();

  if (s.indexOf("harshal") !== -1) return "harshal";
  if (s.indexOf("elena") !== -1 || s.indexOf("colorist") !== -1) return "elena";
  if (s.indexOf("sophia") !== -1 || s.indexOf("laurent") !== -1 || s.indexOf("bridal") !== -1) return "sophia";
  if (s.indexOf("julian") !== -1 || s.indexOf("cole") !== -1 || s.indexOf("fade") !== -1 || s.indexOf("barber") !== -1 || s.indexOf("spa") !== -1) return "julian";

  return s.replace(/[^a-z0-9]/g, "");
}

/**
 * Insert a new verified appointment into Google Sheets
 */
function createAppointment(sheet, data) {
  var row = [
    data.appointmentId,
    data.name,
    data.phone,
    data.email,
    data.service,
    data.stylist,
    data.appointmentDate,
    data.appointmentTime,
    data.message,
    data.status,
    data.createdAt
  ];

  sheet.appendRow(row);
  return data;
}

/**
 * Generate unique readable appointment ID
 */
function generateAppointmentId() {
  var dateStr = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyyMMdd");
  var randomNum = Math.floor(1000 + Math.random() * 9000);
  return "SD-" + dateStr + "-" + randomNum;
}

/**
 * Get or create the 'Appointments' sheet with proper headers
 */
function getOrCreateAppointmentsSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    sheet.appendRow(CONFIG.HEADERS);
    
    // Style header row
    var headerRange = sheet.getRange(1, 1, 1, CONFIG.HEADERS.length);
    headerRange.setBackground("#1f2937");
    headerRange.setFontColor("#f9fafb");
    headerRange.setFontWeight("bold");
    sheet.setFrozenRows(1);
  }

  return sheet;
}

/**
 * Helper to construct JSON or JSONP response
 */
function createJsonResponse(data, callback) {
  if (callback && typeof callback === "string") {
    var safeCallback = callback.replace(/[^a-zA-Z0-9_]/g, "");
    return ContentService
      .createTextOutput(safeCallback + "(" + JSON.stringify(data) + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
