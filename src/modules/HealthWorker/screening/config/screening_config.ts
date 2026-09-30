export type ScreeningConditionRule =
  | { field: "ageAtScreening"; operator: "gte"; value: number }
  | { field: "sexAtScreening"; operator: "equals"; value: string }
  | { field: "answers"; questionId: string; operator: "equals"; value: boolean };

export interface ScreeningCondition {
  all: ScreeningConditionRule[];
}

export interface ScreeningQuestion {
  id: string;
  text: string;
  type: "number" | "select" | "boolean";
  source?: "patient";
  required: boolean;
  showWhen?: ScreeningCondition;
}

export interface ScreeningConfig {
  protocolId: string;
  version: string;
  disclaimer: string;
  questions: ScreeningQuestion[];
  riskRules: {
    highRiskConditions: ScreeningCondition[];
    moderateRiskQuestionIds: string[];
    scoreBands: { minimumScore: number; riskLevel: "LOW" | "MEDIUM" | "HIGH" }[];
  };
}

export const screeningConfig = {
  protocolId: "CUSTOM_ASSIGNMENT_SCREENING_RUBRIC",
  version: "1.0.0",
  disclaimer: "Screening aid only, not a diagnosis.",
  questions: [
    { id: "q1", text: "Age", type: "number", source: "patient", required: true },
    { id: "q2", text: "Sex", type: "select", source: "patient", required: true },
    { id: "q3", text: "Do you currently have fever?", type: "boolean", required: true },
    { id: "q4", text: "Do you have a cough?", type: "boolean", required: true },
    { id: "q5", text: "Have you had difficulty breathing or shortness of breath?", type: "boolean", required: true },
    { id: "q6", text: "Do you have chest pain?", type: "boolean", required: true },
    { id: "q7", text: "Have you fainted, become confused, or been unusually difficult to wake?", type: "boolean", required: true },
    { id: "q8", text: "Have you had a seizure or convulsion?", type: "boolean", required: true },
    { id: "q9", text: "Have you had persistent vomiting or diarrhoea?", type: "boolean", required: true },
    { id: "q10", text: "Have you noticed blood in vomit, stool, urine, or while coughing?", type: "boolean", required: true },
    { id: "q11", text: "Do you have a severe headache or stiff neck?", type: "boolean", required: true },
    {
      id: "q12",
      text: "Do you have a known condition such as diabetes or high blood pressure?",
      type: "boolean",
      required: true,
      showWhen: { all: [{ field: "ageAtScreening", operator: "gte", value: 18 }] },
    },
    {
      id: "q13",
      text: "Could you currently be pregnant?",
      type: "boolean",
      required: true,
      showWhen: {
        all: [
          { field: "sexAtScreening", operator: "equals", value: "FEMALE" },
          { field: "ageAtScreening", operator: "gte", value: 12 },
        ],
      },
    },
    {
      id: "q14",
      text: "Do you have vaginal bleeding or severe lower-abdominal pain?",
      type: "boolean",
      required: true,
      showWhen: {
        all: [
          { field: "sexAtScreening", operator: "equals", value: "FEMALE" },
          { field: "ageAtScreening", operator: "gte", value: 12 },
          { field: "answers", questionId: "q13", operator: "equals", value: true },
        ],
      },
    },
    {
      id: "q15",
      text: "Do you currently use tobacco, alcohol, or other substances?",
      type: "boolean",
      required: true,
      showWhen: { all: [{ field: "ageAtScreening", operator: "gte", value: 18 }] },
    },
  ] satisfies ScreeningQuestion[],
  riskRules: {
    highRiskConditions: [
      { all: [{ field: "answers", questionId: "q5", operator: "equals", value: true }] },
      { all: [{ field: "answers", questionId: "q6", operator: "equals", value: true }] },
      { all: [{ field: "answers", questionId: "q7", operator: "equals", value: true }] },
      { all: [{ field: "answers", questionId: "q8", operator: "equals", value: true }] },
      { all: [{ field: "answers", questionId: "q10", operator: "equals", value: true }] },
      {
        all: [
          { field: "answers", questionId: "q13", operator: "equals", value: true },
          { field: "answers", questionId: "q14", operator: "equals", value: true },
        ],
      },
    ],
    moderateRiskQuestionIds: ["q3", "q4", "q9", "q11", "q12", "q15"],
    scoreBands: [
      { minimumScore: 4, riskLevel: "HIGH" },
      { minimumScore: 2, riskLevel: "MEDIUM" },
      { minimumScore: 0, riskLevel: "LOW" },
    ],
  },
} satisfies ScreeningConfig;