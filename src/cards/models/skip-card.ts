import Card from './card-base';

/**
 * Represents a Skip card in the game.
 */
class SkipCard extends Card {
  /**
   * Create a new SkipCard.
   */
  constructor() {
    super('Skip', 'Action');
  }
}

export default SkipCard;
