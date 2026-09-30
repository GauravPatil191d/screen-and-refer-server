export enum PatientSex {
  FEMALE = "FEMALE",
  MALE = "MALE",
  OTHER = "OTHER",
}

export enum BloodGroup {
  A_POSITIVE = "A+",
  A_NEGATIVE = "A-",
  B_POSITIVE = "B+",
  B_NEGATIVE = "B-",
  AB_POSITIVE = "AB+",
  AB_NEGATIVE = "AB-",
  O_POSITIVE = "O+",
  O_NEGATIVE = "O-",
}

export interface PatientData {
  patientId: string;
  name: string;
  email?: string;
  phone: string;
  dob: Date;
  sex: PatientSex;
  bloodGroup: BloodGroup;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}

export default class PatientEntity implements PatientData {
  patientId: string;
  name: string;
  email?: string;
  phone: string;
  dob: Date;
  sex: PatientSex;
  bloodGroup: BloodGroup;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;

  constructor(patient: PatientData) {
    this.patientId = patient.patientId;
    this.name = patient.name;
    this.email = patient.email;
    this.phone = patient.phone;
    this.dob = patient.dob;
    this.sex = patient.sex;
    this.bloodGroup = patient.bloodGroup;
    this.createdBy = patient.createdBy;
    this.createdAt = patient.createdAt;
    this.updatedAt = patient.updatedAt;
    this.isDeleted = patient.isDeleted;
    this.deletedAt = patient.deletedAt;
    this.deletedBy = patient.deletedBy;
  }
}