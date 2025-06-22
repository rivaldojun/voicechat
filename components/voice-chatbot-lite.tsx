"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Mic, MicOff, Settings, Upload, FileText, Zap, X, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { askLLM } from "@/app/actions"
import ReactMarkdown from 'react-markdown'
import FormationModal from '@/components/formationModal'
import UserInfoModal from "./userInfoModal"
import { generateSpeechWithGemini } from "@/app/actions"

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

declare var SpeechRecognition: any;
declare var webkitSpeechRecognition: any;

type FormationMatch = {
  id: string
  titre: string
  description: string
  categorie: string
  niveau: string
  duree: string
  prix: string
  score: number
  partner: boolean
  metadata: Record<string, any>
}

type UserInfo = {
  nom: string
  prenom: string
  email: string
  telephone: string
  date_naissance: string
  nationalite: string
}

type Message = {
  role: "user" | "assistant"
  content: string
  wasInterrupted?: boolean
}



export default function VoiceChatbot() {
  // Core state
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [matchFormation, setMatchFormation] = useState<FormationMatch[]>([])
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  
  // UI state
  const [showMessages, setShowMessages] = useState(false)
  const [showUploader, setShowUploader] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showModalUserInfo, setShowModalUserInfo] = useState(false)
  const [audioUnlocked, setAudioUnlocked] = useState(false)
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([])
  
  // Settings
  const [autoListen, setAutoListen] = useState(true)
  const [continuousConversation, setContinuousConversation] = useState(true)
  const [silenceThreshold, setSilenceThreshold] = useState(2000)
  const [voiceSpeed, setVoiceSpeed] = useState(1)
  const [voicePitch, setVoicePitch] = useState(1)
  
  // Refs
  const recognitionRef = useRef<typeof SpeechRecognition | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const messagesRef = useRef<Message[]>([])
  const isFinished = useRef(false)
  const commercial = useRef(false)
  const greetingDone = useRef(false)
  const lastMessageId = useRef<string | null>(null)

  const handleUnlockAudio = () => {
    const silentAudio = new Audio()
    silentAudio.play().catch(() => {
      // rien à faire, l'important est d'appeler play() sur interaction
    })
    setAudioUnlocked(true)
  }

  // Initialize speech APIs
  useEffect(() => {
    if (typeof window === "undefined") return

    // Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      Object.assign(recognitionRef.current, {
        continuous: true,
        interimResults: true,
        onresult: handleSpeechResult,
        onerror: () => setIsListening(false),
        onend: () => silenceTimerRef.current && clearTimeout(silenceTimerRef.current)
      })
    }
    audioRef.current = new Audio()

    // Speech Synthesis
    if (window.speechSynthesis) {
      synthRef.current = window.speechSynthesis
    }

    return () => {
      recognitionRef.current?.stop()
      synthRef.current?.cancel()
      silenceTimerRef.current && clearTimeout(silenceTimerRef.current)
    }
  }, [])

  // Handle speech recognition results
  const handleSpeechResult = useCallback((event: any) => {
    const result = event.results[event.resultIndex]
    const transcriptText = result[0].transcript

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    
    if (isSpeaking) stopSpeaking()
    
    setTranscript(transcriptText)

    if (continuousConversation) {
      silenceTimerRef.current = setTimeout(() => {
        if (transcriptText.trim()) processTranscript(transcriptText)
      }, silenceThreshold)
    }

    if (result.isFinal && !continuousConversation) {
      processTranscript(transcriptText)
    }
  }, [isSpeaking, continuousConversation, silenceThreshold])

  // Process transcript and get AI response
  const processTranscript = async (text: string) => {
    if (!text.trim()) return

    recognitionRef.current?.stop()
    setIsListening(false)
    setIsLoading(true)

    const userMessage: Message = { role: "user", content: text }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    messagesRef.current = [...messagesRef.current, userMessage]

    try {
      const response = await askLLM(text, messagesRef.current, commercial.current)
      const { response: aiResponse, isFinished: finished, formation, tmpKycComplete, userInfo: responseUserInfo } = response

      isFinished.current = finished
      
      if (finished && !commercial.current) {
        commercial.current = true
        setMatchFormation(formation || [])
        setShowModal(true)
      }

      if (tmpKycComplete) {
        setUserInfo(responseUserInfo || null)
        setShowModalUserInfo(true)
      }

      console.log("AI Response:", aiResponse.toString())
      if(!tmpKycComplete){
        const assistantMessage: Message = { role: "assistant", content: aiResponse.toString() }
        const finalMessages = [...newMessages, assistantMessage]
        setMessages(finalMessages)
        messagesRef.current = [...messagesRef.current, assistantMessage]
        console.log("Updated messages:", finalMessages)
      }
      
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: Message = {
        role: "assistant",
        content: "Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer."
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setTranscript("")
    }
  }

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsSpeaking(false)
      setMessages(prev => prev.map((msg, i) => 
        i === prev.length - 1 && msg.role === "assistant" && !msg.content.includes("Message interrompu")
          ? { ...msg, wasInterrupted: true }
          : msg
      ))
    }
  }, [])

  // Start/stop listening
  const toggleListening = useCallback(() => {
    handleUnlockAudio()
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      if (transcript.trim()) processTranscript(transcript)
    } else {
      // Greeting on first interaction
      if (messages.length ===0  && !greetingDone.current) {
        const greeting = "Bonjour ! Je suis votre assistant IA. Je suis ici pour vous aider à trouver la formation idéale. Dites-moi quel domaine vous intéresse?"
        greetingDone.current = true
        const greetingMessage: Message = { role: "assistant", content: greeting }
        setMessages([greetingMessage])
        messagesRef.current = [...messagesRef.current, greetingMessage]
        
        
      } else {
        startListening()
      }
    }
  }, [isListening, transcript, messages.length, voiceSpeed, voicePitch, autoListen])

  const startListening = () => {
    if (isSpeaking || !recognitionRef.current || isListening) return
    try {
      recognitionRef.current.start()
      setIsListening(true)
      setTranscript("")
    } catch (error) {
      console.error("Error starting recognition:", error)
    }
  }

  const playGeminiAudio = async (text: string) => {
    try {
      // setIsSpeaking(true)
      // console.log("Generating audio for:", text)
      // const audioBlob = await generateSpeechWithGemini(text)
      // console.log("Audio Blob generated:", audioBlob)
      // const audioUrl = URL.createObjectURL(audioBlob)
      // console.log("Generated audio URL:", audioUrl)
      
      // if (audioRef.current) {
      //   audioRef.current.src = audioUrl
        
      //   audioRef.current.onended = () => {
      //     setIsSpeaking(false)
      //     URL.revokeObjectURL(audioUrl)
      //     if (autoListen && !showModal && !showModalUserInfo) {
      //       setTimeout(startListening, 300)
      //     }
      //   }
        
      //   audioRef.current.onerror = () => {
      //     setIsSpeaking(false)
      //     URL.revokeObjectURL(audioUrl)
      //     console.error('Erreur lors de la lecture audio')
      //   }
        
      //   await audioRef.current.play()
      
      setIsSpeaking(false)
      // Fallback vers Web Speech API si Gemini échoue
      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = voiceSpeed
        utterance.pitch = voicePitch
        utterance.onend = () => {
          setIsSpeaking(false)
          if (autoListen && !showModal && !showModalUserInfo) {
            setTimeout(startListening, 300)
          }
        }
        window.speechSynthesis.speak(utterance)
      }
      }
     catch (error) {
      console.error('Erreur TTS Gemini:', error)
      setIsSpeaking(false)
      // Fallback vers Web Speech API si Gemini échoue
      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = voiceSpeed
        utterance.pitch = voicePitch
        utterance.onend = () => {
          setIsSpeaking(false)
          if (autoListen && !showModal && !showModalUserInfo) {
            setTimeout(startListening, 300)
          }
        }
        window.speechSynthesis.speak(utterance)
      }
    }
  }

  // Auto-speak assistant responses
  useEffect(() => {
    if (messages.length < 1 || messages[messages.length - 1].role !== "assistant") return
    
    const lastMessage = messages[messages.length - 1].content
    const messageId = lastMessage.substring(0, 50)
    
    if (lastMessageId.current === messageId || !synthRef.current) return
    
    lastMessageId.current = messageId
    if (isListening) recognitionRef.current?.stop()

    playGeminiAudio(lastMessage)
    
    // setIsSpeaking(true)
    // const utterance = new SpeechSynthesisUtterance(lastMessage)
    // utterance.rate = voiceSpeed
    // utterance.pitch = voicePitch
    // utterance.onend = () => {
    //   setIsSpeaking(false)
    //   if (autoListen && !showModal && !showModalUserInfo) {
    //     setTimeout(startListening, 300)
    //   }
    // }
    // synthRef.current.speak(utterance)
  }, [messages, voiceSpeed, voicePitch, autoListen, showModal, showModalUserInfo])

  // Stop listening when AI speaks
  useEffect(() => {
    if (isSpeaking && isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    }
  }, [isSpeaking, isListening])

  // Document upload handler
  const handleDocumentUpload = (files: File[]) => {
    const docNames = files.map(f => f.name)
    setUploadedDocs(prev => [...prev, ...docNames])
    setShowUploader(false)
  }

  // Formation submission handler
  const handleFormationSubmit = async (selectedFormations: FormationMatch[]) => {
    setShowModal(false)
    isFinished.current = false
    const response = await askLLM("Je souhaite m'inscrire à ces formations. On peut continuer", messagesRef.current, commercial.current)
    const assistantMessage: Message = { role: "assistant", content: response.response.toString() }
    const finalMessages = [...messages, assistantMessage]
    setMessages(finalMessages)
    messagesRef.current = [...messagesRef.current, assistantMessage]
  }

  const StatusBadge = ({ condition, icon: Icon, text, color }: any) => 
    condition ? (
      <span className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 ${color}`}>
        <Icon className="h-3 w-3" /> {text}
      </span>
    ) : null

  const ActionButton = ({ onClick, disabled, variant, children, className = "" }: any) => (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn("rounded-full h-12 w-12 p-0 transition-all duration-200", className)}
      variant={variant}
    >
      {children}
    </Button>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header Controls */}
      <div className="absolute top-6 w-full px-6 flex justify-between items-center z-10">
        <div className="flex gap-2">
          {uploadedDocs.length > 0 && (
            <Button onClick={() => setShowUploader(true)} variant="ghost" size="icon" className="rounded-full glass-effect">
              <Upload className="h-5 w-5" />
            </Button>
          )}
          {messages.length > 0 && (
            <Button onClick={() => setShowMessages(!showMessages)} variant="ghost" size="sm" className="rounded-full glass-effect">
              <MessageCircle className="h-4 w-4 mr-2" />
              {showMessages ? "Masquer" : "Conversation"}
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <StatusBadge condition={isListening} icon={Mic} text="Écoute" color="bg-red-100 text-red-700 animate-pulse" />
          <StatusBadge condition={isSpeaking} icon={Zap} text="Parle" color="bg-green-100 text-green-700" />
          <StatusBadge condition={isLoading} icon={() => <div className="h-2 w-2 bg-blue-600 rounded-full animate-ping" />} text="Réfléchit" color="bg-blue-100 text-blue-700" />
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full glass-effect">
              <Settings className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent className="glass-effect border-0">
            <SheetHeader>
              <SheetTitle>Paramètres</SheetTitle>
              <SheetDescription>Personnalisez votre assistant vocal</SheetDescription>
            </SheetHeader>
            <div className="space-y-6 mt-6">
              {[
                { id: "auto-listen", label: "Écoute automatique", desc: "Écouter automatiquement après les réponses", checked: autoListen, onChange: setAutoListen },
                { id: "continuous", label: "Conversation continue", desc: "Traiter la parole après détection de silence", checked: continuousConversation, onChange: setContinuousConversation }
              ].map(setting => (
                <div key={setting.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor={setting.id}>{setting.label}</Label>
                    <p className="text-sm text-gray-500">{setting.desc}</p>
                  </div>
                  <Switch id={setting.id} checked={setting.checked} onCheckedChange={setting.onChange} />
                </div>
              ))}
              
              {[
                { label: "Seuil de silence", value: silenceThreshold, min: 500, max: 5000, step: 100, onChange: setSilenceThreshold, unit: "ms" },
                { label: "Vitesse de la voix", value: voiceSpeed, min: 0.5, max: 2, step: 0.1, onChange: setVoiceSpeed, unit: "x" },
                { label: "Ton de la voix", value: voicePitch, min: 0.5, max: 2, step: 0.1, onChange: setVoicePitch, unit: "" }
              ].map(slider => (
                <div key={slider.label} className="space-y-2">
                  <Label>{slider.label} ({slider.value.toFixed(1)}{slider.unit})</Label>
                  <Slider
                    value={[slider.value]}
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    onValueChange={(value) => slider.onChange(value[0])}
                  />
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Uploaded docs indicator */}
      {uploadedDocs.length > 0 && (
        <div className="absolute top-32 left-1/2 transform -translate-x-1/2 glass-effect rounded-lg px-4 py-2">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            {uploadedDocs.length} document{uploadedDocs.length > 1 ? "s" : ""} uploadé{uploadedDocs.length > 1 ? "s" : ""}
          </div>
        </div>
      )}

      {/* Main interface */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div
          className={cn(
            "w-40 h-40 bg-gradient-to-br from-gray-900 to-gray-900 rounded-full transition-all duration-1000 ease-in-out shadow-2xl relative",
            isSpeaking && "animate-pulse scale-125 shadow-blue-500/50",
            isListening && "ring-4 ring-blue-300 ring-opacity-50 shadow-red-500/50",
            isLoading && "animate-spin"
          )}
        >
          <div className="absolute inset-4 bg-black rounded-full opacity-80"></div>
        </div>
      </div>

      {/* Status text */}
      <div className="text-center mb-8 max-w-md relative z-10">
        <p className="text-gray-600 text-lg font-medium mb-4">
          {messages.length === 0 
            ? "Commencez une nouvelle conversation"
            : isListening ? "J'écoute..." 
            : isSpeaking ? "Je parle..." 
            : isLoading ? "Je réfléchis..." 
            : "Prêt à discuter"
          }
        </p>

        {isListening && transcript && (
          <div className="mt-4 p-4 glass-effect rounded-lg backdrop-blur-sm">
            <p className="text-sm text-gray-700 italic">"{transcript}"</p>
          </div>
        )}
      </div>

      {/* Control buttons */}
      <div className="flex gap-6 mb-8 relative z-10">
        <ActionButton
          onClick={toggleListening}
          disabled={isLoading || showUploader || isSpeaking}
          className={isListening 
            ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30" 
            : "glass-effect hover:bg-gray-300 text-gray-700 shadow-lg"
          }
        >
          {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </ActionButton>

        <ActionButton
          onClick={() => {
            setMessages([])
            messagesRef.current = []
            setTranscript("")
            setIsListening(false)
            greetingDone.current = false
            isFinished.current = false
            commercial.current = false
          }}
          disabled={isLoading || showUploader}
          className="glass-effect hover:bg-gray-300 text-gray-700 shadow-lg"
        >
          <X className="h-6 w-6" />
        </ActionButton>
      </div>

      {/* Formation button */}
      {isFinished.current && (
        <Button
          onClick={() => setShowModal(true)}
          className="rounded-full px-8 py-4 bg-black text-white transition-all duration-300 shadow-lg shadow-blue-500/30 transform hover:scale-105"
        >
          Voir les formations recommandées
        </Button>
      )}

      {/* Overlays */}
      {showUploader && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4 glass-effect border-0">
            <DocumentUploader onUpload={handleDocumentUpload} onCancel={() => setShowUploader(false)} />
          </Card>
        </div>
      )}

      {showMessages && messages.length > 0 && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <Card className="w-full max-w-2xl h-[70vh] flex flex-col glass-effect border-0">
            <div className="p-4 border-b border-white/20 flex justify-between items-center">
              <h3 className="font-semibold">Conversation</h3>
              <Button onClick={() => setShowMessages(false)} variant="ghost" size="icon" className="rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn("flex gap-3 max-w-[85%]", message.role === "user" ? "ml-auto" : "mr-auto")}
                >
                  <div
                    className={cn(
                      "rounded-2xl p-4 text-sm shadow-lg",
                      message.role === "user"
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-tr-none"
                        : "glass-effect text-gray-900 rounded-tl-none",
                      message.wasInterrupted && "border-l-4 border-amber-500"
                    )}
                  >
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                    {message.wasInterrupted && <div className="text-xs text-amber-600 mt-1">Message interrompu</div>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Modals */}
      <FormationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        formations={matchFormation}
        onSubmit={handleFormationSubmit}
      />

      <UserInfoModal
        isOpen={showModalUserInfo}
        onClose={() => setShowModalUserInfo(false)}
        userInfo={userInfo || { nom: "", prenom: "", email: "", telephone: "", date_naissance: "", nationalite: "" }}
        onSubmit={() => console.log('User info submitted')}
      />

      <style jsx>{`
        .glass-effect {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }
      `}</style>
    </div>
  )
}

// Optimized Document Uploader
function DocumentUploader({ onUpload, onCancel }: { onUpload: (files: File[]) => void; onCancel: () => void }) {
  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)

  const handleFiles = (fileList: FileList | null) => {
    if (fileList && fileList.length > 0) {
      setFiles(Array.from(fileList))
    }
  }

  const dragHandlers = {
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setDragging(true) },
    onDragLeave: () => setDragging(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      handleFiles(e.dataTransfer.files)
    }
  }

  return (
    <div className="w-full">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300",
          dragging ? "border-blue-500 bg-blue-500/10 scale-105" : "border-gray-300"
        )}
        {...dragHandlers}
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium mb-2">Uploader des documents</h3>
        <p className="text-sm text-gray-500 mb-4">Glissez-déposez vos fichiers ici</p>

        <input
          type="file"
          id="file-upload"
          className="hidden"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
        />
        <label
          htmlFor="file-upload"
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg cursor-pointer inline-block hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg"
        >
          Sélectionner des fichiers
        </label>
      </div>

      {files.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Fichiers sélectionnés:</h4>
          <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
            {files.map((file, index) => (
              <div key={index} className="text-sm glass-effect p-3 rounded-lg flex justify-between items-center">
                <span className="truncate flex-1 mr-2">{file.name}</span>
                <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
        <Button 
          onClick={() => onUpload(files)} 
          disabled={files.length === 0}
          className="bg-gradient-to-r from-black to-black hover:from-blue-700 text-white "
        >
          Uploader ({files.length})
        </Button>
      </div>
    </div>
  )
}