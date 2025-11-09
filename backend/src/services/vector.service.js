// Import the Pinecone library
const { Pinecone } = require("@pinecone-database/pinecone");

// Initialize a Pinecone client with your API key
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

// index --> jis mai hum vector ko store krte hain
const cohortChatGPTIndex = pc.index("cohort-chatgpt");

// vectors --> numbers
// metadata --> extra data (info)
async function createMemory({ vectors, metadata, messageId }) {
  await cohortChatGPTIndex.upsert([
    {
      id: messageId.toString(),
      values: vectors,
      metadata,
    },
  ]);
}


async function queryMemory({ queryVector, limit = 5, metadata }) {
  const data = await cohortChatGPTIndex.query({
    vector: queryVector,
    // topk --> closest points jo hain wo dedo.
    topK: limit,
    filter: metadata ?  metadata  : undefined,
    includeMetadata: true,
  });

  return data.matches;
}

module.exports = { createMemory, queryMemory };
