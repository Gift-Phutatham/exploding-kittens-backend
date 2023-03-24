import Player from '../player/player';
import Deck from '../cards/models/deck';
import card from '../cards/models/card';
import Card from '../cards/models/card-base';
/**
 * Represents a game of Exploding Kittens.
 */
class Game {
  players: Player[];
  deck: Deck;
  discardPile: Card[];
  turn: number;
  // phase: Array<string>;
  // currentPhase: string;
  numberOfPlayers: number;
  currentPlayerIndex: number;
  currentPlayer: Player;
  diedPlayer: Player[];
  attackStack: number;
  lastPlayedCard: any;

  /**
   * Create a new game with the specified players.
   * @param {string[]} playerNames - The names of the players.
   */
  constructor(playerNames: any) {
    this.players = playerNames.map((name: string) => new Player(name));
    this.deck = new Deck();
    this.discardPile = [];
    this.turn = 0;
    this.numberOfPlayers = this.players.length;
    this.currentPlayerIndex = Math.floor(Math.random() * 4); // random number 0-3 at the beginning of the game
    this.currentPlayer = this.players[this.currentPlayerIndex]; // current player
    this.diedPlayer = [];
    this.attackStack = 0;
    this.lastPlayedCard = null;
  }

  getPlayers() {
    return this.players;
  }

  /**
   * Add to Died Player
   */
  AddDeadPlayer(player: Player) {
    this.diedPlayer.push(player);
  }

  /**
   * Deal cards to each player.
   */
  dealCards() {
    this.players.forEach((player) => {
      for (let i = 0; i < 4; i++) {
        player.addCardToHand(this.deck.draw());
      }
    });
  }

  /**
   * Draw cards for the current player.
   */
  drawCards() {
    const drawCount = this.attackStack > 0 ? this.attackStack + 1 : 1;
    for (let i = 0; i < drawCount; i++) {
      const drawnCard = this.deck.draw();
      if (drawnCard instanceof card.ExplodingKittenCard) {
        const defuseIndex = this.currentPlayer.hasDefuseCard();
        if (defuseIndex >= 0) {
          // Use the Defuse card
          this.currentPlayer.hand.splice(defuseIndex, 1);
          this.discardPile.push(new card.DefuseCard());
          this.deck.addcards(new card.ExplodingKittenCard(), 1);
          this.deck.shuffle();
          // Notify the player to place the Exploding Kitten back into the deck
        } else {
          // The player does not have a Defuse card and is eliminated
          this.AddDeadPlayer(this.currentPlayer);
          this.players.splice(this.players.indexOf(this.currentPlayer), 1);
          this.numberOfPlayers--;
        }
      } else {
        this.currentPlayer.addCardToHand(drawnCard);
      }
    }
    this.attackStack = 0;
  }

  /**
   * Add exploding Kitten to the deck, then shuffle the deck.
   */
  addExplodingKittenCard() {
    this.deck.generateBombedCat();
    this.deck.shuffle();
  }
  /**
   * Give each player 1 Defuse Card.
   */
  givePlayerDefuseCard() {
    this.players.forEach((player) => {
      player.addCardToHand(new card.DefuseCard());
    });
  }

  /**
   * Play cards
   */
  async playCard(player: Player, cardIndex: number, requestPlayNopeCallback: (player: Player) => Promise<boolean>) {
    const playcard = player.getCardbyIndex(cardIndex);
    this.discardPile.push(playcard);
    player.hand.splice(cardIndex, 1);
    this.lastPlayedCard = playcard;

    // Check if the next player wants to play a Nope card
    const nopeCardPlayed = await this.waitForNope(requestPlayNopeCallback);


    if (nopeCardPlayed) {
      return;
    }
    //Activate card effect

    //Shuffle Card effect
    if (playcard instanceof card.ShuffleCard) {
      this.useShuffle();
    }
    //See the future Card effect
    else if (playcard instanceof card.SeeTheFutureCard) {
      this.useSeeTheFutureCard();
    }
    //Attack Card effect
    else if (playcard instanceof card.AttackCard) {
      this.useAttackCard();
    }
    //Skip Card effect
    else if (playcard instanceof card.SkipCard) {
      this.useSkipCard();
    }
    //Favor Card effect
    else if (playcard instanceof card.FavorCard) {
      const targetPlayer = this.choosePlayer(player);
      this.useFavorCard(targetPlayer);
    }
  }

  /**
   * Wait for a Nope card to be played, allowing players to play a Nope card in response to an action.
   * @param {number} nopeCount - The number of consecutive Nope cards played so far.
   * @returns {Promise<boolean>} A promise that resolves to true if the original action is canceled, or false if it's not.
   */
  async waitForNope(requestPlayNope: (player: Player) => Promise<boolean>, nopeCount = 0): Promise<boolean> {
    let nopePlayed = false;
    const timeout = new Promise((resolve) => setTimeout(resolve, 5000));

    for (const player of this.players) {
      // Check if the player has a Nope card and if it's not their first turn to play a Nope card (to prevent double nope by the current player)
      if (player.hasNopeCard() >= 0 && !(player === this.currentPlayer && nopeCount === 0)) {
        const response = await Promise.race([requestPlayNope(player), timeout]);
        let nopeCardIndex = player.hasNopeCard();
        if (response) {
          nopePlayed = true;
          nopeCount++;
          this.playNopeCard(player, nopeCardIndex);
          break;
        }
      }
    }
      

    if (nopePlayed) {
      // Wait for another Nope card in response to the current Nope card
      const nopeCanceled = await this.waitForNope(requestPlayNope,nopeCount);
      // If nopeCanceled is true, it means an even number of Nopes were played, so the original action is not canceled
      return !nopeCanceled;
    } else {
      // If nopePlayed is false, it means there were no more Nopes played
      // If nopeCount is odd, the original action is canceled
      return nopeCount % 2 === 1;
    }
  }

  /**
   * Play a Nope card.
   */
  playNopeCard(player: Player, cardIndex: number) {
    const nopeCard = player.getCardbyIndex(cardIndex);
    this.discardPile.push(nopeCard);
    player.hand.splice(cardIndex, 1);
    this.lastPlayedCard = nopeCard;
  }

  /**
   * Choose a player for favor or other targetable effects.
   */
  choosePlayer(targetPlayer: Player) {
    return targetPlayer;
  }

  /**
   * Use Shuffle card effect.
   */
  useShuffle() {
    this.deck.shuffle();
  }

  /**
   * Use See the future card effect.
   */
  useSeeTheFutureCard() {
    this.deck.peek(3);
  }

  /**
   * Use Skip card effect.
   */
  useSkipCard() {
    this.nextTurn();
  }

  /**
   * Use Attack card effect.
   */
  useAttackCard() {
    this.attackStack++;
  }

  /**
   * Use Favor card effect.
   */
  useFavorCard(targetPlayer: Player) {
    const chosenCard = targetPlayer.giveRandomCard(); // Add a method to Player class to give a random card
    this.currentPlayer.addCardToHand(chosenCard);
  }

  async useNumberCard(player: Player, cardIndices: number[]) {
    // Check if the player has a pair of NumberCards with the same rank
    if (cardIndices.length === 2) {
      const card1 = player.getCardbyIndex(cardIndices[0]);
      const card2 = player.getCardbyIndex(cardIndices[1]);
  
      if (
        card1 instanceof card.NumberCard &&
        card2 instanceof card.NumberCard &&
        card1.rank === card2.rank
      ) {
        // Discard the pair of cards
        this.discardPile.push(card1, card2);
        player.hand.splice(cardIndices[1], 1);
        player.hand.splice(cardIndices[0], 1);
  
        // Choose a target player
        const targetPlayer = this.choosePlayer(player);
  
        // Use the pair effect (steal a random card from the target player)
        const stolenCard = targetPlayer.giveRandomCard();
        player.addCardToHand(stolenCard);
      }
    }
  }
  

  async requestCardFromPlayer(requestCardFromPlayerCallback: (targetPlayer: Player) => Promise<number>, player: Player, targetPlayer: Player) {
    const cardIndex = await requestCardFromPlayerCallback(targetPlayer);
  
    if (cardIndex >= 0) {
      // Take the chosen card from the target player's hand
      const stolenCard = targetPlayer.hand.splice(cardIndex, 1)[0];
      player.addCardToHand(stolenCard);
    } else {
      // If the target player doesn't have any cards, nothing happens
    }
  }
  


  /**
   * Move on to the next turn.
   */
  nextTurn() {
    const currentIndex = this.players.indexOf(this.currentPlayer);
    const nextPlayerIndex = (currentIndex + 1) % this.players.length;
    this.currentPlayer = this.players[nextPlayerIndex];
    this.turn++;
  }