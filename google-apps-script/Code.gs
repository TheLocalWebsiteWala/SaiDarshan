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
  var lock = LockService.getScriptLock();
  
  try {
    // Acquire lock to prevent race conditions & simultaneous double booking (wait up to 30s)
    var lockAcquired = lock.tryLock(30000);
    if (!lockAcquired) {
      return createJsonResponse({
        success: false,
        conflict: false,
        message: "Server is currently busy processing bookings. Please try again in a few seconds."
      });
    }

    // 1. Parse incoming request data
    var data = parseRequestData(e);
    if (!data) {
      return createJsonResponse({
        success: false,
        conflict: false,
        message: "Invalid booking data received."
      });
    }

    // 2. Validate required fields
    var validationError = validateBookingData(data);
    if (validationError) {
      return createJsonResponse({
        success: false,
        conflict: false,
        message: validationError
      });
    }

    // 3. Get or initialize Appointments sheet
    var sheet = getOrCreateAppointmentsSheet();

    // 4. Normalize incoming parameters
    var normalizedDate = normalizeDate(data.bookingDate || data.date);
    var newTimeInterval = parseTimeInterval(data.bookingTime || data.time);
    var rawStylist = data.stylist || "Any Available Master Stylist";
    var normalizedStylist = normalizeStylist(rawStylist);

    if (!normalizedDate) {
      return createJsonResponse({
        success: false,
        conflict: false,
        message: "Invalid appointment date format."
      });
    }

    if (!newTimeInterval) {
      return createJsonResponse({
        success: false,
        conflict: false,
        message: "Invalid appointment time format."
      });
    }

    // 5. Check appointment availability & conflicts
    var availability = checkAppointmentAvailability(sheet, normalizedDate, newTimeInterval, normalizedStylist);

    // 6. If conflict detected, return clear conflict response (Do not insert into sheet)
    if (!availability.isAvailable) {
      return createJsonResponse({
        success: false,
        conflict: true,
        stylist: availability.conflictingStylist || rawStylist,
        date: normalizedDate,
        time: data.bookingTime || data.time,
        message: availability.message || "This stylist is already booked for the selected date and time. Please choose another preferred time or select another date."
      });
    }

    // 7. If available, assign actual stylist (if 'Any' was selected, assign the free one)
    var assignedStylist = availability.assignedStylist || rawStylist;

    // 8. Create appointment row in Google Sheets
    var appointmentId = generateAppointmentId();
    var createdAppointment = createAppointment(sheet, {
      appointmentId: appointmentId,
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: (data.email || "").trim(),
      service: data.service || "General Salon Service",
      stylist: assignedStylist,
      appointmentDate: normalizedDate,
      appointmentTime: data.bookingTime || data.time,
      message: (data.notes || data.message || "").trim(),
      status: "Confirmed",
      createdAt: new Date()
    });

    // 9. Return success response
    return createJsonResponse({
      success: true,
      conflict: false,
      appointmentId: appointmentId,
      stylist: assignedStylist,
      date: normalizedDate,
      time: data.bookingTime || data.time,
      message: "Appointment booked successfully! Your appointment has been successfully submitted."
    });

  } catch (error) {
    Logger.log("Error in doPost: " + error.toString());
    return createJsonResponse({
      success: false,
      conflict: false,
      message: "Unable to process the appointment. Please try again."
    });
  } finally {
    // Release the script lock
    try {
      lock.releaseLock();
    } catch (e) {}
  }
}

/**
 * Handle HTTP GET requests for testing / connection verification
 */
function doGet(e) {
  // Support checking availability via GET or simple ping
  if (e && e.parameter && e.parameter.check === "availability") {
    var sheet = getOrCreateAppointmentsSheet();
    var date = normalizeDate(e.parameter.date);
    var timeInterval = parseTimeInterval(e.parameter.time);
    var stylist = normalizeStylist(e.parameter.stylist);
    var res = checkAppointmentAvailability(sheet, date, timeInterval, stylist);
    return createJsonResponse(res);
  }

  return createJsonResponse({
    status: "online",
    service: "Sai Darshan Salon Booking API",
    message: "Google Apps Script backend is active and ready for appointment bookings."
  });
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
  var values = dataRange.getValues();

  // If only header row exists, sheet is completely free
  if (values.length <= 1) {
    var defaultStylist = targetStylistKey === "any" ? CONFIG.KNOWN_STYLISTS[0] : null;
    return { isAvailable: true, assignedStylist: defaultStylist };
  }

  // Column indexes based on CONFIG.HEADERS
  var colDate = 6;      // Index 6: Appointment Date
  var colTime = 7;      // Index 7: Appointment Time
  var colStylist = 5;   // Index 5: Stylist/Artist

  var bookedStylistsOnSlot = {};

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
      bookedStylistsOnSlot[rowStylistKey] = true;

      // If customer requested a specific stylist and that stylist is already booked
      if (targetStylistKey !== "any" && rowStylistKey === targetStylistKey) {
        return {
          isAvailable: false,
          conflictingStylist: rowStylistRaw,
          message: "This stylist (" + rowStylistRaw + ") is already booked for the selected date and time. Please choose another preferred time or select another stylist."
        };
      }
    }
  }

  // If customer selected "Any Available Stylist"
  if (targetStylistKey === "any") {
    // Find the first known stylist who is not booked during this time
    for (var s = 0; s < CONFIG.KNOWN_STYLISTS.length; s++) {
      var candidate = CONFIG.KNOWN_STYLISTS[s];
      var candidateKey = normalizeStylist(candidate);
      if (!bookedStylistsOnSlot[candidateKey]) {
        return {
          isAvailable: true,
          assignedStylist: candidate
        };
      }
    }
    // All stylists are booked for this slot
    return {
      isAvailable: false,
      conflictingStylist: "All Stylists",
      message: "All stylists are fully booked for the selected date and time slot. Please choose another time or date."
    };
  }

  // Selected specific stylist is available
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

  // Format: DD-MM-YYYY or DD/MM/YYYY
  var parts = str.split(/[-\/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY/MM/DD
      return parts[0] + "-" + ("0" + parts[1]).slice(-2) + "-" + ("0" + parts[2]).slice(-2);
    } else if (parts[2].length === 4) {
      // DD-MM-YYYY
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
 * Supports formats:
 * - "09:00 AM – 11:00 AM" (range)
 * - "2:00 PM" (single time -> defaults to 1 hour duration: 14:00 - 15:00)
 * - "14:00"
 */
function parseTimeInterval(timeStr) {
  if (!timeStr) return null;
  var str = String(timeStr).trim();

  // Check if string contains a range separator (–, -, to)
  var rangeParts = str.split(/–|-|\bto\b/i);

  if (rangeParts.length >= 2) {
    var startMin = parseSingleTimeToMinutes(rangeParts[0].trim());
    var endMin = parseSingleTimeToMinutes(rangeParts[1].trim());

    if (startMin !== null && endMin !== null) {
      if (endMin <= startMin) endMin += 1440; // Handle overnight edge cases
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
 * Convert time string (e.g. "02:00 PM", "9:30 AM", "14:00") into minutes from midnight (0 - 1440)
 */
function parseSingleTimeToMinutes(timePart) {
  if (!timePart) return null;
  var t = String(timePart).trim().toUpperCase();

  // Match e.g. "02:30 PM", "2 PM", "09:00 AM", "14:30"
  var match = t.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!match) return null;

  var hours = parseInt(match[1], 10);
  var minutes = match[2] ? parseInt(match[2], 10) : 0;
  var meridian = match[3] ? match[3].toUpperCase() : null;

  if (meridian) {
    if (meridian === "PM" && hours < 12) hours += 12;
    if (meridian === "AM" && hours === 12) hours = 0;
  }

  return hours * 60 + minutes;
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
 * Helper to construct JSON response
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
