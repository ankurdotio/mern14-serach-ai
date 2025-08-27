import { config } from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { tavily } from "@tavily/core"
import readLine from "readline"

config()

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
})

const tvly = tavily({
    apiKey: process.env.TAVILY_API_KEY
})


const searchWebTool = {
    name: "search_web",
    description: "Useful for when you need to answer questions about current events or the world",
    parameters: {
        type: Type.OBJECT,
        properties: {
            query: {
                type: Type.STRING,
                description: "The search query to find relevant information."
            }
        },
        required: [ 'query' ],
    }
}

const tools = {
    "search_web": async ({ query }) => {
        const response = await tvly.search(query)

        return response.results
    }
}

// Create an interface for input and output
const rl = readLine.createInterface({
    input: process.stdin,
    output: process.stdout
});

const history = []

while (true) {

    history.map(el => console.log)

    if (history[ history.length - 1 ]?.role !== "user") {
        const message = await new Promise(resolve => rl.question("user : ", resolve))
        history.push({ role: "user", parts: [ { text: message } ] })
    }

    const aiResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: history,
        config: {
            tools: [ { functionDeclarations: [ searchWebTool ] } ],
            systemInstruction: `
            you can use tools to get more information.
            `
        }
    })



    if (aiResponse.functionCalls && aiResponse.functionCalls[ 0 ]) {

        const result = await tools[ aiResponse.functionCalls[ 0 ].name ](aiResponse.functionCalls[ 0 ].args)

        const content = result.map(r => r.content).join("\n")

        history.push({
            role: "user",
            parts: [ {
                text: `
                I searched the web for "${aiResponse.functionCalls[ 0 ].args.query}" and found the following information:
                ${content}
                `
            } ]
        })

    } else {
        history.push({ role: "model", parts: [ { text: aiResponse.text } ] })
        console.log("AI: ", aiResponse.text)
    }

}
