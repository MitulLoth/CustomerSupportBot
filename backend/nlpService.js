const axios = require("axios");
const HF_API_KEY = process.env.HF_API_KEY;
const MODEL_NAME = "microsoft/DialoGPT-large"; // Match the model with server.js

async function extractQueryDetails(question) {
  // Create a more focused prompt for the AI
  const prompt = `
Human: Extract order information from this customer query: "${question}"
Assistant: Let me analyze the query and extract the key information.

Rules:
1. Extract exact order ID if mentioned (format: alphanumeric)
2. Extract user name if mentioned
3. Extract user ID if mentioned
4. Extract amount if mentioned
5. Determine the primary intent

Here's what I found:
{
  "intent": "${determineIntent(question)}",
  "orderId": ${extractOrderId(question)},
  "userId": ${extractUserId(question)},
  "userName": ${extractName(question)},
  "totalAmount": ${extractAmount(question)},
  "keywords": ${JSON.stringify(extractKeywords(question))}
}`;

  try {
    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${MODEL_NAME}`,
      {
        inputs: prompt,
        parameters: {
          max_length: 200,
          temperature: 0.3, // Lower temperature for more focused extraction
          top_p: 0.9,
          do_sample: true
        }
      },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Extract and validate the JSON response
    let result = extractJsonFromResponse(response.data[0]?.generated_text);
    
    // Fallback to regex extraction if AI fails
    if (!result) {
      result = {
        intent: determineIntent(question),
        orderId: extractOrderId(question),
        userId: extractUserId(question),
        userName: extractName(question),
        totalAmount: extractAmount(question),
        keywords: extractKeywords(question)
      };
    }

    return result;
  } catch (err) {
    console.error("NLP Service Error:", err);
    // Fallback to regex extraction on error
    return {
      intent: determineIntent(question),
      orderId: extractOrderId(question),
      userId: extractUserId(question),
      userName: extractName(question),
      totalAmount: extractAmount(question),
      keywords: extractKeywords(question)
    };
  }
}

// Helper functions for extraction
function determineIntent(question) {
  const q = question.toLowerCase();
  if (q.includes('track') || q.includes('where') || q.includes('delivery')) return 'tracking_info';
  if (q.includes('return') || q.includes('refund')) return 'return_info';
  if (q.includes('status')) return 'order_status';
  if (q.includes('order') && (q.includes('details') || q.includes('summary'))) return 'order_summary';
  return 'general_query';
}

function extractOrderId(question) {
  const match = question.match(/order(?:\s+(?:id|number|#))?\s*[:#]?\s*(\w+)/i);
  return match ? `${match[1]}` : null;
}

function extractUserId(question) {
  const match = question.match(/user(?:\s+(?:id|number))?\s*[:#]?\s*(\w+)/i);
  return match ? `${match[1]}` : null;
}

function extractName(question) {
  const match = question.match(/(?:my name is|this is|i am|i'm)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i);
  return match ? `${match[1]}` : null;
}

function extractAmount(question) {
  const match = question.match(/(?:amount|total|price|cost)\s*[:#]?\s*[$]?\s*(\d+(?:\.\d{2})?)/i);
  return match ? `${match[1]}` : null;
}

function extractKeywords(question) {
  const keywords = question.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => 
      ['order', 'track', 'status', 'return', 'shipping', 'delivery', 'cancel', 'refund']
      .includes(word)
    );
  return keywords;
}

function extractJsonFromResponse(text) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        intent: parsed.intent || 'general_query',
        orderId: parsed.orderId || null,
        userId: parsed.userId || null,
        userName: parsed.userName || null,
        totalAmount: parsed.totalAmount || null,
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : []
      };
    }
    return null;
  } catch {
    return null;
  }
}

module.exports = { extractQueryDetails };
