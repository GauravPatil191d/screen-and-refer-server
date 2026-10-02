import { AiSummaryData } from "../model/doctor_model.js";

type SummaryInput = {
  ageAtScreening: number;
  sexAtScreening: string;
  systemRisk: string;
  answers: {
    question: string;
    answer: boolean;
  }[];
};

type GeminiResponse = {
  candidates?: Array<{
    finishReason?: string;
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

type GeminiSummaryResult = {
  english: string;
  marathi: string;
};

export default class GeminiSummaryService {
  private static readonly MAX_ATTEMPTS = 3;
  private static readonly TIMEOUT_MS = 30_000;

  private static isRetryableStatus(status: number) {
    return [429, 500, 502, 503, 504].includes(status);
  }

  private static async sleep(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  static async Generate(input: SummaryInput): Promise<AiSummaryData> {
    const apiKey = process.env.GEMINI_API_KEY;

    const model =
      process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const prompt = `
You are summarizing a health screening for a doctor.

IMPORTANT RULES:

1. Do not diagnose the patient.
2. Do not recommend treatment.
3. Do not invent symptoms, measurements, history, or conclusions.
4. Use ONLY the information explicitly provided.
5. Mention important positive findings first.
6. Keep both summaries concise, plain, and factual.
7. Clearly distinguish reported answers from the system-calculated risk.
8. The system risk is provided as data. Do not change it.
9. Return ONLY valid JSON.
10. Do not use markdown.
11. Return exactly two keys:
    "english"
    "marathi"
12. The Marathi summary MUST contain Devanagari text.

Return exactly:

{
  "english": "short factual summary",
  "marathi": "मराठीमध्ये संक्षिप्त तथ्यात्मक सारांश"
}

Screening data:
${JSON.stringify(input)}
`;

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${encodeURIComponent(model)}:generateContent`;

    let response: Response | undefined;

    for (
      let attempt = 1;
      attempt <= GeminiSummaryService.MAX_ATTEMPTS;
      attempt++
    ) {
      try {
        response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              thinkingConfig: {
                thinkingLevel: "minimal",
              },
            },
          }),
          signal: AbortSignal.timeout(
            GeminiSummaryService.TIMEOUT_MS,
          ),
        });
      } catch (error) {
        console.error(
          `Gemini request attempt ${attempt} failed:`,
          error,
        );

        if (attempt === GeminiSummaryService.MAX_ATTEMPTS) {
          throw new Error("Gemini request failed");
        }

        const delay = 1000 * 2 ** (attempt - 1);

        console.log(
          `Retrying Gemini request in ${delay}ms...`,
        );

        await GeminiSummaryService.sleep(delay);
        continue;
      }

      if (response.ok) {
        break;
      }

      const errorBody = await response.text();

      console.error("Gemini API error:", {
        attempt,
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      });

      if (
        !GeminiSummaryService.isRetryableStatus(
          response.status,
        )
      ) {
        throw new Error(
          `Gemini API request failed with status ${response.status}`,
        );
      }

      if (attempt === GeminiSummaryService.MAX_ATTEMPTS) {
        throw new Error(
          `Gemini API request failed with status ${response.status}`,
        );
      }

      const delay = 1000 * 2 ** (attempt - 1);

      console.log(
        `Gemini temporary failure (${response.status}). ` +
          `Retrying in ${delay}ms...`,
      );

      await GeminiSummaryService.sleep(delay);
    }

    if (!response || !response.ok) {
      throw new Error("Gemini request failed");
    }

    const result = (await response.json()) as GeminiResponse;

    if (result.error) {
      console.error(
        "Gemini returned an error:",
        result.error,
      );

      throw new Error(
        result.error.message ||
          "Gemini returned an error",
      );
    }

    const candidate = result.candidates?.[0];

    if (!candidate) {
      throw new Error(
        "Gemini returned no candidates",
      );
    }

    console.log(
      "Gemini finish reason:",
      candidate.finishReason,
    );

    const content = candidate.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!content) {
      throw new Error(
        "Gemini returned empty content",
      );
    }

    console.log(
      "Gemini raw response:",
      content,
    );

    const cleanedContent = content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed: Partial<GeminiSummaryResult>;

    try {
      parsed = JSON.parse(
        cleanedContent,
      ) as Partial<GeminiSummaryResult>;
    } catch (error) {
      console.error(
        "Failed to parse Gemini JSON:",
        {
          content,
          finishReason: candidate.finishReason,
          error,
        },
      );

      throw new Error(
        "Gemini returned invalid JSON",
      );
    }

    if (
      typeof parsed.english !== "string" ||
      typeof parsed.marathi !== "string"
    ) {
      throw new Error(
        "Gemini response is missing english or marathi summary",
      );
    }

    const english = parsed.english.trim();
    const marathi = parsed.marathi.trim();

    if (english.length < 20) {
      throw new Error(
        "Gemini English summary is too short",
      );
    }

    if (english.length > 2000) {
      throw new Error(
        "Gemini English summary is too long",
      );
    }

    if (marathi.length < 10) {
      throw new Error(
        "Gemini Marathi summary is too short",
      );
    }

    if (marathi.length > 2000) {
      throw new Error(
        "Gemini Marathi summary is too long",
      );
    }

    if (!/[\u0900-\u097F]/.test(marathi)) {
      throw new Error(
        "Gemini Marathi summary is not written in Devanagari",
      );
    }

    return {
      english,
      marathi,
      generatedAt: new Date(),
      model,
    };
  }
}