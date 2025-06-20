import { streamText } from "ai";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: 'AIzaSyD0phHq4PckAy8vLYlzkAnaHy4tdwT7rxA',
  baseURL: "https://generativelanguage.googleapis.com/v1beta/",
});


// const openai = new OpenAI({
//   apiKey: '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',
//   baseURL: "https://api.groq.com/openai/v1",
// });

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Appel correct avec le client OpenAI + streamText
  const response = await openai.chat.completions.create({
    model: "gemini-2.0-flash", // nom du modèle correct
    messages,
    temperature: 0.7,
    max_tokens: 1000,
  });
  const answer= response.choices[0].message.content;
  console.log("Response:", answer);

  // Utilisation de streamText() avec l’objet retourné
  return new Response(answer);
}
