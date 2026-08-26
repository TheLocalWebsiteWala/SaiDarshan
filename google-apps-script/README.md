# Sai Darshan Salon — Google Apps Script Booking Backend

This Google Apps Script backend provides **atomic double-booking prevention** and **stylist-level appointment conflict checking** for Sai Darshan Salon.

---

## 1. Setup Instructions

1. Open [Google Sheets](https://sheets.google.com) and create a new Spreadsheet (or use your existing sheet) named **"Sai Darshan Appointments"**.
2. In the top menu, go to: **Extensions** → **Apps Script**.
3. Clear any existing code in the editor and paste the entire contents of [`google-apps-script/Code.gs`](file:///c:/Users/ilesh/OneDrive/Desktop/SaiDarshan/google-apps-script/Code.gs).
4. Click **Save** (💾 icon).

---

## 2. Deploy as Web App

1. Click the blue **Deploy** button at the top right → **New deployment**.
2. Click the gear icon (⚙️) next to "Select type" and select **Web app**.
3. Fill in the deployment details:
   - **Description**: `Sai Darshan Booking API v1`
   - **Execute as**: `Me (your_email@gmail.com)`
   - **Who has access**: `Anyone` *(Crucial so the website can submit appointments)*
4. Click **Deploy**.
5. Copy the generated **Web App URL** (e.g. `https://script.google.com/macros/s/AKfycb.../exec`).

---

## 3. Connect to Website Frontend

In [`c:/Users/ilesh/OneDrive/Desktop/SaiDarshan/js/main.js`](file:///c:/Users/ilesh/OneDrive/Desktop/SaiDarshan/js/main.js), update the `GOOGLE_SCRIPT_URL` variable at the top of the contact form handler with your deployed Web App URL:

```javascript
var GOOGLE_SCRIPT_URL = "YOUR_DEPLOYED_WEB_APP_URL_HERE";
```

---

## 4. How Double-Booking Prevention Works

1. **LockService Guarantee**:
   When a booking request arrives, Google Apps Script acquires an exclusive script lock with `LockService.getScriptLock()`. This queues concurrent requests and prevents race conditions when two customers attempt to book the same slot at the exact same moment.

2. **Stylist-Level Availability**:
   - Availability is checked per individual stylist.
   - If Rahul is booked at 2:00 PM on 26-08-2026, Rahul is blocked for that time slot.
   - Another stylist (e.g., Harshal or Elena) remains free and can still be booked at 2:00 PM.

3. **Time-Overlap Calculation**:
   - Each appointment reserves a 1-hour window.
   - Overlap check: `(start1 < end2) && (start2 < end1)`.

4. **Conflict Response**:
   If a conflict occurs, the script returns:
   ```json
   {
     "success": false,
     "conflict": true,
     "message": "This stylist is already booked for the selected date and time. Please choose another preferred time or select another date."
   }
   ```
   The website displays a luxury modal asking the client to choose another time or stylist, keeping their form fields intact.

5. **No Cancellation API**:
   Per requirements, appointments are locked and no cancellation endpoint or flow is exposed.
