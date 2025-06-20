"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X } from "lucide-react"
import { addProgram } from "./actions"
import { getUniversities } from "../add-university/actions"
import { useRouter } from "next/navigation"

interface University {
  id: number
  name: string
}

export default function AddFormationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [universities, setUniversities] = useState<University[]>([])
  const [formData, setFormData] = useState({
    title: "",
    about: "",
    universityId: "",
    universityName: "",
    universityPage: "",
    statistics: [{ label: "", value: "" }],
    type: "master",
    language: "",
    scholarships: [""],
    languageTest: [""],
    delivered: "",
    abilities: [""],
    StudyDescription: "",
    programmeStructure: [""],
    generalRequirements: [""],
    partner:false
  })

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const result = await getUniversities()
        if (result.success) {
          setUniversities(result.data ?? [])
        }
      } catch (error) {
        console.error("Error fetching universities:", error)
      }
    }
    fetchUniversities()
  }, [])

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

  const handleUniversityChange = (universityId: string) => {
    const university = universities.find((u) => u.id.toString() === universityId)
    setFormData((prev) => ({
      ...prev,
      universityId,
      universityName: university?.name || "",
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await addProgram(formData)
      if (result.success) {
        router.push("/programs")
      } else {
        alert("Erreur lors de l'ajout du programme")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Erreur lors de l'ajout du programme")
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
          <CardTitle>Ajouter une Formation</CardTitle>
          <CardDescription>Remplissez les informations du programme de formation</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre du programme</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Titre du programme"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="university">Université</Label>
                <Select onValueChange={handleUniversityChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une université" />
                  </SelectTrigger>
                  <SelectContent>
                    {universities.map((university) => (
                      <SelectItem key={university.id} value={university.id.toString()}>
                        {university.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="about">À propos du programme</Label>
              <Textarea
                id="about"
                value={formData.about}
                onChange={(e) => setFormData((prev) => ({ ...prev, about: e.target.value }))}
                placeholder="Description du programme"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type de programme</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bachelor">Bachelor</SelectItem>
                    <SelectItem value="master">Master</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                    <SelectItem value="certificate">Certificat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Langue d'enseignement</Label>
                <Input
                  id="language"
                  value={formData.language}
                  onChange={(e) => setFormData((prev) => ({ ...prev, language: e.target.value }))}
                  placeholder="ex: Français, Anglais"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivered">Mode de livraison</Label>
                <Input
                  id="delivered"
                  value={formData.delivered}
                  onChange={(e) => setFormData((prev) => ({ ...prev, delivered: e.target.value }))}
                  placeholder="ex: Présentiel, En ligne"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="universityPage">Page de l'université</Label>
              <Input
                id="universityPage"
                value={formData.universityPage}
                onChange={(e) => setFormData((prev) => ({ ...prev, universityPage: e.target.value }))}
                placeholder="URL de la page du programme"
                type="url"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="StudyDescription">Description des études</Label>
              <Textarea
                id="StudyDescription"
                value={formData.StudyDescription}
                onChange={(e) => setFormData((prev) => ({ ...prev, StudyDescription: e.target.value }))}
                placeholder="Description détaillée des études"
                rows={3}
              />
            </div>

            {renderArrayField("scholarships", "Bourses d'études", "Information sur les bourses")}
            {renderArrayField("languageTest", "Tests de langue", "Test de langue requis")}
            {renderArrayField("abilities", "Compétences acquises", "Compétence développée")}
            {renderArrayField("programmeStructure", "Structure du programme", "Module ou cours")}
            {renderArrayField("generalRequirements", "Exigences générales", "Exigence d'admission")}

            <div className="space-y-2">
              <Label className="text-base font-medium">Statistiques</Label>
              {formData.statistics.map((stat, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={stat.label}
                    onChange={(e) => updateStatistic(index, "label", e.target.value)}
                    placeholder="Label (ex: Durée)"
                    className="flex-1"
                  />
                  <Input
                    value={stat.value}
                    onChange={(e) => updateStatistic(index, "value", e.target.value)}
                    placeholder="Valeur (ex: 2 ans)"
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

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="partner"
                checked={formData.partner}
                onChange={(e) => setFormData((prev) => ({ ...prev, partner: e.target.checked }))}
                className="h-4 w-4"
              />
              <Label htmlFor="partner">Ce programme est en partenariat</Label>
            </div>


            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Ajout en cours..." : "Ajouter le programme"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
