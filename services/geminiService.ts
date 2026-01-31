
import { GoogleGenAI, Type } from "@google/genai";
import { Challenge, ChallengeType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Prompt de sistema para o tutor pedagógico
export const SYSTEM_PROMPT = `
Você é um tutor pedagógico especialista em tecnologia. Sua tarefa é analisar o vídeo anexado e identificar momentos chave onde um conceito técnico foi concluído.
Para cada momento, crie um desafio (Quiz ou Exercício de Código).

Regras de Saída:
1. Retorne APENAS um objeto JSON.
2. Identifique de 2 a 4 momentos no vídeo.
3. Use o formato de timestamp MM:SS para 'timestampLabel' e converta para segundos em 'timestamp'.
4. Para desafios de 'code', forneça uma 'task' clara e o 'correctAnswer' como o código esperado.
5. Para 'quiz', forneça 4 'options' e o 'correctAnswer' como o índice (0-3).
6. Inclua um 'summary' curto explicando o conceito que acabou de ser visto.

Dificuldade Adaptativa: Foque em conceitos fundamentais mas prepare a base para aumentar a complexidade.
`;

export async function analyzeVideo(videoBase64: string, mimeType: string): Promise<Challenge[]> {
  const model = ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: {
      parts: [
        { inlineData: { data: videoBase64, mimeType } },
        { text: "Analise este vídeo e gere os desafios técnicos conforme as instruções de sistema." }
      ]
    },
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          challenges: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                timestamp: { type: Type.NUMBER },
                timestampLabel: { type: Type.STRING },
                type: { type: Type.STRING, enum: Object.values(ChallengeType) },
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                correctAnswer: { type: Type.STRING },
                summary: { type: Type.STRING }
              },
              required: ["timestamp", "type", "title", "content", "correctAnswer", "summary"]
            }
          }
        },
        required: ["challenges"]
      }
    }
  });

  const response = await model;
  const data = JSON.parse(response.text || '{"challenges": []}');

  // Add unique IDs to challenges
  return data.challenges.map((c: any, index: number) => ({
    ...c,
    id: `challenge-${index}-${Date.now()}`
  }));
}
