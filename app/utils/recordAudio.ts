const recordAudio = () => {
    return new Promise<Blob>((resolve, reject) => {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        const mediaRecorder = new MediaRecorder(stream)
        const audioChunks: BlobPart[] = []
  
        mediaRecorder.ondataavailable = event => {
          audioChunks.push(event.data)
        }
  
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
          resolve(audioBlob)
        }
  
        mediaRecorder.start()
  
        setTimeout(() => {
          mediaRecorder.stop()
        }, 5000) // par exemple 5 secondes d’enregistrement
      }).catch(reject)
    })
  }
  