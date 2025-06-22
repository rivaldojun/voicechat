const { client } = require('../utils/chroma');
const { GeminiEmbeddingFunction } = require('../../lib/gemini-embedding');
const embedder = new GeminiEmbeddingFunction("AIzaSyD0phHq4PckAy8vLYlzkAnaHy4tdwT7rxA");
const { PrismaClient } = require('../../lib/generated/prisma');
const prisma = new PrismaClient();
export type FormationMatch = {
    id: string
    titre: string
    description: string
    categorie: string
    niveau: string
    duree: string
    prix: string
    score: number // Pourcentage d'adéquation
    partner: boolean
    metadata: Record<string, any>
  }

export function extractJSONFromText(text: string): any | null {
    try {
      const finIndex = text.indexOf('[FIN_CONVERSATION]')
      if (finIndex === -1) return null
      const afterFin = text.slice(finIndex + '[FIN_CONVERSATION]'.length)
      const jsonMatch = afterFin.match(/(\{[\s\S]*?\})/)
      if (!jsonMatch) return null
      const rawJson = jsonMatch[1]
      const cleanedJson = rawJson
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim()
      return JSON.parse(cleanedJson)
    } catch (err) {
      console.error("❌ Erreur parsing JSON finalCriteria :", err)
      return null
    }
  }

  export function extractUserInfoFromText(text: string): any | null {
    try {
      const finIndex = text.indexOf('[FIN_CONVERSATION_2]')
      if (finIndex === -1) return null
      const afterFin = text.slice(finIndex + '[FIN_CONVERSATION_2]'.length)
      const jsonMatch = afterFin.match(/(\{[\s\S]*?\})/)
      if (!jsonMatch) return null
      const rawJson = jsonMatch[1]
      const cleanedJson = rawJson
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim()
      return JSON.parse(cleanedJson)
    } catch (err) {
      console.error("❌ Erreur parsing JSON finalCriteria :", err)
      return null
    }
  }
export  function buildQueryText(criteria: Record<string, any>): string {
    const lines: string[] = []
    for (const [key, value] of Object.entries(criteria)) {
      if (value && typeof value === 'string') {
        lines.push(`• ${key} : ${value}`)
      }
    }
    return `Voici les critères de la formation recherchée :\n${lines.join('\n')}`
  }

  export async function findBestMatchingFormation(criteria: Record<string, any>): Promise<FormationMatch[] | undefined> {
    try {
      const queryText = buildQueryText(criteria)
      const queryEmbedding = await embedder.generate(queryText)
  
      const formations = await prisma.program.findMany({
        where: {
          embedding: {
            isEmpty: false,
          },
        },
      })

      function cosineSimilarity(a: number[], b: number[]): number {
        const dot = a.reduce((acc, val, i) => acc + val * b[i], 0)
        const normA = Math.sqrt(a.reduce((acc, val) => acc + val * val, 0))
        const normB = Math.sqrt(b.reduce((acc, val) => acc + val * val, 0))
        return dot / (normA * normB)
      }
  
      const processed = formations.map((formation: any) => {
        const similarity = cosineSimilarity(queryEmbedding, formation.embedding as number[])
        const baseScore = Math.max(0, Math.min(100, similarity * 100))
  
        let criteriaScore = 0
        let criteriaCount = 0
  
  
        if (criteria.niveau && formation.type) {
          criteriaCount++
          if (
            formation.type.toLowerCase().includes(criteria.niveau.toLowerCase())
          ) {
            criteriaScore++
          }
        }
  
        if (criteria.modalite && formation.delivered) {
          criteriaCount++
          if (
            formation.delivered.toLowerCase().includes(criteria.modalite.toLowerCase())
          ) {
            criteriaScore++
          }
        }
  
        const finalScore =
          criteriaCount > 0
            ? baseScore * 0.7 + (criteriaScore / criteriaCount) * 100 * 0.3
            : baseScore


          const stats = JSON.parse(formation.statistics || "[]")
        return {
          id: formation?.id || "ID inconnu",
          titre: formation?.title || "Formation sans titre",
          ecole: formation?.universityName || "École inconnue",
          description: formation?.StudyDescription || "Aucune description disponible",
          categorie: formation?.modality || "Non catégorisée",
          niveau: formation?.type || "Non spécifié",
          duree: stats?.find((s: { label: string; value: string }) => s.label === "Duration")?.value || "Non spécifiée",
          prix: stats?.find((s: { label: string; value: string }) => s.label === "Tuition fee")?.value || "Non spécifié",
          partner: formation?.partner || false,
          score: finalScore
        }
      })
  
      const partnerMatches = processed
        .filter((f: FormationMatch) => f.partner)
        .sort((a: FormationMatch, b: FormationMatch) => b.score - a.score)
        .slice(0, 4)
  
      const nonPartnerMatches = processed
        .filter((f: FormationMatch) => !f.partner)
        .sort((a: FormationMatch, b: FormationMatch) => b.score - a.score)
        .slice(0, 2)
  
      return [...partnerMatches, ...nonPartnerMatches].sort((a, b) => b.score - a.score)
    } catch (error) {
      console.error("Erreur lors de la recherche de formations:", error)
      return undefined
    }
  }