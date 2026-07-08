// ai.js
// Include this in any HTML page that needs AI:
// <script src="js/ai.js"></script>
//
// Then call: const reply = await askAI("your prompt here");
// It sends the prompt to server.js which forwards it to Gemini.

async function askAI(prompt) {
  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "AI request failed.");
    return data.text;
  } catch (err) {
    console.error(err);
    return "Sorry, the AI assistant is unavailable right now. Make sure the server is running with npm start.";
  }
}
