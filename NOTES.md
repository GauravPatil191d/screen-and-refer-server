# NOTES

## 1. Why I picked this stack

I used Next.js and TypeScript for the frontend because I am comfortable with React and wanted proper typing and simple routing. For the backend, I used Node.js, Express and TypeScript because it keeps the API structure simple and easy to maintain. I used MongoDB because the screening data is flexible and the questions are configuration-based. I used Vercel for deployment because it was quick to set up and works well for this project.

## 2. Handling the required edge cases

### DOB corrected after screening
When a screening starts, I store the patient's age and other required details as a snapshot. So if the patient's DOB is changed later, the old screening still keeps the original age.

### Connection drops or page refresh during screening
The screening is saved as a draft, and the frontend also keeps the current unsent answers locally. So refreshing the page or temporarily losing the connection does not immediately lose the work.

### Same person registered twice
I normalize the phone number before checking for duplicates. For example, `+91XXXXXXXXXX`, `0XXXXXXXXXX` and `XXXXXXXXXX` are treated as the same number. This helps avoid duplicate records when the same person is entered again with a different name spelling.

### Devanagari names
Names are stored as Unicode, so names such as `अभिषेक मिश्रा` can be entered, stored, searched and displayed normally.

### Health Worker calls Doctor-only API
The backend checks the user's role before allowing access to Doctor APIs. A Health Worker trying to call those APIs directly gets a 403 response.

### Follow-up question disappears
If an earlier answer changes and a follow-up question is no longer applicable, the previous answer is marked as inactive. It is not used in the final screening score.

## 3. One AI coding issue I caught

While integrating Gemini, an AI coding tool suggested using a structured JSON response with an `application/json` setting. Gemini rejected that request with a 400 error. I removed that part and changed it to a simpler text response that I parse and validate myself. I also added retry and fallback handling so the application still works when Gemini is unavailable.

## 4. New requirement: SMS alert for High risk

I would add the SMS part in the backend after the final risk is decided as High. I would use an SMS provider and send the alert to the patient's normalized phone number.

I would keep the existing patient, screening, risk calculation, doctor review and audit logic as it is. SMS would be added as a separate notification step so that even if the SMS service fails, the screening and doctor review should continue normally.
