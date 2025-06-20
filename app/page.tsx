import VoiceChatbot from "../components/voice-chatbot-lite"
import AudioVisualizer from "../components/audio-visualizer"

export default function Page() {
  return (
    <div className="relative">
      <AudioVisualizer isActive={true} />
      <VoiceChatbot />
    </div>
  )
}
