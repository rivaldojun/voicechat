"use server"

import OpenAI from "openai"
import { cmPrompt, csPrompt } from "./utils/prompt";
import { extractJSONFromText, findBestMatchingFormation, FormationMatch, extractUserInfoFromText } from "./utils/fonction";
import {GoogleGenAI} from '@google/genai';
import wav from 'wav';
const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY || "AIzaSyD0phHq4PckAy8vLYlzkAnaHy4tdwT7rxA",
  baseURL: "https://generativelanguage.googleapis.com/v1beta/",
})

type Message = {
  role: "user" | "assistant" | "system"
  content: string
}

type UserInfo = {
  nom: string
  prenom: string
  email: string
  telephone: string
  date_naissance: string
  nationalite: string
}

type AskLLMResponse = {
  response: string
  isFinished: boolean
  formation?: FormationMatch[] | undefined
  tmpKycComplete?:boolean
  userInfo?:UserInfo | undefined
}



const FORMATION_NOT_FOUND= "Je n'ai trouver aucune formation correspondant a vos specification.Voulez vous rediscuter de vos preference?"
const FINAL_RESPONSE_INTRODUCTION=`
  Voici les formations qui correspondent à votre profil et à vos objectifs. 
  Veuillez choisir celle que vous préférez et me le faire savoir afin que nous puissions passer à l\'étape suivante, 
  qui est la candidature. Dites-moi lorsque vous êtes prêt(e) à faire votre choix.
`
export async function askLLM(prompt: string, previousMessages: Message[], isFinished:boolean): Promise<AskLLMResponse> {
  let tmpIsFinished = isFinished
  let tmpKycComplete = false
  let userInfo: UserInfo | undefined = undefined
  const conseillerPrompt = csPrompt
  const commercialPrompt = cmPrompt
  let matchedFormation = undefined
  let finalCriteria = undefined
  const systemMessage: Message = {
    role: "system",
    content: isFinished ? commercialPrompt : conseillerPrompt,
  }
  const messages: Message[] = [systemMessage, ...previousMessages, { role: "user", content: prompt }]
  console.log("Messages sent to LLM:", messages)

  const response = await openai.chat.completions.create({
    model: "gemini-2.0-flash",
    messages: messages,
  })
  const assistantMessage = response.choices[0].message.content ?? ""
  console.log("Assistant response:", assistantMessage)
  if (assistantMessage.includes("[FIN_CONVERSATION]")) {
    finalCriteria = extractJSONFromText(assistantMessage)
    if (finalCriteria) {  
      matchedFormation = await findBestMatchingFormation(finalCriteria)
      if (!matchedFormation || matchedFormation.length === 0) {
        return {response: FORMATION_NOT_FOUND, isFinished: tmpIsFinished}
      }
      tmpIsFinished = true
    }
  }else if(assistantMessage.includes("[FIN_CONVERSATION_2]")) {
    console.log('fin 2', assistantMessage)
    finalCriteria = extractUserInfoFromText(assistantMessage)
    if (finalCriteria) {
      tmpKycComplete = true
      userInfo=finalCriteria
      console.log('userInfo',userInfo)
    }
  }
  let finalResponse = assistantMessage
  if (tmpIsFinished && matchedFormation) {
    finalResponse = FINAL_RESPONSE_INTRODUCTION
  }
  return {response: finalResponse, isFinished: tmpIsFinished, formation: matchedFormation, tmpKycComplete: tmpKycComplete, userInfo: userInfo}
}




async function saveWaveFile(
   filename: string,
   pcmData: Buffer,
   channels = 1,
   rate = 24000,
   sampleWidth = 2,
) {
   return new Promise((resolve, reject) => {
      const writer = new wav.FileWriter(filename, {
            channels,
            sampleRate: rate,
            bitDepth: sampleWidth * 8,
      });

      writer.on('finish', resolve);
      writer.on('error', reject);

      writer.write(pcmData);
      writer.end();
   });
}

export async function generateSpeechWithGemini(text: string): Promise<Blob> {
  const ai = new GoogleGenAI({ apiKey: "AIzaSyD0phHq4PckAy8vLYlzkAnaHy4tdwT7rxA" });
  console.log("Generating speech for text:", text);
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text }] }],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Orus' },
        },
      },
    },
  });

  if (!response.candidates || response.candidates.length === 0) {
    throw new Error('Erreur lors de la génération audio');
  }

  const data = response.candidates[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!data) {
    throw new Error('Audio data is undefined');
  }

  // Convert base64 to Uint8Array (browser-compatible)
  const binaryString = atob(data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const audioBlob = new Blob([bytes], { type: 'audio/wav' });
  
  // Optional: Save file if saveWaveFile function is available
  // try {
  //   const fileName = 'out.wav';
  //   await saveWaveFile(fileName, bytes);
  // } catch (error) {
  //   console.warn('Could not save wave file:', error);
  // }

  return audioBlob;
}
