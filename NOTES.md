# NOTES

## 1. Why I picked this stack

I went with Next.js, TypeScript, Node.js, Express and MongoDB because I have been working mainly with the MERN stack for around 2 years, so I am already comfortable working with this setup. I used Next.js for the frontend because it gives me routing and a clean React structure without adding too much extra setup. For the backend, I kept the code separated by modules and used controller, service and repository layers so it stays easier to manage. MongoDB also suited the screening data because the questions are configuration-based and can change.

## 2. Handling the required edge cases

### DOB corrected after screening
When the screening starts, I save the patient's age at that time. So if the DOB is corrected later, the old screening still keeps the original age.

### Connection drops or page refresh during screening
I save the screening as a draft and also keep the current answers locally on the frontend. This means a refresh or a temporary connection issue does not make the worker start everything again.

### Same person registered twice
The phone number is normalized before checking for duplicates. So formats like `+91XXXXXXXXXX`, `0XXXXXXXXXX` and `XXXXXXXXXX` are treated as the same number. This also helps when the same person is entered with a slightly different spelling of their name.

### Devanagari names
I did not add any special translation logic for names. They are stored as Unicode, so names such as `अभिषेक मिश्रा` can be entered, searched and displayed normally.

### Health Worker calls Doctor-only API
I did not depend only on hiding the buttons in the frontend. The backend checks the user's role before allowing Doctor APIs, so a Health Worker calling those APIs directly gets a 403 response.

### Follow-up question disappears
When an earlier answer changes and a follow-up question is no longer applicable, I keep the old answer but mark it as inactive. It is then ignored when the final screening score is calculated.

## 3. One AI coding issue I caught

One AI-generated UI version used emojis for some buttons and status indicators. I felt they looked out of place with the rest of the application, especially for a healthcare interface, so I replaced them with proper icons and kept the styling consistent across the Worker and Doctor screens.

## 4. New requirement: SMS alert for High risk

I would add SMS as a separate backend notification step after the final risk is decided as High. The patient's normalized phone number can be used to send the alert through an SMS provider.

I would not change the existing screening, risk calculation, doctor review or audit logic. The SMS should be triggered separately, and if the SMS service fails, it should not stop the screening or doctor from completing the case.
