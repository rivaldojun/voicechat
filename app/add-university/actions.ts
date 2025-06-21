"use server"

const { PrismaClient } = require('../lib/generated/prisma');
const { GeminiEmbeddingFunction } = require('../../lib/gemini-embedding');

const prisma = new PrismaClient();
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

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((acc, val, i) => acc + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((acc, val) => acc + val * val, 0));
  const normB = Math.sqrt(b.reduce((acc, val) => acc + val * val, 0));
  return dot / (normA * normB);
}

export async function addUniversity(formData: UniversityFormData) {
  try {
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
    };

    const textForEmbedding = `
      Université: ${formData.name}
      À propos: ${formData.about.join(". ")}
      Services: ${formData.services.join(", ")}
      Vie étudiante: ${formData.studentLife.join(". ")}
      Programmes: ${formData.programs.join(", ")}
      Statistiques: ${formData.statistics.map((s) => `${s.label}: ${s.value}`).join(", ")}
    `.trim();

    const embedding = await embedder.generate(textForEmbedding);

    const university = await prisma.university.create({
      data: {
        ...universityData,
        embedding: embedding,
      }
    });

    return { success: true, id: university.id };
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'université:", error);
    return { success: false, error: "Erreur lors de l'ajout de l'université" };
  }
}

export async function getUniversities() {
  try {
    const universities = await prisma.university.findMany({
      select: {
        id: true,
        name: true,
      }
    });

    return { success: true, data: universities };
  } catch (error) {
    console.error("Erreur lors de la récupération des universités:", error);
    return { success: false, error: "Erreur lors de la récupération des universités" };
  }
}

export async function searchUniversities(query: string) {
  try {
    const queryEmbedding = await embedder.generate(query);

    const universities = await prisma.university.findMany({
      where: {
        embedding: {
          not: null,
        }
      },
      select: {
        id: true,
        name: true,
        embedding: true,
      }
    });

    const scored = universities
      .map((univ: { id: string; name: string; embedding: number[] | null }) => ({
        ...univ,
        similarity: cosineSimilarity(queryEmbedding, univ.embedding as number[]),
      }))
      .sort((a: { similarity: number }, b: { similarity: number }) => b.similarity - a.similarity)
      .slice(0, 10);

    return { success: true, data: scored };
  } catch (error) {
    console.error("Erreur lors de la recherche des universités:", error);
    return { success: false, error: "Erreur lors de la recherche des universités" };
  }
}
