const { PrismaClient } = require('../lib/generated/prisma');
const { client, testConnection } = require('../app/utils/chroma.ts');
const { GeminiEmbeddingFunction } = require('../lib/gemini-embedding');
const fs = require("fs").promises;
const path = require("path");

const embedder = new GeminiEmbeddingFunction("AIzaSyD0phHq4PckAy8vLYlzkAnaHy4tdwT7rxA");
const prisma = new PrismaClient()

// Vérifier la connexion à ChromaDB


// Configuration ChromaDB


// const embedder = new OpenAIEmbeddingFunction({
//   openai_api_key: process.env.OPENAI_API_KEY,
// })

async function readJSONFile(filename: string) {
  
  try {
    const filePath = path.join(process.cwd(), "data", filename)
    const data = await fs.readFile(filePath, "utf8")
    return JSON.parse(data)
  } catch (error) {
    console.error(`Erreur lors de la lecture du fichier ${filename}:`, error)
    throw error
  }
}

// async function setupChromaCollections() {
//   let universitiesCollection, programsCollection

//   try {
//     // Essayer de récupérer les collections existantes
//     universitiesCollection = await client.getCollection({
//       name: "universities",
//       embeddingFunction: embedder,
//     })
//   } catch (error) {
//     // Créer la collection si elle n'existe pas
//     universitiesCollection = await client.createCollection({
//       name: "universities",
//       embeddingFunction: embedder,
//     })
//   }

//   try {
//     programsCollection = await client.getCollection({
//       name: "programs",
//       embeddingFunction: embedder,
//     })
//   } catch (error) {
//     programsCollection = await client.createCollection({
//       name: "programs",
//       embeddingFunction: embedder,
//     })
//   }

//   return { universitiesCollection, programsCollection }
// }

async function seedUniversities(universitiesData: Array<{ name: string; About?: any[]; Services?: any[]; StudentLife?: any[]; Reviews?: any[]; Programs?: any[]; statistics?: any[] }>) {
  console.log("🏫 Ajout des universités...")
  const universityMap = new Map()

  for (const universityData of universitiesData) {
    try {
      // Préparer les données pour Prisma
      const uni_exist = await prisma.university.findFirst({
        where: {
          name: universityData.name,
        },
      })
      if (!uni_exist) {
        
        // Préparer le texte pour l'embedding ChromaDB
        const aboutText = universityData.About?.map((item) => `${item.label}: ${item.value}`).join(". ") || ""
        const servicesText = universityData.Services?.map((item) => `${item.label}: ${item.value}`).join(". ") || ""
        const studentLifeText = universityData.StudentLife?.map((item) => `${item.label}: ${item.value}`).join(". ") || ""
        const reviewsText = universityData.Reviews?.map((item) => `${item.title}: ${item.content}`).join(". ") || ""
        const programsText = universityData.Programs?.map((item) => `${item.label}: ${item.value}`).join(". ") || ""
        const statisticsText = universityData.statistics?.map((item) => `${item.label}: ${item.value}`).join(". ") || ""

        const textForEmbedding = `
          Université: ${universityData.name}
          À propos: ${aboutText}
          Services: ${servicesText}
          Vie étudiante: ${studentLifeText}
          Avis: ${reviewsText}
          Programmes: ${programsText}
          Statistiques: ${statisticsText}
        `.trim()
        const embedding = await embedder.generate(textForEmbedding)

        const universityForDB = {
          name: universityData.name,
          about: JSON.stringify(universityData.About || []),
          services: JSON.stringify(universityData.Services || []),
          studentLife: JSON.stringify(universityData.StudentLife || []),
          reviews: JSON.stringify(universityData.Reviews || []),
          programs: JSON.stringify(universityData.Programs || []),
          statistics: JSON.stringify(universityData.statistics || []),
          embedding: embedding
        }

        // Insérer dans la base SQL
        const university = await prisma.university.create({
          data: universityForDB,
        })

        // Stocker le mapping nom -> ID pour les programmes
        universityMap.set(universityData.name, university.id)

        // Ajouter à ChromaDB
        // await universitiesCollection.add({
        //   ids: [`university_${university.id}`],
        //   documents: [textForEmbedding],
        //   metadatas: [
        //     {
        //       id: university.id,
        //       name: universityData.name,
        //       type: "university",
        //       created_at: new Date().toISOString(),
        //     },
        //   ],
        // })
        console.log(`✅ Université ajoutée: ${universityData.name} (ID: ${university.id})`)
    }
    } catch (error) {
      console.error(`❌ Erreur lors de l'ajout de l'université ${universityData.name}:`, error)
    }
  }

  return universityMap
}

async function seedPrograms(
  programsData: Array<{
    Title: string;
    About?: string;
    University: string;
    University_page?: string | null;
    statistics?: Array<{ label: string; value: string }>;
    Portal: string;
    Type?: string | null;
    Language?: string | null;
    scholarships?: Array<{ name: string; grant: string }>;
    Language_test?: Array<{ test: string; mark: string }>;
    Delivered?: string | null;
    Abilities?: Array<string | { item: string }>;
    Study_Description?: string | null;
    Programme_Structure?: Array<string | { item: string }>;
    General_Requirements?: Array<string | { item: string }>;
  }>,
  universityMap: Map<string, string>
) {
  console.log("📚 Ajout des programmes...")
  const urls={
    "https://www.bachelorsportal.com/search/bachelor": "bachelor",
    "https://www.mastersportal.com/search/master": "master",
    "https://www.phdportal.com/search/phd": "phd",
    "https://www.shortcoursesportal.com/search/course": "shortcourse"
}

  for (const programData of programsData) {
    try {
      // Trouver l'ID de l'université
      const universityId = universityMap.get(programData.University)

      if (!universityId) {
        console.warn(
          `⚠️  Université non trouvée pour le programme: ${programData.Title} (Université: ${programData.University})`,
        )
        continue
      }

      // Préparer les données pour Prisma
      

      // Préparer le texte pour l'embedding ChromaDB
      const statisticsText = programData.statistics?.map((stat) => `${stat.label}: ${stat.value}`).join(", ") || ""
      const scholarshipsText = programData.scholarships?.map((s) => `${s.name}: ${s.grant}`).join(", ") || ""
      const languageTestText = programData.Language_test?.map((t) => `${t.test}: ${t.mark}`).join(", ") || ""
      const abilitiesText = programData.Abilities?.map((a) => 
        typeof a === "object" && "item" in a ? a.item : a
      ).join(", ") || ""
      const structureText = programData.Programme_Structure?.map((s) => 
        typeof s === "object" && "item" in s ? s.item : s
      ).join(", ") || ""
      const requirementsText = programData.General_Requirements?.map((r) => 
        typeof r === "object" && "item" in r ? r.item : r
      ).join(", ") || ""

      const textForEmbedding = `
        Programme: ${programData.Title}
        Type: ${programData.Type}
        Université: ${programData.University}
        À propos: ${programData.About}
        Description des études: ${programData.Study_Description}
        Modalité: ${programData.Type || "online"}
        Langue: ${programData.Language}
        Mode de livraison: ${programData.Delivered}
        Tests de langue: ${languageTestText}
        Compétences: ${abilitiesText}
        Structure: ${structureText}
        Exigences: ${requirementsText}
        Statistiques: ${statisticsText}
      `.trim()
      
      const embedding=await embedder.generate(textForEmbedding)

      const programForDB = {
        title: programData.Title || "",
        about: programData.About || "",
        universityId: universityId,
        universityName: programData.University || "",
        universityPage: programData.University_page || null,
        statistics: JSON.stringify(programData.statistics || []),
        type: urls[programData.Portal as keyof typeof urls],
        modality: programData.Type || null,
        language: programData.Language || null,
        scholarships: JSON.stringify(programData.scholarships || []),
        languageTest: JSON.stringify(programData.Language_test || []),
        delivered: programData.Delivered || null,
        abilities: JSON.stringify(programData.Abilities || []),
        StudyDescription: programData.Study_Description || null,
        programmeStructure: JSON.stringify(programData.Programme_Structure || []),
        generalRequirements: JSON.stringify(programData.General_Requirements || []),
        partner: Math.random() < 0.5,
        embedding: embedding,
        
      }
      // Insérer dans la base SQL
      const program = await prisma.program.create({
        data: programForDB,
      })
      console.log(`✅ Programme ajouté: ${programData.Title} (ID: ${program.id})`)
    } catch (error) {
      console.error(`❌ Erreur lors de l'ajout du programme ${programData.Title}:`, error)
    }
  }
}



async function clearDatabase() {
  console.log("🗑️  Nettoyage de la base de données...")

  try {
    // Supprimer les programmes en premier (à cause des contraintes de clés étrangères)
    await prisma.program.deleteMany({})
    console.log("✅ Programmes supprimés")

    // Puis supprimer les universités
    await prisma.university.deleteMany({})
    console.log("✅ Universités supprimées")

    // Nettoyer ChromaDB
    // try {
    //   await client.deleteCollection({ name: "universities" })
    //   await client.deleteCollection({ name: "programs" })
    //   console.log("✅ Collections ChromaDB supprimées")
    // } catch (error) {
    //   console.log("ℹ️  Collections ChromaDB n'existaient pas ou erreur lors de la suppression")
    // }
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage:", error)
  }
}

async function main() {
  try {
    console.log("🚀 Début du processus de seed...")

    // Nettoyer la base de données
    await clearDatabase()

    // Lire les fichiers JSON
    console.log("📖 Lecture des fichiers JSON...")
    const universitiesData = await readJSONFile("university.json")
    const programsData = await readJSONFile("formations.json")

    console.log(`📊 ${universitiesData.length} universités et ${programsData.length} programmes à traiter`)

    // Configurer ChromaDB
    console.log("🔧 Configuration de ChromaDB...")
    // const { universitiesCollection, programsCollection } = await setupChromaCollections()

    // Ajouter les universités
    const universityMap = await seedUniversities(universitiesData)
    console.log(`🏫 ${universityMap.size} universités ajoutées avec succès`)

    // Ajouter les programmes
    await seedPrograms(programsData, universityMap)

    console.log("🎉 Processus de seed terminé avec succès!")

    // Statistiques finales
    const universityCount = await prisma.university.count()
    const programCount = await prisma.program.count()

    console.log(`📈 Statistiques finales:`)
    console.log(`   - Universités: ${universityCount}`)
    console.log(`   - Programmes: ${programCount}`)
  } catch (error) {
    console.error("💥 Erreur fatale:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
main()




      // Ajouter à ChromaDB
      // await programsCollection.add({
      //   ids: [`program_${program.id}`],
      //   documents: [textForEmbedding],
      //   metadatas: [
      //     {
      //       id: program.id,
      //       title: programData.Title,
      //       type: urls[programData.Portal as keyof typeof urls],
      //       university_id: universityId,
      //       university_name: programData.University,
      //       StudyDescription: programData.Study_Description || null,
      //       school_fees: programData.statistics?.find((s) => s.label === "Tuition fee")?.value ?? "Non spécifié",
      //       modality: programData.Type || null,
      //       duration: programData.statistics?.find((s) => s.label === "Duration")?.value ?? "Non spécifié",
      //       language: programData.Language,
      //       delivered: programData.Delivered,
      //       program_type: "program",
      //       partner: program.partner,
      //       created_at: new Date().toISOString(),
      //     },
      //   ],
      // })