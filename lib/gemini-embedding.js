// gemini-embedding.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiEmbeddingFunction {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "text-embedding-004" });
  }

  async generate(text) {
    try {
        const result = await this.model.embedContent(text);
      
      return result.embedding.values;
    } catch (error) {
      console.error('Erreur lors de la génération des embeddings Gemini:', error);
      throw error;
    }
  }
}

module.exports = { GeminiEmbeddingFunction };