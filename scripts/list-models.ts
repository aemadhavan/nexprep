import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_STUDIO_KEY || "");

async function listModels() {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_AI_STUDIO_KEY}`
        );
        const data = await response.json() as { models?: { name: string; displayName: string }[] };
        console.log("Available Models:");
        data.models?.forEach(m => console.log(`- ${m.name} (${m.displayName})`));
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
