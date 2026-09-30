import { randomUUID } from "node:crypto";

import { PatientSex } from "../../patient/model/patient_model.js";
import { UserRole } from "../../../users/model/user_model.js";
import PatientService from "../../patient/service/patient_service.js";
import {
  ScreeningCondition,
  ScreeningConditionRule,
  ScreeningQuestion,
  screeningConfig,
} from "../config/screening_config.js";
import ScreeningEntity, {
  RiskLevel,
  ScreeningData,
  ScreeningStatus,
} from "../model/screening_model.js";
import ScreeningRepository from "../repository/screening_repository.js";

type ScreeningContext = {
  ageAtScreening: number;
  sexAtScreening: PatientSex;
  answers: Record<string, boolean>;
};

type InactiveAnswer = ScreeningData["inactiveAnswers"][string];

function getAge(dob: Date, today = new Date()) {
  let age = today.getFullYear() - dob.getFullYear();
  const beforeBirthday =
    today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate());

  if (beforeBirthday) {
    age -= 1;
  }

  return age;
}

function evaluateRule(rule: ScreeningConditionRule, context: ScreeningContext) {
  switch (rule.field) {
    case "ageAtScreening":
      return context.ageAtScreening >= rule.value;
    case "sexAtScreening":
      return context.sexAtScreening === rule.value;
    case "answers":
      return context.answers[rule.questionId] === rule.value;
  }
}

function evaluateCondition(condition: ScreeningCondition, context: ScreeningContext) {
  return condition.all.every((rule) => evaluateRule(rule, context));
}

function isQuestionActive(question: ScreeningQuestion, context: ScreeningContext) {
  return !question.showWhen || evaluateCondition(question.showWhen, context);
}

function getScreeningContext(screening: ScreeningData): ScreeningContext {
  const legacyAnswers = screening.answers as Record<string, unknown>;
  const ageAtScreening = screening.ageAtScreening ?? legacyAnswers.q1;
  const sexAtScreening = screening.sexAtScreening ?? legacyAnswers.q2;

  if (typeof ageAtScreening !== "number" || !Number.isInteger(ageAtScreening)) {
    throw new Error("Screening age snapshot is missing");
  }

  if (!Object.values(PatientSex).includes(sexAtScreening as PatientSex)) {
    throw new Error("Screening sex snapshot is missing");
  }

  return {
    ageAtScreening,
    sexAtScreening: sexAtScreening as PatientSex,
    answers: {},
  };
}

function parseDraftAnswers(answersInput: unknown, screening: ScreeningData) {
  if (!answersInput || typeof answersInput !== "object" || Array.isArray(answersInput)) {
    throw new Error("answers must be an object");
  }

  const input = answersInput as Record<string, unknown>;
  const questions = screeningConfig.questions.filter((question) => !question.source);
  const questionIds = new Set(questions.map((question) => question.id));
  const context = getScreeningContext(screening);
  const answers: ScreeningData["answers"] = {};
  const inactiveAnswers: ScreeningData["inactiveAnswers"] = {
    ...(screening.inactiveAnswers ?? {}),
  };

  for (const [questionId, answer] of Object.entries(input)) {
    if (questionId === "q1" || questionId === "q2") {
      throw new Error(`${questionId} is derived from the patient and cannot be changed`);
    }

    if (!questionIds.has(questionId)) {
      throw new Error(`Unknown question: ${questionId}`);
    }

    if (typeof answer !== "boolean") {
      throw new Error(`${questionId} must be answered true or false`);
    }
  }

  for (const question of questions) {
    const hasNewAnswer = Object.hasOwn(input, question.id);
    const previousAnswer = screening.answers[question.id];
    const archivedAnswer = inactiveAnswers[question.id]?.value;
    const candidate = hasNewAnswer ? input[question.id] : previousAnswer ?? archivedAnswer;

    if (candidate === undefined) {
      continue;
    }

    const isActive = isQuestionActive(question, context);

    if (isActive) {
      if (typeof candidate !== "boolean") {
        throw new Error(`${question.id} must be answered true or false`);
      }

      answers[question.id] = candidate;
      context.answers[question.id] = candidate;
    } else if (typeof candidate === "boolean") {
      if (inactiveAnswers[question.id]?.value !== candidate) {
        const archived: InactiveAnswer = {
          value: candidate,
          status: "INACTIVE",
          inactiveReason: "CONDITION_NO_LONGER_MATCHES",
          recordedAt: new Date(),
        };
        inactiveAnswers[question.id] = archived;
      }
    }
  }

  return {
    answers,
    inactiveAnswers,
    ageAtScreening: context.ageAtScreening,
    sexAtScreening: context.sexAtScreening,
  };
}

function validateAndScore(screening: ScreeningData) {
  const context = getScreeningContext(screening);
  const questions = screeningConfig.questions.filter((question) => !question.source);
  const answers: ScreeningData["answers"] = {};
  const inactiveAnswers: ScreeningData["inactiveAnswers"] = {
    ...(screening.inactiveAnswers ?? {}),
  };

  for (const question of questions) {
    const answer = screening.answers[question.id];

    if (!isQuestionActive(question, context)) {
      if (typeof answer === "boolean") {
        inactiveAnswers[question.id] = {
          value: answer,
          status: "INACTIVE",
          inactiveReason: "CONDITION_NO_LONGER_MATCHES",
          recordedAt: new Date(),
        };
      }

      continue;
    }

    if (typeof answer !== "boolean") {
      throw new Error(`${question.id} is required and must be true or false`);
    }

    answers[question.id] = answer;
    context.answers[question.id] = answer;
  }

  const hasHighRiskCondition = screeningConfig.riskRules.highRiskConditions.some(
    (condition) => evaluateCondition(condition, context),
  );

  if (hasHighRiskCondition) {
    return {
      answers,
      inactiveAnswers,
      ageAtScreening: context.ageAtScreening,
      sexAtScreening: context.sexAtScreening,
      riskLevel: RiskLevel.HIGH,
    };
  }

  const moderateScore = screeningConfig.riskRules.moderateRiskQuestionIds.reduce(
    (score, questionId) => score + (context.answers[questionId] === true ? 1 : 0),
    0,
  );
  const riskLevel = screeningConfig.riskRules.scoreBands.find(
    (band) => moderateScore >= band.minimumScore,
  )?.riskLevel;

  if (!riskLevel) {
    throw new Error("No risk band matches the screening answers");
  }

  return {
    answers,
    inactiveAnswers,
    ageAtScreening: context.ageAtScreening,
    sexAtScreening: context.sexAtScreening,
    riskLevel: riskLevel as RiskLevel,
  };
}

export default class ScreeningService {
  static GetConfig() {
    return screeningConfig;
  }

  static async StartScreening(patientId: string, userId: string) {
    const patient = await PatientService.GetPatientById(
      patientId,
      UserRole.HEALTH_WORKER,
      userId,
    );
    const now = new Date();
    const ageAtScreening = getAge(patient.dob);
    const screening = new ScreeningEntity({
      screeningId: randomUUID(),
      patientId,
      createdBy: userId,
      ageAtScreening,
      sexAtScreening: patient.sex,
      status: ScreeningStatus.DRAFT,
      configVersion: screeningConfig.version,
      answers: {},
      inactiveAnswers: {},
      startedAt: now,
      updatedAt: now,
      doctorReviewStatus: "PENDING",
    });

    return ScreeningRepository.CreateScreening(screening);
  }

  static async GetScreening(screeningId: string, role: UserRole, userId: string) {
    const screening = await ScreeningRepository.GetScreening(screeningId, role, userId);

    if (!screening) {
      throw new Error("Screening not found");
    }

    const patient = await PatientService.GetPatientById(
      screening.patientId,
      role,
      userId,
    );

    return { ...screening, patient };
  }

  static async SaveDraft(screeningId: string, userId: string, answers: unknown) {
    const screening = await ScreeningRepository.GetScreening(
      screeningId,
      UserRole.HEALTH_WORKER,
      userId,
    );

    if (!screening || screening.status !== ScreeningStatus.DRAFT) {
      throw new Error("Draft screening not found");
    }

    const draftAnswers = parseDraftAnswers(answers, screening);

    return ScreeningRepository.UpdateDraftAnswers(
      screeningId,
      userId,
      draftAnswers.answers,
      draftAnswers.inactiveAnswers,
      draftAnswers.ageAtScreening,
      draftAnswers.sexAtScreening,
    );
  }

  static async SubmitScreening(screeningId: string, userId: string) {
    const screening = await ScreeningRepository.GetScreening(
      screeningId,
      UserRole.HEALTH_WORKER,
      userId,
    );

    if (!screening || screening.status !== ScreeningStatus.DRAFT) {
      throw new Error("Draft screening not found");
    }

    const result = validateAndScore(screening);
    const completed = await ScreeningRepository.CompleteScreening(
      screeningId,
      userId,
      result.answers,
      result.inactiveAnswers,
      result.ageAtScreening,
      result.sexAtScreening,
      result.riskLevel,
    );

    if (!completed) {
      throw new Error("Draft screening not found");
    }

    return {
      screeningId: completed.screeningId,
      riskLevel: completed.riskLevel,
      status: completed.status,
      disclaimer: screeningConfig.disclaimer,
    };
  }
}