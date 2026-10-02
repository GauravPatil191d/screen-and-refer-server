# Screen & Refer

Screen & Refer is a full-stack health screening and referral application built for the BriskFab Full-Stack Developer Assignment.

The application is designed around a simple workflow:

- Health Workers register patients and conduct health screenings.
- The system calculates a server-side risk level.
- Doctors review submitted screenings and can accept or override the calculated risk.
- Doctors can also generate an AI-assisted screening summary in English and Marathi.

The project focuses on practical field usage, role-based access, data integrity, conditional screening flows, and graceful handling of unreliable AI or network services.

---

## Live Application

Frontend:  
https://screen-and-refer-admin.vercel.app/login

Backend:  
https://screen-and-refer-server.vercel.app/

---

## Demo Credentials

The application includes two demo accounts for evaluation.

| Role | User ID | Password |
|------|---------|----------|
| Doctor | `doctor.gaurav` | `123456` |
| Health Worker | `worker.gaurav` | `123456` |

You can also create your own test user directly from the login page using the **Create Your Own User** option.

The above credentials are provided only for assignment evaluation.

---

## Application Workflow

### Health Worker

A Health Worker can:

1. Log in to the application.
2. Register a patient.
3. View and manage their patients.
4. Start a screening for a patient.
5. Complete the dynamic screening questionnaire.
6. Submit the screening.
7. View the calculated risk result.

### Doctor

A Doctor can:

1. View screening cases submitted by all Health Workers.
2. Search and filter screening records.
3. Open a screening and review the patient information and responses.
4. Accept the system-generated risk.
5. Override the risk level with a mandatory reason.
6. View the audit history for review changes.
7. Generate an AI-assisted screening summary in English and Marathi.

---

## Main Features

### Authentication and Authorization

- Two application roles:
  - Health Worker
  - Doctor
- JWT-based authentication
- JWT stored in an HttpOnly cookie
- Server-side role authorization
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

Patient data supports Unicode and Devanagari names.

For example:

```text
अभिषेक मिश्रा
