const topics = [
  "General question",
  "Project feedback",
  "Destination suggestion",
  "Something else",
];
const emailPattern = /^[a-z0-9!#$%&'*+/=?^_\x60{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_\x60{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

function validateContact(input) {
  const read = (key) => typeof input?.[key] === "string" ? input[key].trim() : "";
  const values = { name: read("name"), email: read("email").toLowerCase(), topic: read("topic"), message: read("message") };
  const errors = {};
  if (!values.name || values.name.length > 100 || /[\r\n]/.test(values.name)) {
    errors.name = "Enter a name of 1–100 characters on one line.";
  }
  if (values.email.length > 254 || values.email.split("@")[0].length > 64 || !emailPattern.test(values.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!topics.includes(values.topic)) errors.topic = "Choose a topic.";
  if (values.message.length < 10 || values.message.length > 2000 || values.message.includes("\0")) {
    errors.message = "Enter a message of 10–2,000 characters.";
  }
  if (values.name.includes("\0")) errors.name = "Enter a valid name.";
  return { values, errors };
}

module.exports = { topics, validateContact };
