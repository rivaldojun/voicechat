const { ChromaClient } = require("chromadb");

export const client = new ChromaClient({
  host: "https://chroma-latest-htcj.onrender.com"
});

// Ajoutez une fonction de test de connexion
export const testConnection = async () => {
  try {
    await client.heartbeat();
    console.log("✅ Connexion ChromaDB réussie");
    return true;
  } catch (error) {
    console.error("❌ Erreur de connexion ChromaDB:", error.message);
    return false;
  }
};