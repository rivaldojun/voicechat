"use client"

import type React from "react"

import { X, User, Mail, Phone, Calendar, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UserInfo {
  nom: string
  prenom: string
  email: string
  telephone: string
  date_naissance: string
  nationalite: string
}

interface UserInfoModalProps {
  isOpen: boolean
  onClose: () => void
  userInfo: UserInfo
  onSubmit: (userInfo: UserInfo) => void
}

export default function UserInfoModal({ isOpen, onClose, userInfo, onSubmit }: UserInfoModalProps) {
  if (!isOpen) return null

  const handleSubmit = () => {
    onSubmit(userInfo)
    onClose()
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleOverlayClick}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="text-gray-600" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Informations personnelles</h2>
              <p className="text-sm text-gray-500">Vérifiez vos données</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="text-gray-400" size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Nom et Prénom */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nom</label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-gray-900 font-medium">{userInfo.nom}</p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Prénom</label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-gray-900 font-medium">{userInfo.prenom}</p>
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Mail size={16} className="text-gray-500" />
              Email
            </label>
            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="text-gray-900">{userInfo.email}</p>
            </div>
          </div>

          {/* Téléphone */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Phone size={16} className="text-gray-500" />
              Téléphone
            </label>
            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="text-gray-900">{userInfo.telephone}</p>
            </div>
          </div>

          {/* Date de naissance */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Calendar size={16} className="text-gray-500" />
              Date de naissance
            </label>
            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="text-gray-900">{userInfo.date_naissance}</p>
            </div>
          </div>

          {/* Nationalité */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Globe size={16} className="text-gray-500" />
              Nationalité
            </label>
            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="text-gray-900">{userInfo.nationalite}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-100 bg-gray-50/50">
          <Button variant="outline" onClick={onClose} className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50">
            Annuler
          </Button>
          <Button onClick={handleSubmit} className="flex-1 bg-gray-900 hover:bg-gray-800 text-white">
            Confirmer
          </Button>
        </div>
      </div>
    </div>
  )
}
