/**
 * Checks if the current user is a Game Master (GM).
 *
 * In our game, a Game Master is like the teacher or boss who runs the game.
 * This function looks at the current user (the person playing the game) and
 * checks if they have the GM role. It does this by looking up the user with
 * game.users.get(game.userId) and then checking the property isGM.
 *
 * @returns {boolean} True if the current user is a GM; false if they are not.
 *
 * @example
 * // If you are a Game Master, calling isGm() will return true.
 * if (isGm()) {
 *   console.log("You are the boss!");
 * } else {
 *   console.log("You are a player.");
 * }
 */
export function isGm() {
	return game.users.get(game.userId).isGM;
}
