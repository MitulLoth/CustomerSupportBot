require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { getOrderById, getAllOrders, formatOrderInfo } = require("./dataService");
const { extractQueryDetails } = require("./nlpService");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;
const HF_API_KEY = process.env.HF_API_KEY;
const MODEL_NAME = "google/flan-t5-large";  // Better for conversational AI

app.post("/api/ask", async (req, res) => {
  const { question } = req.body;

  if (!question || typeof question !== "string") {
    return res.status(400).json({ 
      error: "Please provide a valid question.",
      status: "error" 
    });
  }

  try {
    // Extract query details using NLP
    const queryDetails = await extractQueryDetails(question);
    
    
    if (!queryDetails) {
      return res.json({ 
        answer: "I'm having trouble understanding your request. Could you please rephrase it?",
        status: "unclear_query"
      });
    }

    // Handle general queries without order specifics
    if (queryDetails.intent === "general_query" && 
        !queryDetails.orderId && 
        !queryDetails.userId && 
        !queryDetails.userName) {
      const generalPrompt = `
        You are a helpful customer service AI. Answer this general question:
        "${question}"
        
        Base your answer on these facts:
        - We accept returns within 30 days
        - Standard shipping takes 5-7 days
        - Express shipping takes 1-2 days
        - Order status can be checked using order ID
        - Customer support is available 24/7
      `;

      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${MODEL_NAME}`,
        { inputs: generalPrompt },
        {
          headers: {
            Authorization: `Bearer ${HF_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      return res.json({ 
        answer: response.data[0]?.generated_text?.trim(),
        status: "general_response"
      });
    }

    // Search for matching orders
    const orders = getAllOrders();
    const matchedOrders = orders.filter(order => {
        console.log(order.orderId , queryDetails.orderId);
        
      const orderMatch = queryDetails.orderId && order.orderId == queryDetails.orderId;
      const userIdMatch = queryDetails.userId && order.userId == queryDetails.userId;
      const userNameMatch = queryDetails.userName && 
                          order.userName.toLowerCase().includes(queryDetails.userName.toLowerCase());
      const amountMatch = queryDetails.totalAmount && 
                         order.totalAmount == parseInt(queryDetails.totalAmount);

        console.log(orderMatch , userIdMatch , userNameMatch , amountMatch);
        
      
      return orderMatch || userIdMatch || userNameMatch || amountMatch;
    });

    if (matchedOrders.length === 0) {
      return res.json({ 
        answer: "I couldn't find any orders matching your description. Could you please provide more details or verify the information?",
        status: "no_match"
      });
    }

    // Build context from matched orders
    const orderDetails = matchedOrders.map(order => formatOrderInfo(order)).join("\n\n");

    const finalPrompt = `Context: ${orderDetails}
Question: ${question}
Intent: ${queryDetails.intent}

Provide a direct answer about the order details, focusing only on the information requested.`;

    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${MODEL_NAME}`,
      {
        inputs: finalPrompt,
        parameters: {
          max_length: 200,
          temperature: 0.7,
          top_p: 0.9,
          do_sample: true,
        }
      },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({ 
      answer: response.data[0]?.generated_text?.trim(),
      status: "success",
      matchedOrders: matchedOrders.length
    });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ 
      error: "Sorry, I encountered an error while processing your request. Please try again.",
      status: "error"
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
