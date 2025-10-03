let deck = [];
let playerHand = [];
let aiHand = [];
let communityCards = [];

// Generate deck
function createDeck() {
  const suits = ["♠", "♥", "♦", "♣"];
  const values = [
    "2","3","4","5","6","7","8","9","10","J","Q","K","A"
  ];
  deck = [];
  for (let s of suits) {
    for (let v of values) {
      deck.push(v + s);
    }
  }
}

// Shuffle deck
function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Deal initial cards
function dealHands() {
  playerHand = [deck.pop(), deck.pop()];
  aiHand = [deck.pop(), deck.pop()];
}

// Deal community cards
function dealFlop() {
  communityCards.push(deck.pop(), deck.pop(), deck.pop());
}
function dealTurn() {
  communityCards.push(deck.pop());
}
function dealRiver() {
  communityCards.push(deck.pop());
}

// Render cards
function render() {
  document.getElementById("players").innerHTML = `
    <div>Player: ${playerHand.map(c => cardHTML(c)).join("")}</div>
    <div>AI: ${aiHand.map(c => "🂠").join("")}</div>
  `;
  document.getElementById("community-cards").innerHTML =
    communityCards.map(c => cardHTML(c)).join("");
}

function cardHTML(card) {
  return `<div class="card">${card}</div>`;
}

// Game flow
function startGame() {
  createDeck();
  shuffle(deck);
  dealHands();
  dealFlop();
  render();
}

function playerAction(action) {
  document.getElementById("log").innerText = `You chose: ${action}`;
}

// Start game
startGame();
