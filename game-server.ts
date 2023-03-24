import Game from './src/game/game';
import Player from './src/player/player';
class GameServer {

    game: Game;
    actionCallBack: Promise<number | null>;
    playNopeCallBack: Promise<boolean>;

    constructor(playerNames: string[]) {
        this.game = new Game(playerNames);
        this.initialize();
    }

    initialize() {
        this.game.dealCards();
        this.game.addExplodingKittenCard();
        this.game.givePlayerDefuseCard();
    }

    /**
     * Starts the game loop and manages the game state.
     */
    async startGameLoop() {

        while (this.game.diedPlayer.length < 3) {
            const currentPlayer = this.game.currentPlayer;
            console.log(`It's ${currentPlayer.name}'s turn.`);

            // Give player 5 seconds to play an action card
            const cardIndex = await this.waitForPlayerAction();

            if (cardIndex !== null) {
                await this.game.playCard(currentPlayer, cardIndex, this.requestPlayNope);
            } else {
                this.game.drawCards();
                this.game.nextTurn();
            }
        }

        // Announce the winner
        console.log(`The game is over. ${this.game.currentPlayer.name} wins!`);
    }

    async waitForPlayerAction(): Promise<number | null> {
        // Implement logic to wait for a player to play an action card within a given time
        // If the player plays a card within the time limit, return the card index
        // If not, return null

        const timeout: Promise<undefined> = new Promise((resolve) => setTimeout(resolve, 5000));

        const response: number | null | undefined = await Promise.race([this.actionCallBack, timeout]);
        if (response) {
            return response;
        }
        return null;
    }

    async requestPlayNope(player: Player): Promise<boolean> {
        // Implement logic to request a player to play a Nope card
        // Return true if the player chooses to play a Nope card, false otherwise

        const timeout: Promise<undefined> = new Promise((resolve) => setTimeout(resolve, 5000));

        const response: boolean | null | undefined = await Promise.race([this.playNopeCallBack, timeout]);
        if (response) {
            return response;
        }
        return false;
    }
}


export default GameServer;