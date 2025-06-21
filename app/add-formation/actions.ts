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

    const embedding= await embedder.generate(textForEmbedding)

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
      embedding: embedding,

    }

    // Simuler l'insertion en base SQL (remplacer par votre ORM/client DB)
    const program = await prisma.program.create({ data: programData })


    return { success: true, id: program.id }
  } catch (error) {
    console.error("Erreur lors de l'ajout du programme:", error)
    return { success: false, error: "Erreur lors de l'ajout du programme" }
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((acc, val, i) => acc + val * b[i], 0)
  const normA = Math.sqrt(a.reduce((acc, val) => acc + val * val, 0))
  const normB = Math.sqrt(b.reduce((acc, val) => acc + val * val, 0))
  return dot / (normA * normB)
}

export async function searchPrograms(query: string) {
  try {
    // Générer l'embedding de la requête
    const queryEmbedding = await embedder.generate(query)

    // Récupérer tous les programmes avec embedding (attention à la perf si beaucoup de lignes)
    const programs = await prisma.program.findMany({
      select: {
        id: true,
        title: true,
        type: true,
        universityName: true,
        embedding: true,
      },
      where: {
        embedding: {
          not: null,
        },
      },
    })

    // Calcul de similarité cosinus pour chaque embedding
    const scoredPrograms = programs
      .map((program: { id: number; title: string; type: string; universityName: string; embedding: number[] | null }) => {
        const similarity = cosineSimilarity(queryEmbedding, program.embedding as number[])
        return { ...program, similarity }
      })
      .sort((a: { similarity: number }, b: { similarity: number }) => b.similarity - a.similarity) // Tri décroissant de similarité
      .slice(0, 10)

    return { success: true, data: scoredPrograms }

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

