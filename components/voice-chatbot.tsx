"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, MicOff, Upload, Zap, FileText, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { askLLM } from "@/app/actions"
import { set } from "date-fns"
import { fetchVoiceFromElevenLabs, speakWithBrowserTTS } from "@/app/utils/tts"
import transcribeWithAssembly from "@/app/utils/stt"
// Declare SpeechRecognition
declare var SpeechRecognition: any
declare var webkitSpeechRecognition: any

export default function VoiceChatbot() {
  // State management
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [uploadedDocs, setUploadedDocs] = useState<string[]>([])
  const [showUploader, setShowUploader] = useState(false)
  const [messages, setMessages] = useState<
    {
      role: "user" | "assistant"
      content: string
      wasInterrupted?: boolean
    }[]
  >([])
  const [input, setInput] = useState("")

  // Settings state
  const [autoListen, setAutoListen] = useState(true)
  const [continuousConversation, setContinuousConversation] = useState(true)

  const [voiceSpeed, setVoiceSpeed] = useState(1)
  const [voicePitch, setVoicePitch] = useState(1)
  const [audioUnlocked, setAudioUnlocked] = useState(false)
  const greetingDoneRef = useRef(false)
  const latestTranscriptRef = useRef("")
const handleUnlockAudio = () => {
  const silentAudio = new Audio()
  silentAudio.play().catch(() => {
    // rien à faire, l'important est d'appeler play() sur interaction
  })
  setAudioUnlocked(true)
}


  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastMessageIdRef = useRef<string | null>(null)

  
  // Initialize speech recognition and synthesis
  // useEffect(() => {
  //   if (typeof window === "undefined") return
  
  //   // Initialisation des références et vérification compatibilité navigateur
  //   const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  //   if (SpeechRecognition) {
  //     recognitionRef.current = new SpeechRecognition()
  //     recognitionRef.current.continuous = true
  //     recognitionRef.current.interimResults = true
  //     recognitionRef.current.lang = "fr-FR" // ou "en-US" selon ton besoin
  
  //     // Pour conserver la dernière transcription finale à traiter
      
      
  //     // Gestion des résultats de la reconnaissance
  //     recognitionRef.current.onresult = (event) => {
  //       const current = event.resultIndex
  //       const result = event.results[current]
  //       const transcriptText = result[0].transcript
  
  //       // Réinitialise le timer de silence à chaque mot détecté
  //       if (silenceTimerRef.current) {
  //         clearTimeout(silenceTimerRef.current)
  //       }
  
  //       // Si l'assistant parle, on l'interrompt immédiatement
  //       if (isSpeaking) {
  //         console.log("User interrupted! Stopping assistant speech immediately")
  //         stopSpeaking()
  //       }
  
  //       // MàJ du transcript (accumulation ou remplacement selon ton besoin)
  //       setTranscript(transcriptText)
  //       latestTranscriptRef.current = transcriptText
  
  //       // Détection du silence (pour conversation continue)
  //       if (continuousConversation) {
  //         silenceTimerRef.current = setTimeout(() => {
  //           const toProcess = latestTranscriptRef.current.trim()
  //           if (toProcess !== "") {
  //             console.log("Silence detected, processing:", toProcess)
  //             processTranscript(toProcess)
  //           }
  //         }, silenceThreshold)
  //       }
  
  //       // Transcription finale
  //       if (result.isFinal) {
  //         console.log("Final transcription:", transcriptText)
  //         setInput(transcriptText)
  
  //         if (!continuousConversation) {
  //           processTranscript(transcriptText)
  //         }
  //       }
  //     }
  
  //     // Gestion des erreurs
  //     recognitionRef.current.onerror = (event) => {
  //       console.error("Speech recognition error:", event.error)
  //       setIsListening(false)
  
  //       // Redémarre si nécessaire (autoListen)
  //       if (autoListen && event.error !== "aborted" && event.error !== "not-allowed") {
  //         setTimeout(() => {
  //           startListening()
  //         }, 1000)
  //       }
  
  //       if (event.error === "not-allowed") {
  //         alert("L'accès au microphone a été refusé. Vérifie tes paramètres de sécurité ou navigateur.")
  //       }
  //     }
  
  //     // Fin inattendue : redémarrage si activé
  //     recognitionRef.current.onend = () => {
  //       if (silenceTimerRef.current) {
  //         clearTimeout(silenceTimerRef.current)
  //       }
  
  //       if (autoListen && isListening) {
  //         console.log("Recognition ended, restarting...")
  //         startListening()
  //       }
  //     }
  //   }
  
  //   // Initialisation de la synthèse vocale
  //   if ("speechSynthesis" in window) {
  //     synthRef.current = window.speechSynthesis
  //   }
  
  //   // Nettoyage à la destruction du composant
  //   return () => {
  //     if (recognitionRef.current) {
  //       recognitionRef.current.stop()
  //     }
  //     if (synthRef.current) {
  //       synthRef.current.cancel()
  //     }
  //     if (silenceTimerRef.current) {
  //       clearTimeout(silenceTimerRef.current)
  //     }
  //   }
  // }, [autoListen, continuousConversation, silenceThreshold, isSpeaking])
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
const audioChunksRef = useRef<Blob[]>([])
const audioContextRef = useRef<AudioContext | null>(null)
const analyserRef = useRef<AnalyserNode | null>(null)
// Renommage ici pour éviter le conflit
const silenceDetectionTimerRef = useRef<NodeJS.Timeout | null>(null)
const animationFrameRef = useRef<number | null>(null)
const mediaRecorderRef = useRef<MediaRecorder | null>(null)
const hasSpokenRef = useRef(false) // 🆕 Ajoute ceci


const silenceThreshold = 15 // volume threshold (tweak if needed)
const silenceDelay = 2000 // 2 seconds of silence

const startRecording = async () => {
  setIsListening(true)
  hasSpokenRef.current = false
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const recorder = new MediaRecorder(stream)
  mediaRecorderRef.current = recorder

  audioChunksRef.current = []

  recorder.ondataavailable = (e) => {
    audioChunksRef.current.push(e.data)
  }

recorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const output = await transcribeWithAssembly(audioBlob);
      console.log("Transcription:", output);
      processTranscript(output);
      setIsListening(false)
      console.log("Audio URL:", audioUrl);
      audioChunksRef.current = [];
    };

  recorder.start()
  console.log("Recording started")

  // --- Start silence detection
  const audioContext = new AudioContext()
  audioContextRef.current = audioContext
  const analyser = audioContext.createAnalyser()
  analyser.fftSize = 2048
  analyserRef.current = analyser

  const source = audioContext.createMediaStreamSource(stream)
  source.connect(analyser)

  const dataArray = new Uint8Array(analyser.fftSize)

  const detectSilence = () => {
    analyser.getByteTimeDomainData(dataArray)
    const volume = dataArray.reduce((acc, val) => acc + Math.abs(val - 128), 0) / dataArray.length
  
    if (volume >= silenceThreshold) {
      hasSpokenRef.current = true // ✅ Marquer que l'utilisateur a parlé
      if (silenceDetectionTimerRef.current) {
        clearTimeout(silenceDetectionTimerRef.current)
        silenceDetectionTimerRef.current = null
      }
    } else {
      if (hasSpokenRef.current && !silenceDetectionTimerRef.current) {
        silenceDetectionTimerRef.current = setTimeout(() => {
          console.log("Silence detected after speaking, auto-stopping recording...")
          stopRecording()
        }, silenceDelay)
      }
    }
  
    if (recorder.state === "recording") {
      animationFrameRef.current = requestAnimationFrame(detectSilence)
    }
  }
  

  detectSilence()
}

const stopSilenceDetection = () => {
  if (animationFrameRef.current) {
    cancelAnimationFrame(animationFrameRef.current)
    animationFrameRef.current = null
  }
  if (silenceDetectionTimerRef.current) {
    clearTimeout(silenceDetectionTimerRef.current)
    silenceDetectionTimerRef.current = null
  }
  if (audioContextRef.current) {
    audioContextRef.current.close()
    audioContextRef.current = null
  }
  analyserRef.current = null
}

const stopRecording = () => {
  const recorder = mediaRecorderRef.current
  if (recorder && recorder.state === "recording") {
    recorder.stop()
    stopSilenceDetection()
    console.log("Recording stopped")
  } else {
    console.warn("MediaRecorder is not recording.")
  }
}



  
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Process transcript and get AI response
  const processTranscript = async (text: string) => {
    if (!text.trim()) {
      return
    }else{
      setIsListening(false)

    // Stop listening while processing
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      // setIsListening(false)
    }

    // Add user message
    const userMessage = { role: "user" as const, content: text }
    setMessages((prev) => [...prev, userMessage])

    // Clear input and transcript
    setInput("")
    setTranscript("")

    // Show loading state
    setIsLoading(true)

    try {
      // Call server action to get AI response
      const aiResponse = await askLLM(text)

      // Add AI response to messages
      const assistantMessage = { role: "assistant" as const, content: aiResponse }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error getting AI response:", error)
      // Add error message
      const errorMessage = {
        role: "assistant" as const,
        content: "Sorry, I couldn't process your request. Please try again.",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      // startListening()
    }
  }
  }

  // Stop speaking function - arrête IMMÉDIATEMENT la synthèse vocale
  const stopSpeaking = () => {
    if (mediaRecorderRef.current) {
      setIsSpeaking(false)

      // Marquer le dernier message comme interrompu
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages]
        // Trouver le dernier message de l'assistant
        for (let i = updatedMessages.length - 1; i >= 0; i--) {
          if (updatedMessages[i].role === "assistant") {
            // Marquer comme interrompu si ce n'est pas déjà fait
            if (!updatedMessages[i].content.includes("Message interrompu")) {
              updatedMessages[i] = {
                ...updatedMessages[i],
                wasInterrupted: true,
              }
            }
            break
          }
        }
        return updatedMessages
      })

      // Commencer à écouter immédiatement après l'interruption
      startListening()
    }
    
  }

  // Start listening function
  const startListening = () => {
    handleUnlockAudio()
    const speakWithElevenLabs = async (text: string) => {
      try {
        setIsSpeaking(true)
        const audioBlob = await fetchVoiceFromElevenLabs(text)
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
  
        audio.onended = () => {
          setIsSpeaking(false)
          if (autoListen) {
            setTimeout(startListening, 300)
          }
        }
  
        audio.play()
      } catch (error) {
        console.error("Erreur TTS ElevenLabs:", error)
        try {
          await speakWithBrowserTTS(text); // attendre la fin du TTS natif
        } catch (err) {
          console.error("Erreur TTS navigateur :", err);
        }
        // setIsSpeaking(false)
        // if (autoListen) {
        //   setTimeout(startListening, 300)
        // }

      }
    }
  
    // // Stop speaking if needed
    // if (isSpeaking) {
    //   stopSpeaking()
    // }

    
    // Greeting if messages are empty and not already done
    if (messages.length === 0 && !greetingDoneRef.current) {
      const greeting = "Bonjour ! Je suis votre assistant IA"
      //const greeting = "Bonjour ! Je suis votre assistant IA, et je suis ici pour vous aider à trouver la formation idéale. Dites-moi quel domaine vous intéresse, ou si vous avez des critères spécifiques, je pourrai vous orienter vers des options adaptées. 😊"
      greetingDoneRef.current = true // éviter les répétitions
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: greeting
      }])
      speakWithElevenLabs(greeting)
    }   
    else {
      try {
        startRecording()
        // setIsListening(true)
        setTranscript("")
      } catch (error) {
        console.error("Error starting recognition:", error)
      }
    }
  }
  

  // Stop listening function
  const stopListening = () => {
    if (mediaRecorderRef.current) {
      stopRecording()
      setIsListening(false)
      

      // Process final transcript if available
      // if (transcript.trim()) {
      //   processTranscript(transcript)
      // }else{
      //   alert("Aucun texte détecté. Veuillez réessayer.")
      //   startRecording()
      // }
    }
  }

  // Toggle speech recognition
  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  // Speak the AI response
  useEffect(() => {
    const speakWithElevenLabs = async (text: string) => {
      try {
        const audioBlob = await fetchVoiceFromElevenLabs(text)
        console.log("Audio blob received:", audioBlob)
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
  
        audio.onended = () => {
          setIsSpeaking(false)
          if (autoListen) {
            setTimeout(startListening, 300)
          }
        }
  
        audio.play()
      } catch (error) {
        console.error("Erreur TTS ElevenLabs:", error)
        setIsSpeaking(false)
      }
    }
  
    if (
      messages.length > 0 &&
      messages[messages.length - 1].role === "assistant" &&
      !isSpeaking &&
      !isListening
    ) {
      const lastMessage = messages[messages.length - 1].content
      const messageId = lastMessage.substring(0, 50)
  
      if (lastMessageIdRef.current !== messageId) {
        lastMessageIdRef.current = messageId
        speakWithElevenLabs(lastMessage)
      }
    }
  }, [messages, isSpeaking, isListening])
  

  // Handle document upload
  const handleDocumentUpload = (docNames: string[]) => {
    setUploadedDocs([...uploadedDocs, ...docNames])
    setShowUploader(false)

    // Notify the user about successful upload
    const uploadMessage = `I've uploaded ${docNames.join(", ")}. You can now ask me questions about these documents.`
    processTranscript(uploadMessage)
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <Card className="w-full max-w-3xl bg-black/50 border border-blue-500/30 backdrop-blur-lg rounded-xl overflow-hidden shadow-[0_0_15px_rgba(149,76,233,0.5)]">
        <div className="p-6 flex flex-col h-[80vh]">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-center flex items-center gap-2">
              <Zap className="h-6 w-6 text-blue-400" />
              Voice AI Assistant
            </h1>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Settings className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-gray-900 text-white border-blue-500/30">
                <SheetHeader>
                  <SheetTitle className="text-white">Assistant Settings</SheetTitle>
                  <SheetDescription className="text-gray-400">Customize how the voice assistant works</SheetDescription>
                </SheetHeader>

                <div className="space-y-6 mt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="auto-listen">Auto Listen</Label>
                      <p className="text-sm text-gray-400">Automatically listen after responses</p>
                    </div>
                    <Switch id="auto-listen" checked={autoListen} onCheckedChange={setAutoListen} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="continuous-conversation">Continuous Conversation</Label>
                      <p className="text-sm text-gray-400">Process speech after silence detection</p>
                    </div>
                    <Switch
                      id="continuous-conversation"
                      checked={continuousConversation}
                      onCheckedChange={setContinuousConversation}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Silence Threshold ({silenceThreshold}ms)</Label>
                    <Slider
                      value={[silenceThreshold]}
                      min={500}
                      max={5000}
                      step={100}
                      onValueChange={(value) => setSilenceThreshold(value[0])}
                    />
                    <p className="text-sm text-gray-400">How long to wait after speech before processing</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Voice Speed ({voiceSpeed.toFixed(1)}x)</Label>
                    <Slider
                      value={[voiceSpeed]}
                      min={0.5}
                      max={2}
                      step={0.1}
                      onValueChange={(value) => setVoiceSpeed(value[0])}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Voice Pitch ({voicePitch.toFixed(1)})</Label>
                    <Slider
                      value={[voicePitch]}
                      min={0.5}
                      max={2}
                      step={0.1}
                      onValueChange={(value) => setVoicePitch(value[0])}
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex-grow flex flex-col overflow-hidden relative">
            {/* Status indicators */}
            <div className="absolute top-0 left-0 right-0 flex justify-center gap-2 p-2 z-10">
              {isListening && (
                <span className="text-xs bg-red-500/70 px-2 py-1 rounded-full flex items-center gap-1 animate-pulse">
                  <Mic className="h-3 w-3" /> Listening
                </span>
              )}
              {isSpeaking && (
                <span className="text-xs bg-green-500/70 px-2 py-1 rounded-full flex items-center gap-1">
                  <Zap className="h-3 w-3" /> Speaking
                </span>
              )}
              {isLoading && (
                <span className="text-xs bg-blue-500/70 px-2 py-1 rounded-full flex items-center gap-1">
                  <span className="h-2 w-2 bg-white rounded-full animate-ping mr-1"></span> Thinking
                </span>
              )}
            </div>

            {/* Uploaded documents */}
            {uploadedDocs.length > 0 && (
              <div className="bg-blue-900/20 backdrop-blur-sm rounded-lg mb-4 p-3">
                <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4" />
                  Uploaded Documents
                </h3>
                <div className="flex flex-wrap gap-2">
                  {uploadedDocs.map((doc, index) => (
                    <span key={index} className="text-xs bg-blue-800/50 px-2 py-1 rounded-full">
                      {doc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Document uploader */}
            {showUploader ? (
              <div className="flex-grow flex items-center justify-center">
                <DocumentUploader onUpload={handleDocumentUpload} onCancel={() => setShowUploader(false)} />
              </div>
            ) : (
              <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-transparent pr-2">
                {/* Welcome message when no messages */}
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center p-4">
                    <div className="max-w-md space-y-4">
                      <h2 className="text-xl font-semibold text-blue-300">Welcome to Voice Assistant</h2>
                      <p className="text-gray-400">
                        {isListening
                          ? "I'm listening. Just start speaking naturally..."
                          : "Click the microphone button or say 'Hey Assistant' to start a conversation."}
                      </p>
                      {transcript && (
                        <div className="mt-4 p-3 bg-blue-900/30 rounded-lg">
                          <p className="text-sm text-gray-300">{transcript}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Conversation messages */
                  <div className="space-y-6 py-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex gap-3 max-w-[85%] animate-fadeIn",
                          message.role === "user" ? "ml-auto" : "mr-auto",
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-2xl p-4",
                            message.role === "user"
                              ? "bg-blue-600 text-white rounded-tr-none"
                              : "bg-gray-800 text-gray-100 rounded-tl-none",
                            message.wasInterrupted && "border-l-4 border-amber-500",
                          )}
                        >
                          {message.content}
                          {message.wasInterrupted && (
                            <div className="text-xs text-amber-400 mt-1">Message interrompu</div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Current transcript bubble */}
                    {isListening && transcript && (
                      <div className="flex gap-3 max-w-[85%] ml-auto">
                        <div className="rounded-2xl p-4 bg-blue-600/70 text-white rounded-tr-none animate-pulse">
                          {transcript}
                        </div>
                      </div>
                    )}

                    {/* Auto-scroll anchor */}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Control buttons */}
          <div className="flex justify-center gap-4 mt-6">
            <Button
              onClick={() => setShowUploader(true)}
              className={cn(
                "rounded-full h-14 w-14 p-0 bg-indigo-600 hover:bg-indigo-700",
                showUploader && "bg-gray-700 hover:bg-gray-600",
              )}
              disabled={isLoading}
            >
              <Upload className="h-6 w-6" />
            </Button>

            <Button
              onClick={toggleListening}
              className={cn(
                "rounded-full h-14 w-14 p-0",
                isListening ? "bg-red-600 hover:bg-red-700 animate-pulse" : "bg-blue-600 hover:bg-blue-700",
              )}
              disabled={isLoading || showUploader}
            >
              {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
            {/* {!audioUnlocked && (
            // <div className="absolute inset-0 flex items-center justify-center bg-white z-50">
            //     <button
            //     onClick={handleUnlockAudio}
            //     className="px-6 py-3 bg-blue-500 text-white rounded-xl shadow-md"
            //     >
            //     👉 Activer la voix
            //     </button>
            // </div>
            )} */}

          </div>
        </div>
      </Card>
    </div>
  )
}

// Placeholder component for document uploader
function DocumentUploader({ onUpload, onCancel }) {
  const [dragging, setDragging] = useState(false)
  const [files, setFiles] = useState<File[]>([])

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = () => {
    setDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileList = Array.from(e.dataTransfer.files)
      setFiles(fileList)
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files)
      setFiles(fileList)
    }
  }

  const handleUpload = () => {
    if (files.length > 0) {
      // In a real implementation, you would upload the files to a server
      // For now, we'll just pass the file names to the parent component
      onUpload(files.map((file) => file.name))
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          dragging ? "border-blue-500 bg-blue-500/10" : "border-gray-600",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="h-10 w-10 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium mb-2">Upload Documents</h3>
        <p className="text-sm text-gray-400 mb-4">Drag and drop files here, or click to select files</p>

        <input type="file" id="file-upload" className="hidden" multiple onChange={handleFileChange} />
        <label
          htmlFor="file-upload"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md cursor-pointer inline-block"
        >
          Select Files
        </label>
      </div>

      {files.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Selected Files:</h4>
          <ul className="space-y-1 mb-4">
            {files.map((file, index) => (
              <li key={index} className="text-sm bg-gray-800 p-2 rounded flex justify-between">
                <span className="truncate">{file.name}</span>
                <span className="text-gray-400 text-xs">{(file.size / 1024).toFixed(1)} KB</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleUpload} disabled={files.length === 0}>
          Upload
        </Button>
      </div>
    </div>
  )
}

// Add this to your globals.css
const styles = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: rgba(139, 92, 246, 0.5);
  border-radius: 20px;
}
`
