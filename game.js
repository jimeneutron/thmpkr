// ======================
// Texas Hold'em Single Player
// ======================

let deck = [];
let playerHand = [];
let aiHand = [];
let communityCards = [];

let playerChips = 1000;
let aiChips = 1000;
let pot = 0;
let currentBet = 0;
let roundStage = "preflop"; // preflop, flop, turn, river, showdown

// ----------------------
// Deck Functions
// ----------------------
function createDeck() {
  const suits = ["♠", "♥", "♦", "♣"];
  const values = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
  deck = [];
  for (let s of suits) {
    for (let v of values) {
      deck.push(v + s);
    }
  }
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// ----------------------
// Deal Cards
// ----------------------
function dealHands() {
  playerHand = [deck.pop(), deck.pop()];
  aiHand = [deck.pop(), deck.pop()];
}

function dealFlop() {
  communityCards.push(deck.pop(), deck.pop(), deck.pop());
  roundStage = "flop";
}

function dealTurn() {
  communityCards.push(deck.pop());
  roundStage = "turn";
}

function dealRiver() {
  communityCards.push(deck.pop());
  roundStage = "river";
}

// ----------------------
// Betting & Player Action
// ----------------------
function playerAction(action) {
  if (action === "fold") {
    log("You folded. AI wins the pot.");
    aiChips += pot;
    resetHand();
    return;
  }
  if (action === "call") {
    let toCall = currentBet;
    if (playerChips >= toCall) {
      playerChips -= toCall;
      pot += toCall;
      log(`You called $${toCall}.`);
    }
    aiTurn();
  }
  if (action === "raise") {
    let raiseAmount = 50; // simple fixed raise
    if (playerChips >= currentBet + raiseAmount) {
      let total = currentBet + raiseAmount;
      playerChips -= total;
      pot += total;
      currentBet = total;
      log(`You raised to $${total}.`);
    }
    aiTurn();
  }
  updateUI();
}

// ----------------------
// Simple AI Behavior
// ----------------------
function aiTurn() {
  let decision = Math.random();
  if (decision < 0.3) {
    log("AI folds. You win the pot!");
    playerChips += pot;
    resetHand();
    return;
  } else if (decision < 0.7) {
    aiChips -= currentBet;
    pot += currentBet;
    log("AI calls.");
  } else {
    let raiseAmount = 50;
    aiChips -= currentBet + raiseAmount;
    pot += currentBet + raiseAmount;
    currentBet += raiseAmount;
    log("AI raises!");
  }

  nextStage();
  updateUI();
}

// ----------------------
// Game Progression
// ----------------------
function nextStage() {
  if (roundStage === "preflop") dealFlop();
  else if (roundStage === "flop") dealTurn();
  else if (roundStage === "turn") dealRiver();
  else if (roundStage === "river") showdown();
}

// ----------------------
// Hand Evaluator
// ----------------------
const HAND_RANKS = {
  "highcard": 1,
  "pair": 2,
  "twopair": 3,
  "three": 4,
  "straight": 5,
  "flush": 6,
  "fullhouse": 7,
  "four": 8,
  "straightflush": 9,
  "royalflush": 10
};

function cardValue(card) {
  let val = card.slice(0, -1);
  if (val === "J") return 11;
  if (val === "Q") return 12;
  if (val === "K") return 13;
  if (val === "A") return 14;
  return parseInt(val);
}

function cardSuit(card) {
  return card.slice(-1);
}

function evaluateHand(cards) {
  cards = cards.sort((a,b) => cardValue(b)-cardValue(a));
  const values = cards.map(cardValue);
  const suits = cards.map(cardSuit);

  const isFlush = suits.every(s => s === suits[0]);
  const isStraight = values.every((v,i) => i === 0 || v === values[i-1]-1);
  const counts = {};
  for (let v of values) counts[v] = (counts[v] || 0)+1;
  const countVals = Object.values(counts).sort((a,b)=>b-a);

  if (isFlush && isStraight && values[0] === 14) return {rank: HAND_RANKS.royalflush, high:14};
  if (isFlush && isStraight) return {rank: HAND_RANKS.straightflush, high: values[0]};
  if (countVals[0] === 4) return {rank: HAND_RANKS.four, high: values[0]};
  if (countVals[0] === 3 && countVals[1] === 2) return {rank: HAND_RANKS.fullhouse, high: values[0]};
  if (isFlush) return {rank: HAND_RANKS.flush, high: values[0]};
  if (isStraight) return {rank: HAND_RANKS.straight, high: values[0]};
  if (countVals[0] === 3) return {rank: HAND_RANKS.three, high: values[0]};
  if (countVals[0] === 2 && countVals[1] === 2) return {rank: HAND_RANKS.twopair, high: values[0]};
  if (countVals[0] === 2) return {rank: HAND_RANKS.pair, high: values[0]};
  return {rank: HAND_RANKS.highcard, high: values[0]};
}

function compareHands(playerCards, aiCards, community) {
  const playerBest = evaluateHand(playerCards.concat(community));
  const aiBest = evaluateHand(aiCards.concat(community));

  if (playerBest.rank > aiBest.rank) return "player";
  if (playerBest.rank < aiBest.rank) return "ai";
  if (playerBest.high > aiBest.high) return "player";
  if (playerBest.high < aiBest.high) return "ai";
  return "tie";
}

// ----------------------
// Showdown
// ----------------------
function showdown() {
  roundStage = "showdown";
  log("Showdown! Revealing hands...");

  const winner = compareHands(playerHand, aiHand, communityCards);

  if (winner === "player") {
    playerChips += pot;
    log(`You win the pot of $${pot}!`);
  } else if (winner === "ai") {
    aiChips += pot;
    log(`AI wins the pot of $${pot}.`);
  } else {
    let split = Math.floor(pot/2);
    playerChips += split;
    aiChips += split;
    log(`It's a tie! Pot split $${split} each.`);
  }
  resetHand();
}

// ----------------------
// Reset Hand
// ----------------------
function resetHand() {
  setTimeout(() => {
    pot = 0;
    currentBet = 0;
    communityCards = [];
    createDeck();
    shuffle(deck);
    dealHands();
    roundStage = "preflop";
    updateUI();
    log("New hand started!");
  }, 2000);
}

// ----------------------
// UI Functions
// ----------------------
function updateUI() {
  document.getElementById("players").innerHTML = `
    <div>Player ($${playerChips}): ${playerHand.map(c => cardHTML(c)).join("")}</div>
    <div>AI ($${aiChips}): ${roundStage==="showdown" ? aiHand.map(c=>cardHTML(c)).join("") : "🂠 🂠"}</div>
  `;
  document.getElementById("community-cards").innerHTML =
    communityCards.map(c => cardHTML(c)).join("");
  document.getElementById("log").innerHTML += `<br>Pot: $${pot}, Current Bet: $${currentBet}`;
}

function cardHTML(card) {
  return `<div class="card">${card}</div>`;
}

function log(msg) {
  document.getElementById("log").innerHTML += "<br>" + msg;
}

// ----------------------
// Start Game
// ----------------------
function startGame() {
  createDeck();
  shuffle(deck);
  dealHands();
  updateUI();
  log("New hand started!");
}

startGame();
