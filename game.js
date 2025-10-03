import { ref, set, onValue, update, push, get, child, runTransaction } from "./index.html"; // Exposed globally

let deck = [];
let playerHand = [];
let opponentHand = [];
let communityCards = [];
let pot = 0;
let currentBet = 0;
let roundStage = "preflop";
let playerId = null;
let roomId = null;

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
}

// ----------------------
// Initialize Room
// ----------------------
function joinRoom() {
  playerId = "player" + Math.floor(Math.random() * 1000); // simple unique id
  roomId = "room1"; // static room for simplicity

  const roomRef = ref(db, `rooms/${roomId}`);
  onValue(roomRef, snapshot => {
    const data = snapshot.val();
    if (!data) return;

    if(data.players) {
      playerHand = data.players[playerId] ? data.players[playerId].hand : playerHand;
      opponentHand = data.players[Object.keys(data.players).filter(id=>id!==playerId)[0]]?.hand || opponentHand;
      communityCards = data.communityCards || [];
      pot = data.pot || 0;
      currentBet = data.currentBet || 0;
      roundStage = data.roundStage || "preflop";
      updateUI();
    }
  });

  set(ref(db, `rooms/${roomId}/players/${playerId}`), { hand: [], chips: 1000, bet: 0 });
}

// ----------------------
// Deal & Update Firebase
// ----------------------
function dealHands() {
  createDeck();
  shuffle(deck);

  playerHand = [deck.pop(), deck.pop()];
  opponentHand = [deck.pop(), deck.pop()];

  set(ref(db, `rooms/${roomId}/players/${playerId}/hand`), playerHand);
  set(ref(db, `rooms/${roomId}/players/${Object.keys({playerId})[0]}/hand`), opponentHand);
}

// ----------------------
// Player Actions
// ----------------------
function playerAction(action) {
  const playerRef = ref(db, `rooms/${roomId}/players/${playerId}`);
  if(action === "fold") {
    update(playerRef, { folded: true });
    log("You folded.");
  } else if(action === "call") {
    runTransaction(playerRef, p => {
      if(!p) return;
      const betAmount = currentBet;
      p.chips -= betAmount;
      p.bet = betAmount;
      return p;
    });
  } else if(action === "raise") {
    runTransaction(playerRef, p => {
      if(!p) return;
      const betAmount = currentBet + 50;
      p.chips -= betAmount;
      p.bet = betAmount;
      return p;
    });
  }
}

// ----------------------
// UI Updates
// ----------------------
function updateUI() {
  document.getElementById("player").innerHTML = `You: ${playerHand.map(c=>cardHTML(c)).join("")} <br> Chips: ???`;
  document.getElementById("opponent").innerHTML = `Opponent: ${opponentHand.map(c=>c?'🂠':'🂠').join("")} <br> Chips: ???`;
  document.getElementById("community-cards").innerHTML = communityCards.map(c=>cardHTML(c)).join("");
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
joinRoom();
dealHands();
updateUI();
