# NOTES

## 1. Why I picked this stack

I chose Next.js with TypeScript for the frontend because it provides a structured React-based application with strong typing and straightforward routing. For the backend, I used Node.js, Express and TypeScript to keep the API layer simple and modular. MongoDB was chosen for flexible patient and screening data, especially for configuration-driven screening responses. Vercel and MongoDB Atlas also make the application simple to deploy and maintain within the scope of this project.

## 2. Handling the required edge cases

### DOB corrected after screening
The patient's age and relevant demographic information are stored as a snapshot when the screening starts. Updating the patient's DOB later does not change the historical screening data.

### Connection drops or page refresh during screening
Screening progress is saved as a draft and the frontend also retains unsent progress locally, allowing the user to continue after a refresh or temporary connection issue.

### Same person registered twice
Phone numbers are normalized before storage and duplicate checking. Formats such as `+91XXXXXXXXXX`, `0XXXXXXXXXX` and `XXXXXXXXXX` are treated as the same Indian mobile number. Active patient records are protected from duplicate registration.

### Devanagari names
Patient names are stored as Unicode, so names written in Devanagari can be entered, stored, searched and displayed without modification.

### Health Worker calls Doctor-only API
Role authorization is enforced on the backend. Doctor-only routes check the authenticated user's role and reject unauthorized Health Worker requests with a 403 response.

### Follow-up question disappears
When a previous answer changes and makes a follow-up question no longer applicable, the previous answer is retained as inactive but excluded from the submitted screening and risk calculation.

## 3. One AI coding issue I caught

An AI coding tool initially suggested using Gemini structured JSON output with an `application/json` MIME-type configuration for the selected Gemini model. The deployed API rejected that request. I removed the incompatible configuration, changed the integration to a simpler text-based JSON response, added validation for the generated output, and added retry/fallback handling so an AI failure does not affect the main screening workflow.

## 4. New requirement: SMS alert for High risk

I would add an SMS notification step after the final risk is determined to be High. The backend would use an SMS provider such as Twilio or another suitable provider and send the message to the patient's already-normalized phone number. The notification should be triggered from the backend rather than the frontend, and delivery failures should be handled independently so an SMS problem does not affect screening or doctor review.

I would leave the existing patient, screening, risk calculation, doctor review, audit, authentication and AI workflows unchanged. The SMS functionality would be added as a separate notification layer triggered by the final High-risk decision.
