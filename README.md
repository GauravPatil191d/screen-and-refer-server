# Screen & Refer

Screen & Refer is a full-stack health screening and referral application built around a simple workflow for Health Workers and Doctors.

Health Workers can register patients and conduct screenings, while Doctors can review completed cases, confirm or override risk levels, view audit history, and generate an AI-assisted summary in English and Marathi.

The application focuses on role-based access, practical screening workflows, conditional questions, server-side risk calculation, data integrity, and graceful handling of unreliable AI or network services.

---

## Live Application

Frontend:  
https://screen-and-refer-admin.vercel.app/login

Backend:  
https://screen-and-refer-server.vercel.app/

---

## Demo Credentials

Two demo accounts are available for testing:

| Role | User ID | Password |
|------|---------|----------|
| Doctor | `doctor.gaurav` | `123456` |
| Health Worker | `worker.gaurav` | `123456` |

You can also create your own test user directly from the login page using the **Create Your Own User** option.

The demo accounts are intended only for testing and evaluation.

---

## Application Workflow

### Health Worker

A Health Worker can:

1. Log in to the application.
2. Register a patient.
3. View and manage their own patients.
4. Start a screening.
5. Complete the dynamic screening questionnaire.
6. Submit the screening.
7. View the calculated risk result.

### Doctor

A Doctor can:

1. View screening cases submitted by all Health Workers.
2. Search and filter screening records.
3. Open an individual screening case.
4. Review patient information and screening responses.
5. Accept the system-generated risk.
6. Override the risk with a mandatory reason.
7. View the audit history.
8. Generate an AI-assisted screening summary in English and Marathi.

---

## Main Features

### Authentication and Authorization

- Two application roles:
  - Health Worker
  - Doctor
- JWT-based authentication
- JWT stored in an HttpOnly cookie
- Server-side authentication and authorization
- Health Workers can access only their own records
- Doctors can access records from all Health Workers
- Doctor-only APIs are protected at the backend level

### Patient Management

- Create patient
- View patient
- Edit patient
- Soft delete patient
- Search patients
- Pagination
- Patient ownership enforcement

Patient names support Unicode and Devanagari script.

Example:

```text
अभिषेक मिश्रा
