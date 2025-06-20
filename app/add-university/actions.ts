"use server"
const { client } = require('../utils/chroma');
const { GeminiEmbeddingFunction } = require('../../lib/gemini-embedding');
// Configuration ChromaDB


const embedder = new GeminiEmbeddingFunction("AIzaSyD0phHq4PckAy8vLYlzkAnaHy4tdwT7rxA");

interface UniversityFormData {
  name: string
  about: string[]
  services: string[]
  studentLife: string[]
  reviews: string[]
  programs: string[]
  statistics: { label: string; value: string }[]
}

export async function addUniversity(formData: UniversityFormData) {
  try {
    // Préparer les données pour la base SQL
    const universityData = {
      name: formData.name,
      about: JSON.stringify(formData.about.filter((item) => item.trim() !== "")),
      services: JSON.stringify(formData.services.filter((item) => item.trim() !== "")),
      studentLife: JSON.stringify(formData.studentLife.filter((item) => item.trim() !== "")),
      reviews: JSON.stringify(formData.reviews.filter((item) => item.trim() !== "")),
      programs: JSON.stringify(formData.programs.filter((item) => item.trim() !== "")),
      statistics: JSON.stringify(
        formData.statistics.filter((stat) => stat.label.trim() !== "" && stat.value.trim() !== ""),
      ),
    }

    // Simuler l'insertion en base SQL (remplacer par votre ORM/client DB)
    // const university = await prisma.university.create({ data: universityData })

    // Pour la démo, on simule un ID
    const universityId = Math.floor(Math.random() * 10000)

    // Préparer le texte pour l'embedding ChromaDB
    const textForEmbedding = `
      Université: ${formData.name}
      À propos: ${formData.about.join(". ")}
      Services: ${formData.services.join(", ")}
      Vie étudiante: ${formData.studentLife.join(". ")}
      Programmes: ${formData.programs.join(", ")}
      Statistiques: ${formData.statistics.map((s) => `${s.label}: ${s.value}`).join(", ")}
    `.trim()

    // Créer ou obtenir la collection ChromaDB pour les universités
    let collection
    try {
      collection = await client.getCollection({
        name: "universities",
        embeddingFunction: embedder,
      })
    } catch (error) {
      collection = await client.createCollection({
        name: "universities",
        embeddingFunction: embedder,
      })
    }

    // Ajouter à ChromaDB
    await collection.add({
      ids: [`university_${universityId}`],
      documents: [textForEmbedding],
      metadatas: [
        {
          id: universityId,
          name: formData.name,
          type: "university",
          created_at: new Date().toISOString(),
        },
      ],
    })

    return { success: true, id: universityId }
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'université:", error)
    return { success: false, error: "Erreur lors de l'ajout de l'université" }
  }
}

export async function getUniversities() {
  try {
    // Simuler la récupération depuis la base SQL
    // const universities = await prisma.university.findMany({ select: { id: true, name: true } })

    // Pour la démo, on retourne des données simulées
    const universities = [
      { id: 1, name: "Université de Paris" },
      { id: 2, name: "Sorbonne Université" },
      { id: 3, name: "Université Lyon 1" },
    ]

    return { success: true, data: universities }
  } catch (error) {
    console.error("Erreur lors de la récupération des universités:", error)
    return { success: false, error: "Erreur lors de la récupération des universités" }
  }
}

export async function searchUniversities(query: string) {
  try {
    const collection = await client.getCollection({
      name: "universities",
        embeddingFunction: embedder,
    })

    const results = await collection.query({
      queryTexts: [query],
      nResults: 10,
    })

    return { success: true, data: results }
  } catch (error) {
    console.error("Erreur lors de la recherche:", error)
    return { success: false, error: "Erreur lors de la recherche" }
  }
}
