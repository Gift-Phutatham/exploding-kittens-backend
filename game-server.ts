import { Socket } from 'socket.io';
import Game from './src/game/game';
import Player from './src/player/player';
class GameServer {
  game: Game;
  actionCallBack: (roomID: string, player: string) => Promise<any>;
  playNopeCallBack: (roomID: string, player: string) => Promise<any>;
  requestCardCallBack: (roomID: string, player: string) => Promise<any>;
  io: any;
  roomNumber: string;

  constructor(
    playerNames: string[],
    io: any,
    room: string,
    actionCallBack: (roomID: string, player: string) => Promise<any>,
    playNopeCallBack: (roomID: string, player: string) => Promise<any>,
    requestCardCallBack: (roomID: string, player: string) => Promise<any>,
  ) {
    this.game = new Game(playerNames);
    this.io = io;
    this.actionCallBack = actionCallBack;
    this.playNopeCallBack = playNopeCallBack;
    this.requestCardCallBack = requestCardCallBack;
    this.roomNumber = room;
    this.initialize();
  }

  // Function for Testing (need to remove after production)
  async testFunc() {
    return new Promise((resolve) => setTimeout(resolve, 6000));
  }

  initialize() {
    this.game.dealCards();
    this.game.addExplodingKittenCard();
    this.game.givePlayerDefuseCard();
  }

  // TODO: haven't done -/-'
  updateState() {
    // const outgoingMessage = {
    //   name: "game",
    //   message: JSON.stringify(this.game.getCurrentState()),
    // };
    // this.io.to(this.roomNumber).emit('message', outgoingMessage)

    this.io.to(this.roomNumber).emit('game state', this.game.getCurrentState());
  }

  /**
   * Starts the game loop and manages the game state.
   */
  async startGameLoop() {
    var effect; // card effect
    while (this.game.diedPlayer.length < 3) {
      const currentPlayer = this.game.currentPlayer;
      this.updateState(); // update the state through SocketIO
      console.log('===================');
      console.log(`It's ${currentPlayer.name}'s turn.`);
      for (let i = 0; i < currentPlayer.hand.length; i++) {
        console.log(`${currentPlayer.hand[i].getName()}`);
      }
      console.log('===================');
      // Give player 5 seconds to play an action card
      const cardIndex = await this.waitForPlayerAction(currentPlayer.name);

      if (cardIndex !== null) {
        effect = await this.game.playCard(
          currentPlayer,
          cardIndex,
          this.requestPlayNope.bind(this),
          this.requestFromNumberCard.bind(this),
        );
      }
      if (effect !== true){
      this.game.drawCards();
      this.game.nextTurn();
      }

      effect = false;
    }

    // Announce the winner
    console.log(`The game is over. ${this.game.currentPlayer.name} wins!`);
  }

  async waitForPlayerAction(player: string): Promise<number | null> {
    // Implement logic to wait for a player to play an action card within a given time
    // If the player plays a card within the time limit, return the card index
    // If not, return null

    const timeout = new Promise((resolve) => setTimeout(resolve, 5000));

    const response: number | null | undefined = await Promise.race([
      this.actionCallBack(this.roomNumber, player),
      timeout,
    ]);
    if (response != null) {
      return response;
    }
    return null;
  }

  async requestPlayNope(player: Player): Promise<boolean> {
    // Implement logic to request a player to play a Nope card
    // Return true if the player chooses to play a Nope card, false otherwise

    const timeout = new Promise((resolve) => setTimeout(resolve, 5000));

    const response: boolean | null | undefined = await Promise.race([
      this.playNopeCallBack(this.roomNumber, player.name),
      timeout,
    ]);
    if (response) {
      return response;
    }
    return false;
  }

  async requestFromNumberCard(player: Player): Promise<number> {
    // Implement logic to request a player to request a card
    // Return index of the card player chosen from target player if available

    const timeout = new Promise((resolve) => setTimeout(resolve, 5000));

    const response: number | null | undefined = await Promise.race([
      this.requestCardCallBack(this.roomNumber, player.name),
      timeout,
    ]);
    if (response != null) {
      return response;
    }
    return -1;
  }
}

export default GameServer;
