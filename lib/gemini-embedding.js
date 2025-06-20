// gemini-embedding.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiEmbeddingFunction {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "text-embedding-004" });
  }

  async generate(texts) {
    try {
      const embeddings = [];
      
      for (const text of texts) {
        const result = await this.model.embedContent(text);
        embeddings.push(result.embedding.values);
      }
      
      return embeddings;
    } catch (error) {
      console.error('Erreur lors de la génération des embeddings Gemini:', error);
      throw error;
    }
  }
}

module.exports = { GeminiEmbeddingFunction };