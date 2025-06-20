"use client"

import { useState } from "react"
import {
  X,
  Clock,
  DollarSign,
  BookOpen,
  Star,
  Users,
  Award,
  Calendar,
  User,
  Target,
  CheckCircle2,
  Minus,
  HandshakeIcon,
} from "lucide-react"

type FormationMatch = {
  id: string
  titre: string
  description: string
  categorie: string
  niveau: string
  duree: string
  prix: string
  score: number // Pourcentage d'adéquation
  partner:boolean
  metadata: Record<string, any>
}
interface FormationModalProps {
  isOpen: boolean
  onClose: () => void
  formations: Array<any>
  onSubmit: (formations: FormationMatch[]) => Promise<void>
}

const FormationModal = ({ isOpen, onClose, formations = [], onSubmit }: FormationModalProps) => {
  const [selectedFormations, setSelectedFormations] = useState<typeof formations>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFormationToggle = (formation: any) => {
    setSelectedFormations((prev) => {
      const isSelected = prev.some((f) => f.id === formation.id)
      if (isSelected) {
        // Retirer la formation de la sélection
        return prev.filter((f) => f.id !== formation.id)
      } else {
        // Ajouter la formation à la sélection
        return [...prev, formation]
      }
    })
  }

  const handleSubmit = async () => {
    if (selectedFormations.length === 0) return

    setIsSubmitting(true)
    try {
      await onSubmit(selectedFormations)
      onClose()
    } catch (error) {
      console.error("Erreur lors de la soumission:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormationSelected = (formationId: string) => {
    return selectedFormations.some((f) => f.id === formationId)
  }

  const getTotalPrice = () => {
    return selectedFormations.reduce((total, formation) => {
      const price = Number.parseFloat(formation.prix.replace(/[^\d,]/g, "").replace(",", ".")) || 0
      return total + price
    }, 0)
  }

  const getNiveauColor = (niveau: string) => {
    switch (niveau?.toLowerCase()) {
      case "débutant":
      case "debutant":
        return "bg-green-100 text-green-800"
      case "intermédiaire":
      case "intermediaire":
        return "bg-orange-100 text-orange-800"
      case "avancé":
      case "avance":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategorieColor = (categorie: string) => {
    return  "bg-gray-100 text-gray-800"
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-6xl max-h-[90vh] mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Formations Recommandées</h2>
              <p className="text-blue-100 mt-1">
                Sélectionnez une ou plusieurs formations ({selectedFormations.length} sélectionnée
                {selectedFormations.length > 1 ? "s" : ""})
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Selected formations summary */}
        {selectedFormations.length > 0 && (
          <div className="bg-blue-50 border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Formations sélectionnées:</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedFormations.map((formation) => (
                    <div key={formation.id} className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border">
                      <span className="text-sm font-medium text-black">{formation.titre}</span>
                      <button
                        onClick={() => handleFormationToggle(formation)}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              {/* <div className="text-right">
                <div className="text-sm text-gray-600">Prix total</div>
                <div className="text-xl font-bold text-green-600">
                  {getTotalPrice().toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </div>
              </div> */}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
        {formations.length === 0 && selectedFormations.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">Aucune formation trouvée</p>
        </div>
      ) : (
        <div className="space-y-6">
          {formations.map((formation: any) => {
            const isSelected = isFormationSelected(formation.id)
            return (
              <div
                key={formation.id}
                className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  isSelected ? "border-blue-500 bg-blue-50 shadow-lg" : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleFormationToggle(formation)}
              >
                {/* Selection indicator */}
                <div className="absolute top-4 right-4">
                  {isSelected ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="text-blue-500" size={24} />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleFormationToggle(formation)
                        }}
                        className="p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Score de matching - Nouvelle position proéminente */}
                  <div className="lg:col-span-1 flex lg:flex-col items-center lg:items-start">
                    <MatchingScore score={formation.score} />
                  </div>

                  {/* Main Info */}
                  <div className="lg:col-span-2 space-y-4">
                    <div>
                      <div className="flex items-start justify-between mb-2 pr-16">
                        <h3 className="text-xl font-bold text-gray-900">{formation.titre}</h3>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-medium text-blue-600">{formation.ecole}</span>
                        {formation.metadata?.estCertifiant === "true" && (
                          <Award className="text-yellow-500" size={16} />
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getCategorieColor(formation.categorie)}`}
                        >
                          {formation.categorie}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getNiveauColor(formation.niveau)}`}
                        >
                          {formation.niveau}
                        </span>
                      </div>

                      <p className="text-gray-700 leading-relaxed">{formation.description}</p>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {formation.metadata?.objectifs && (
                        <div className="flex items-start gap-2">
                          <Target className="text-blue-500 mt-0.5" size={16} />
                          <div>
                            <span className="font-medium text-gray-900">Objectifs:</span>
                            <p className="text-gray-600 mt-1">{formation.metadata.objectifs}</p>
                          </div>
                        </div>
                      )}

                      {formation.metadata?.publicCible && (
                        <div className="flex items-start gap-2">
                          <Users className="text-green-500 mt-0.5" size={16} />
                          <div>
                            <span className="font-medium text-gray-900">Public cible:</span>
                            <p className="text-gray-600 mt-1">{formation.metadata.publicCible}</p>
                          </div>
                        </div>
                      )}

                      {formation.metadata?.competences && (
                        <div className="flex items-start gap-2 md:col-span-2">
                          <BookOpen className="text-blue-500 mt-0.5" size={16} />
                          <div>
                            <span className="font-medium text-gray-900">Compétences acquises:</span>
                            <p className="text-gray-600 mt-1">{formation.metadata.competences}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Side Info */}
                  <div className="lg:col-span-1 space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="text-green-600" size={18} />
                        <div>
                          <span className="text-sm text-gray-600">Prix</span>
                          <p className="font-bold text-xl text-green-600">{formation.prix}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="text-blue-600" size={18} />
                        <div>
                          <span className="text-sm text-gray-600">Durée</span>
                          <p className="font-medium text-black">{formation.duree}</p>
                        </div>
                      </div>

                      { formation.partner && (<div className="flex items-center gap-2">
                        <HandshakeIcon className="text-blue-600" size={18} />
                        <div>
                          <span className="text-sm text-gray-600">Partner</span>
                        </div>
                      </div>)}


                      {formation.metadata?.dateDebut && (
                        <div className="flex items-center gap-2">
                          <Calendar className="text-blue-600" size={18} />
                          <div>
                            <span className="text-sm text-gray-600">Début</span>
                            <p className="font-medium text-black">
                              {new Date(formation.metadata.dateDebut).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                        </div>
                      )}

                      {formation.metadata?.formateur && (
                        <div className="flex items-center gap-2">
                          <User className="text-orange-600" size={18} />
                          <div>
                            <span className="text-sm text-gray-600">Formateur</span>
                            <p className="font-medium text-sm text-black">
                              {formation.metadata.formateur.split(" (")[0]}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {formation.metadata?.modalites && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">Modalités:</span>
                        <p className="text-gray-600 mt-1">{formation.metadata.modalites}</p>
                      </div>
                    )}

                    {formation.metadata?.prerequis && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">Prérequis:</span>
                        <p className="text-gray-600 mt-1">{formation.metadata.prerequis}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
        </div>

        {/* Footer */}
        {formations.length > 0 && (
          <div className="bg-gray-50 px-6 py-4 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedFormations.length > 0 ? (
                  <span className="text-green-600 font-medium">
                    ✓ {selectedFormations.length} formation{selectedFormations.length > 1 ? "s" : ""} sélectionnée
                    {selectedFormations.length > 1 ? "s" : ""}
                  </span>
                ) : (
                  "Sélectionnez une ou plusieurs formations pour continuer"
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={selectedFormations.length === 0 || isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    `Choisir ${selectedFormations.length > 1 ? "ces formations" : "cette formation"} (${selectedFormations.length})`
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FormationModal



// Composant pour le score de matching amélioré
const MatchingScore = ({ score }: { score: number }) => {
  const percentage = Math.round(score)
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 border-green-200 bg-green-50"
    if (score >= 60) return "text-orange-600 border-orange-200 bg-orange-50"
    return "text-red-600 border-red-200 bg-red-50"
  }

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-orange-500"
    return "bg-red-500"
  }

  return (
    <div className={`flex flex-col items-center p-4 rounded-xl border-2 ${getScoreColor(percentage)} min-w-[120px]`}>
      <div className="flex items-center gap-1 mb-2">
        <Star className="text-yellow-500" size={20} />
        <span className="text-xs font-medium text-gray-600">MATCHING</span>
      </div>

      {/* Score principal */}
      <div className="text-3xl font-bold mb-2">
        {percentage}
        <span className="text-lg">/100</span>
      </div>

      {/* Barre de progression circulaire */}
      <div className="relative w-16 h-16 mb-2">
        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-gray-200" />
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={`${(percentage / 100) * 175.93} 175.93`}
            className={getProgressColor(percentage)}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold">{percentage}%</span>
        </div>
      </div>

      {/* Label de qualité */}
      <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/50">
        {percentage >= 80 ? "Excellent" : percentage >= 60 ? "Bon" : "Moyen"}
      </span>
    </div>
  )
}