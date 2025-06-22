'use server';   
import { AssemblyAI, SpeechModel } from "assemblyai";

// Créer une instance du client AssemblyAI avec ta clé API
const client = new AssemblyAI({
  apiKey: "3cd6fa6bd2ca484782fd15453fc8af27",  // Remplace par ta clé API réelle
});

const transcribeWithAssembly = async (audioBlob: Blob) => {
  try {
    // Convertir l'audio en un fichier Blob ou URL
    
    console.log("Audio URL:", audioBlob);

    // Paramètres pour la transcription
    const params = {
      audio: audioBlob,  // L'URL de l'audio à transcrire
      speech_model: "universal" as SpeechModel,  // Cast to the correct type
      language_code: "fr",  // Code de langue pour la transcription
    };

    // Démarre la transcription
    const transcript = await client.transcripts.transcribe(params);

    // Retourne la transcription obtenue
    console.log("Transcription:", transcript.text);
    return transcript.text;

  } catch (error) {
    console.error("Error in transcription:", error);
    return null;
  }
};

export default transcribeWithAssembly