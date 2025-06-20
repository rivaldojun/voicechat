"use server"
const { PrismaClient } = require('../lib/generated/prisma');
const { client } = require('../utils/chroma');
const prisma = new PrismaClient();
const { GeminiEmbeddingFunction } = require('../../lib/gemini-embedding');
// Configuration ChromaDB


// const embedder = new OpenAIEmbeddingFunction({
//   openai_api_key: process.env.OPENAI_API_KEY!,
// })

const embedder = new GeminiEmbeddingFunction("AIzaSyD0phHq4PckAy8vLYlzkAnaHy4tdwT7rxA");

interface ProgramFormData {
  title: string
  about: string
  universityId: string
  universityName: string
  universityPage: string
  statistics: { label: string; value: string }[]
  type: string
  language: string
  scholarships: string[]
  languageTest: string[]
  delivered: string
  abilities: string[]
  StudyDescription: string
  programmeStructure: string[]
  generalRequirements: string[]
}

export async function addProgram(formData: ProgramFormData) {
  try {
    // Préparer les données pour la base SQL
    const programData = {
      title: formData.title,
      about: formData.about,
      universityId: Number.parseInt(formData.universityId),
      universityName: formData.universityName,
      universityPage: formData.universityPage || null,
      statistics: JSON.stringify(
        formData.statistics.filter((stat) => stat.label.trim() !== "" && stat.value.trim() !== ""),
      ),
      type: formData.type,
      language: formData.language || null,
      scholarships: JSON.stringify(formData.scholarships.filter((item) => item.trim() !== "")),
      languageTest: JSON.stringify(formData.languageTest.filter((item) => item.trim() !== "")),
      delivered: formData.delivered || null,
      abilities: JSON.stringify(formData.abilities.filter((item) => item.trim() !== "")),
      StudyDescription: formData.StudyDescription || null,
      programmeStructure: JSON.stringify(formData.programmeStructure.filter((item) => item.trim() !== "")),
      generalRequirements: JSON.stringify(formData.generalRequirements.filter((item) => item.trim() !== "")),
    }

    // Simuler l'insertion en base SQL (remplacer par votre ORM/client DB)
    // const program = await prisma.program.create({ data: programData })

    // Pour la démo, on simule un ID
    const programId = Math.floor(Math.random() * 10000)

    // Préparer le texte pour l'embedding ChromaDB
    const textForEmbedding = `
      Programme: ${formData.title}
      Type: ${formData.type}
      Université: ${formData.universityName}
      À propos: ${formData.about}
      Description des études: ${formData.StudyDescription}
      Langue: ${formData.language}
      Mode de livraison: ${formData.delivered}
      Bourses: ${formData.scholarships.join(", ")}
      Tests de langue: ${formData.languageTest.join(", ")}
      Compétences: ${formData.abilities.join(", ")}
      Structure: ${formData.programmeStructure.join(", ")}
      Exigences: ${formData.generalRequirements.join(", ")}
      Statistiques: ${formData.statistics.map((s) => `${s.label}: ${s.value}`).join(", ")}
    `.trim()

    // Créer ou obtenir la collection ChromaDB pour les programmes
    let collection
    try {
      collection = await client.getCollection({
        name: "programs",
        embeddingFunction: embedder,
      })
    } catch (error) {
      collection = await client.createCollection({
        name: "programs",
        embeddingFunction: embedder,
      })
    }

    // Ajouter à ChromaDB
    await collection.add({
      ids: [`program_${programId}`],
      documents: [textForEmbedding],
      metadatas: [
        {
          id: programId,
          title: formData.title,
          type: formData.type,
          university_id: Number.parseInt(formData.universityId),
          university_name: formData.universityName,
          language: formData.language,
          program_type: "program",
          created_at: new Date().toISOString(),
        },
      ],
    })

    return { success: true, id: programId }
  } catch (error) {
    console.error("Erreur lors de l'ajout du programme:", error)
    return { success: false, error: "Erreur lors de l'ajout du programme" }
  }
}

export async function searchPrograms(query: string) {
  try {
    const collection = await client.getCollection({
      name: "programs",
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

export async function getProgramsByUniversity(universityId: number) {
  try {
    // Simuler la récupération depuis la base SQL
    const programs = await prisma.program.findMany({
      where: { universityId },
      select: { id: true, title: true, type: true }
    })

    // Pour la démo, on retourne des données simulées
    // const programs = [
    //   { id: 1, title: "Master en Informatique", type: "master" },
    //   { id: 2, title: "Bachelor en Mathématiques", type: "bachelor" },
    // ]

    return { success: true, data: programs }
  } catch (error) {
    console.error("Erreur lors de la récupération des programmes:", error)
    return { success: false, error: "Erreur lors de la récupération des programmes" }
  }
}


export async function getProgramsByIds(ids: number[]) {
  try {
    const programs = await prisma.program.findMany({
      where: {
        id: {
          in: ids,
        },
      }
    })

    return { success: true, data: programs }
  } catch (error) {
    console.error("Erreur lors de la récupération des programmes par IDs:", error)
    return { success: false, error: "Erreur lors de la récupération des programmes par IDs" }
  }
}

