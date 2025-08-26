import { GoogleGenAI, Type } from "@google/genai";
import { tavily } from "@tavily/core"

const ai = new GoogleGenAI({
    apiKey: ""
})

const tvly = tavily({
    apiKey: ""
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
        console.log(response)
    }
}

ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: "what is the stock price of google today ?",
    config: {
        tools: [ {
            functionDeclarations: [ searchWebTool ]
        } ]
    }
})
    .then(response => {
        response.functionCalls.map(async (call) => {
            const result = await tools[ call.name ](call.args)
            console.log(result)

        })

    })

