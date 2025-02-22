import OpenAI from "openai";
const openai = new OpenAI(api_key=OPENAI_API_KEY, base_url="https://generativelanguage.googleapis.com/v1beta/openai/");

document.addEventListener("DOMContentLoaded", () => {
  const inputField = document.getElementById("input");
  inputField.addEventListener("keydown", (e) => {
    if (e.code === "Enter") {
      let input = inputField.value;
      inputField.value = "";
      output(input);
    }
  });
});

async function output(input) {
  // Clean up input similar to before
  let text = input.toLowerCase().replace(/[^\w\s]/gi, "").trim();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "developer",
          content: "You are a friendly and helpful chatbot assistant. Keep responses concise and engaging."
        },
        {
          role: "user",
          content: text
        }
      ],
      store: true,
    });

    const response = completion.choices[0].message.content;
    addChat(input, response);
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    addChat(input, "Sorry, I'm having trouble connecting right now.");
  }
}

function addChat(input, product) {
  const messagesContainer = document.getElementById("messages");

  let userDiv = document.createElement("div");
  userDiv.id = "user";
  userDiv.className = "user response";
  userDiv.innerHTML = `<img src="user.png" class="avatar"><span>${input}</span>`;
  messagesContainer.appendChild(userDiv);

  let botDiv = document.createElement("div");
  let botImg = document.createElement("img");
  let botText = document.createElement("span");
  botDiv.id = "bot";
  botImg.src = "bot-mini.png";
  botImg.className = "avatar";
  botDiv.className = "bot response";
  botText.innerText = "Typing...";
  botDiv.appendChild(botText);
  botDiv.appendChild(botImg);
  messagesContainer.appendChild(botDiv);
  // Keep messages at most recent
  messagesContainer.scrollTop = messagesContainer.scrollHeight - messagesContainer.clientHeight;

  // Fake delay to seem "real"
  setTimeout(() => {
    botText.innerText = `${product}`;
    textToSpeech(product)
  }, 2000
  )

}