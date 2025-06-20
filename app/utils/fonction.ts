const { client } = require('../utils/chroma');
const { GeminiEmbeddingFunction } = require('../../lib/gemini-embedding');
const embedder = new GeminiEmbeddingFunction("AIzaSyD0phHq4PckAy8vLYlzkAnaHy4tdwT7rxA");
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

export  async function findBestMatchingFormation(criteria: Record<string, any>): Promise<FormationMatch[] | undefined> {
    try {
      const collection = await client.getCollection({
        name: "programs",
        embeddingFunction: embedder,
      })
      const queryText = buildQueryText(criteria)
      // Query 1: partenaires
    const partnerResults = await collection.query({
        queryTexts: [queryText],
        nResults: 10,
        embeddingFunction: embedder,
        where: { partner: true },
      })
  
      // Query 2: non-partenaires
      const nonPartnerResults = await collection.query({
        queryTexts: [queryText],
        nResults: 10,
        embeddingFunction: embedder,
        where: { partner: false },
      })
  
      if ((!partnerResults.ids[0] || partnerResults.ids[0].length === 0) && (!nonPartnerResults.ids[0] || nonPartnerResults.ids[0].length === 0)) {
        return undefined
      }
  
      // Calculer les scores d'adéquation pour chaque formation
      function processResults(results: any): FormationMatch[] {
        if (!results.ids[0]) return []
        return results.ids[0].map((id: string, index: number) => {
          const metadata = results.metadatas[0][index]
          const distance = results.distances?.[0]?.[index] || 1
          const score = Math.max(0, Math.min(100, (1 - distance / 2) * 100))
  
          let criteriaScore = 0
          let criteriaCount = 0
  
          if (criteria.domaine && metadata?.categorie) {
            criteriaCount++
            if (
              String(metadata?.categorie).toLowerCase().includes(String(criteria.domaine).toLowerCase()) ||
              String(criteria.domaine).toLowerCase().includes(String(metadata?.categorie).toLowerCase())
            ) {
              criteriaScore++
            }
          }
  
          if (criteria.niveau && metadata?.niveau) {
            criteriaCount++
            if (
              typeof metadata.niveau === "string" &&
              typeof criteria.niveau === "string" &&
              metadata.niveau.toLowerCase().includes(criteria.niveau.toLowerCase())
            ) {
              criteriaScore++
            }
          }
  
          if (criteria.modalite && metadata?.modalites) {
            criteriaCount++
            if (
              typeof metadata?.modalites === "string" &&
              typeof criteria.modalite === "string" &&
              metadata.modalites.toLowerCase().includes(criteria.modalite.toLowerCase())
            ) {
              criteriaScore++
            }
          }
  
          const finalScore = criteriaCount > 0
            ? score * 0.7 + (criteriaScore / criteriaCount) * 100 * 0.3
            : score
  
          return {
            id: metadata?.id || id,
            titre: metadata?.title || "Formation sans titre",
            ecole: metadata?.university_name || "École inconnue",
            description: metadata?.description || "Aucune description disponible",
            categorie: metadata?.modality || "Non catégorisée",
            niveau: metadata?.type || "Non spécifié",
            duree: metadata?.duration || "Non spécifiée",
            prix: metadata?.school_fees || "Non spécifié",
            partner: metadata?.partner || false,
            score: finalScore,
            metadata,
          }
        })
      }
  
    const partnerMatches = processResults(partnerResults).sort((a, b) => b.score - a.score).slice(0, 4)
    const nonPartnerMatches = processResults(nonPartnerResults).sort((a, b) => b.score - a.score).slice(0, 2)
  
    const allMatches = [...partnerMatches, ...nonPartnerMatches]
    return allMatches.sort((a, b) => b.score - a.score)
    } catch (error) {
      console.error("Erreur lors de la recherche de formations:", error)
      return undefined
    }
  }
  