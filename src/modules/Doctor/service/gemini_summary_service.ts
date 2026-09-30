import { AiSummaryData } from "../model/doctor_model.js";

type SummaryInput = {
  ageAtScreening: number;
  sexAtScreening: string;
  systemRisk: string;
  answers: { question: string; answer: boolean }[];
};

type GeminiResponse = {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
};

export default class GeminiSummaryService {
  static async Generate(input: SummaryInput): Promise<AiSummaryData> {
    const apiKey = process.env.GEMINI_API_KEY ?? process.env.gemini_api_key;
    const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

    if (!apiKey) {
      throw new Error("Gemini API key is not configured");
    }

    const prompt = [
      "You are summarizing a health screening for a doctor.",
      "Do not diagnose the patient.",
      "Do not invent symptoms, measurements, history, or conclusions.",
      "Only summarize information explicitly provided.",
      `Clearly distinguish reported answers from the system risk, and explicitly state the system risk is ${input.systemRisk}.`,
      "Return exactly a JSON object with keys english and marathi.",
      "Keep both summaries plain and concise.",
      "Screening data:",
      JSON.stringify(input),
    ].join("\n");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                english: { type: "STRING" },
                marathi: { type: "STRING" },
              },
              required: ["english", "marathi"],
            },
          },
        }),
        signal: AbortSignal.timeout(15000),
      },
    );

    if (!response.ok) {
      throw new Error("Gemini request failed");
    }

    const result = (await response.json()) as GeminiResponse;
    const content = result.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!content) {
      throw new Error("Gemini returned empty content");
    }

    const unwrapped = content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");
    const parsed = JSON.parse(unwrapped) as Partial<Pick<AiSummaryData, "english" | "marathi">>;

    if (
      typeof parsed.english !== "string" ||
      parsed.english.trim().length < 20 ||
      parsed.english.length > 2000 ||
      !new RegExp(`\\b${input.systemRisk}\\b`, "i").test(parsed.english) ||
      typeof parsed.marathi !== "string" ||
      parsed.marathi.trim().length < 10 ||
      parsed.marathi.length > 2000 ||
      !/[\u0900-\u097f]/.test(parsed.marathi)
    ) {
      throw new Error("Gemini returned an invalid summary");
    }

    return {
      english: parsed.english.trim(),
      marathi: parsed.marathi.trim(),
      generatedAt: new Date(),
      model,
    };
  }
}