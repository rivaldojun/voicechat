"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, X } from "lucide-react"
import { addUniversity } from "./actions"
import { useRouter } from "next/navigation"

export default function AddUniversityPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    about: [""],
    services: [""],
    studentLife: [""],
    reviews: [""],
    programs: [""],
    statistics: [{ label: "", value: "" }],
  })

  const addArrayField = (field: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field as keyof typeof prev] as string[]), ""],
    }))
  }

  const removeArrayField = (field: string, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).filter((_, i) => i !== index),
    }))
  }

  const updateArrayField = (field: string, index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).map((item, i) => (i === index ? value : item)),
    }))
  }

  const addStatistic = () => {
    setFormData((prev) => ({
      ...prev,
      statistics: [...prev.statistics, { label: "", value: "" }],
    }))
  }

  const removeStatistic = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      statistics: prev.statistics.filter((_, i) => i !== index),
    }))
  }

  const updateStatistic = (index: number, field: "label" | "value", value: string) => {
    setFormData((prev) => ({
      ...prev,
      statistics: prev.statistics.map((stat, i) => (i === index ? { ...stat, [field]: value } : stat)),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await addUniversity(formData)
      if (result.success) {
        router.push("/universities")
      } else {
        alert("Erreur lors de l'ajout de l'université")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Erreur lors de l'ajout de l'université")
    } finally {
      setLoading(false)
    }
  }

  const renderArrayField = (field: string, label: string, placeholder: string) => (
    <div className="space-y-2">
      <Label className="text-base font-medium">{label}</Label>
      {(formData[field as keyof typeof formData] as string[]).map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={item}
            onChange={(e) => updateArrayField(field, index, e.target.value)}
            placeholder={placeholder}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => removeArrayField(field, index)}
            disabled={(formData[field as keyof typeof formData] as string[]).length === 1}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => addArrayField(field)} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Ajouter {label.toLowerCase()}
      </Button>
    </div>
  )

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Ajouter une Université</CardTitle>
          <CardDescription>Remplissez les informations de l'université</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'université</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nom de l'université"
                required
              />
            </div>

            {renderArrayField("about", "À propos", "Information sur l'université")}
            {renderArrayField("services", "Services", "Service offert")}
            {renderArrayField("studentLife", "Vie étudiante", "Aspect de la vie étudiante")}
            {renderArrayField("reviews", "Avis", "Avis d'étudiant")}
            {renderArrayField("programs", "Programmes", "Programme offert")}

            <div className="space-y-2">
              <Label className="text-base font-medium">Statistiques</Label>
              {formData.statistics.map((stat, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={stat.label}
                    onChange={(e) => updateStatistic(index, "label", e.target.value)}
                    placeholder="Label (ex: Nombre d'étudiants)"
                    className="flex-1"
                  />
                  <Input
                    value={stat.value}
                    onChange={(e) => updateStatistic(index, "value", e.target.value)}
                    placeholder="Valeur (ex: 15000)"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeStatistic(index)}
                    disabled={formData.statistics.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addStatistic} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter statistique
              </Button>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Ajout en cours..." : "Ajouter l'université"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
