const { ChromaClient } = require("chromadb");

export const client = new ChromaClient({
  host: "https://chromadbchroma-production-ee35.up.railway.app",
  ssl: true,
});

// Ajoutez une fonction de test de connexion
export const testConnection = async () => {
  try {
    await client.heartbeat();
    console.log("✅ Connexion ChromaDB réussie");
    return true;
  } catch (error) {
    if (error instanceof Error) {
      console.error("❌ Erreur de connexion ChromaDB:", error.message);
    } else {
      console.error("❌ Erreur de connexion ChromaDB:", error);
    }
    return false;
  }
};

function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must be of same length')
  }
  return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0))
}
