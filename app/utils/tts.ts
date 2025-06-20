// utils/tts.ts
export async function fetchVoiceFromElevenLabs(text: string): Promise<Blob> {
    const voiceId = "JBFqnCBsd6RMkjVDRZzb"; // par défaut, "Rachel"
    // const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY!;
    
  
    // const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    //   method: "POST",
    //   headers: {
    //     "xi-api-key": 'sk_822a8a9cf838ffda897e5114f1dd72124cf3ab2ebd6e0cd2',
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     text,
    //     model_id: "eleven_flash_v2_5",
    //     voice_settings: {
    //       stability: 0.4,
    //       similarity_boost: 0.8,
    //     },
    //   }),
    // });

    const response = await fetch("https://api.groq.com/openai/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": "Bearer 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",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "playai-tts",
        input: text,
        voice: "Fritz-PlayAI", // ou d'autres voix disponibles
        response_format: "wav" // ou "mp3"
      }),
    });
  
    if (!response.ok) throw new Error("Failed to fetch TTS audio from ElevenLabs");
  
    const audioBlob = await response.blob();
    return audioBlob;
  }

  export function speakWithBrowserTTS(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US"; // ou "fr-FR"
  
        utterance.onend = () => {
          console.log("Speech terminé.");
          resolve();
        };
  
        utterance.onerror = (event) => {
          console.error("Erreur TTS navigateur :", event.error);
          reject(event.error);
        };
  
        speechSynthesis.speak(utterance);
      } else {
        console.warn("Le TTS natif du navigateur n'est pas disponible.");
        reject(new Error("SpeechSynthesis non disponible"));
      }
    });
  }
  

//   import { ElevenLabsClient } from "elevenlabs";

//   const client = new ElevenLabsClient({
//     apiKey: 'sk_4b35a6da1f9738e69a5eaad2d3aeb9751273cdd649ce2189', // expose cette clé dans ton .env si utilisé côté client (ou côté serveur pour plus de sécurité)
//   });
  
//   export async function fetchVoiceFromElevenLabs(text: string): Promise<Blob> {
//     const voiceId = "JBFqnCBsd6RMkjVDRZzb"; // Ex: Chloé (Français)
//     const audioBuffer = await client.textToSpeech.convert(voiceId, {
//       text,
//       model_id: "eleven_flash_v2_5",
//       output_format: "mp3_44100_128",
//       voice_settings: {
//         stability: 0.4,
//         similarity_boost: 0.8,
//       },
//     });
  
//     return new Blob([audioBuffer], { type: "audio/mpeg" });
//   }
  