
const form = document.getElementById("messageForm");
const messagesContainer = document.getElementById("messages");
const statusText = document.getElementById("status");
const submitButton = document.getElementById("submitButton");

function createMessageCard(message) {
  const card = document.createElement("div");
  card.className = "message-card";

  const heading = document.createElement("h3");
  heading.textContent = message.name;

  const content = document.createElement("p");
  content.textContent = message.message;

  const date = document.createElement("small");
  date.className = "message-date";
  date.textContent = new Date(message.createdAt).toLocaleString();

  card.append(heading, content, date);
  return card;
}

function displayMessages(messages) {
  messagesContainer.replaceChildren();

  if (messages.length === 0) {
    statusText.textContent = "No messages yet. Add your first message!";
    return;
  }

  statusText.textContent = "";

  messages.forEach((message) => {
    messagesContainer.appendChild(createMessageCard(message));
  });
}

async function loadMessages() {
  statusText.textContent = "Loading messages...";

  try {
    const response = await fetch("/messages");

    if (!response.ok) {
      throw new Error("Could not load messages");
    }

    const messages = await response.json();
    displayMessages(messages);
  } catch (error) {
    console.error(error);
    statusText.textContent = "Failed to load messages. Please refresh.";
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!name || !message) {
    statusText.textContent = "Please enter both fields.";
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Saving...";

  try {
    const response = await fetch("/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, message }),
    });

    const savedMessage = await response.json();

    if (!response.ok) {
      throw new Error(savedMessage.error || "Could not save message");
    }

    // Display the newest message at the top
    messagesContainer.prepend(createMessageCard(savedMessage));
    statusText.textContent = "";

    form.reset();
  } catch (error) {
    console.error(error);
    statusText.textContent = error.message;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit";
  }
});

loadMessages();
