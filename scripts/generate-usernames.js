const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');

function generateUniqueUsername() {
  return uniqueNamesGenerator({
    dictionaries: [colors, animals],
    separator: '_',
    length: 2,
  }) + Math.floor(1000 + Math.random() * 9000);
}

for (let i = 0; i < 20; i++) {
  console.log(generateUniqueUsername());
}