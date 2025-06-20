"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, X, FileText, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface DocumentUploaderProps {
  onUpload: (fileNames: string[]) => void
  onCancel: () => void
}

export default function DocumentUploader({ onUpload, onCancel }: DocumentUploaderProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...fileArray])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files) {
      const fileArray = Array.from(e.dataTransfer.files)
      setFiles((prev) => [...prev, ...fileArray])
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 5
      })
    }, 100)

    // Simulate upload delay
    setTimeout(() => {
      clearInterval(interval)
      setUploadProgress(100)

      // In a real app, you would upload the files to your server here
      // and then process them with OpenAI's API

      // For now, we'll just pass the file names to the parent component
      onUpload(files.map((file) => file.name))
      setUploading(false)
    }, 2000)
  }

  return (
    <div className="w-full max-w-md bg-gray-900/50 rounded-lg p-6 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Upload Documents</h3>
        <Button variant="ghost" size="icon" onClick={onCancel} disabled={uploading}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div
        className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
          accept=".pdf,.doc,.docx,.txt"
        />

        <Upload className="h-10 w-10 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-400 mb-1">Drag and drop files here or click to browse</p>
        <p className="text-xs text-gray-500">Supports PDF, DOC, DOCX, TXT</p>
      </div>

      {files.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">Selected files:</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-800/50 p-2 rounded">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                  className="h-6 w-6"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploading && (
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-1" />
        </div>
      )}

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onCancel} disabled={uploading}>
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {uploadProgress === 100 ? (
            <>
              <Check className="h-4 w-4 mr-1" /> Done
            </>
          ) : (
            "Upload"
          )}
        </Button>
      </div>
    </div>
  )
}
