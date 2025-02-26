// character.js

/**
 * Gets the character (actor) that is currently controlled.
 *
 * In our game, an "actor" is a character with information like name, abilities, items, and more.
 * This function checks which token (a little picture on the board) is selected and then gets
 * the actor (character) that token represents.
 *
 * If no token is selected, it tries to use the character assigned to your user.
 *
 * @returns {Actor5e|undefined} The actor (character) that is currently controlled, or undefined if none.
 *
 * @example
 * // If you have a token selected, getCharacter() returns that actor.
 * const actor = getCharacter();
 * console.log(actor.name); // Might print "Barbarian"
 */
export function getCharacter() {
  console.log("Fetching character");
  // Get a list of tokens (the little pictures on the board) that are selected.
  const controlled = canvas.tokens?.controlled || [];
  console.log("Controlled tokens:", controlled);
  if (controlled.length > 0) {
    let actor = controlled[0].actor;
    // If the actor is not directly available, use the document to find it.
    if (!actor && controlled[0].document) {
      actor = game.actors.get(controlled[0].document.actorId);
    }
    if (actor) {
      console.log("Found actor:", actor.name);
      return actor;
    }
  }
  // If no token is selected, try to use the character that your user has assigned.
  const userCharacter = game.user.character;
  console.log("Player character:", userCharacter);
  return userCharacter || undefined;
}

/**
 * Gets a list of characters that are in the party.
 *
 * "Party" means all the characters (actors) in the game.
 * If the setting "party-only-active" is enabled, only the characters with tokens (active on the board)
 * are returned.
 *
 * @returns {Actor5e[]} An array of actors that are in the party.
 *
 * @example
 * const party = getPartyCharacters();
 * console.log("There are " + party.length + " characters in the party.");
 */
export function getPartyCharacters() {
  console.log("Fetching party characters");
  // Read the setting from the module to check if we only want active characters.
  const partyOnlyActive = game.settings.get("fancy-hud-5e", "party-only-active");
  // Get all actors that are characters.
  const actors = Array.from(game.actors.contents).filter(actor => actor.type === "character");
  console.log("Found characters:", actors.length);
  if (partyOnlyActive) {
    // Only include those that have tokens on the canvas.
    const activeActors = actors.filter(actor => canvas.tokens.placeables.some(t => t.actor?.id === actor.id));
    console.log("Active party characters:", activeActors.length);
    return activeActors;
  }
  return actors;
}

/**
 * Creates a plain object with information about a character.
 *
 * This function collects all the important details about a character (actor) that
 * our module needs to display. It gets the character's name, level, race, class,
 * image, speed, initiative, armor, hit points (hp), abilities, skills, and favorite actions.
 *
 * @param {Actor5e} actor - The actor (character) to create data for.
 * @returns {Object} An object with the actor’s data.
 *
 * @example
 * const actor = getCharacter();
 * const data = characterData(actor);
 * console.log(data.name); // Might print "Barbarian"
 */
export function characterData(actor) {
  console.log("Generating character data for:", actor?.name || "undefined actor");
  if (!actor) return {};
  // The actor's detailed data is stored in its "system" property.
  const data = actor.system;
  return {
    id: actor.id,
    isCharacter: true,
    name: actor.name,
    level: data.details?.level || 1,
    race: data.details?.race || "",
    class: data.details?.class || "",
    picture: actor.img,
    speed: data.attributes?.movement?.walk || 0,
    // If initiative is an object, we use its "total" property; otherwise we use the value.
    ini: (typeof data.attributes?.init === "object" && data.attributes?.init.total !== undefined)
         ? data.attributes.init.total 
         : data.attributes?.init || 0,
    armor: data.attributes?.ac?.value || data.attributes?.ac || "",
    hp: {
      value: data.attributes?.hp?.value,
      max: data.attributes?.hp?.max,
      percent: Math.floor((data.attributes?.hp?.value / data.attributes?.hp?.max) * 100),
      // If more than half the hp is left, we say "healthy"; otherwise "injured".
      status: (data.attributes?.hp?.value / data.attributes?.hp?.max) > 0.5 ? "healthy" : "injured"
    },
    abilities: data.abilities,
    skills: data.skills,
    actions: getActions(actor)
  };
}

/**
 * Creates a list of favorite actions from the character's items.
 *
 * Our character may have favorite items (like spells, weapons, or special abilities).
 * These favorites are stored in the actor's system in an array called "favorites".
 * Each favorite is an object with:
 *   - id: A relative ID (like ".Item.eaoSDox05BrFS9Lh") that points to an item.
 *   - sort: A number that tells us how to sort the favorites.
 *
 * This function uses the function fromUuidSync to look up each favorite by its ID,
 * then checks if the item type is one of the allowed types ("spell", "consumable", "weapon", "feat").
 * If it is, the item is added to the list of actions.
 *
 * @param {Actor5e} actor - The actor whose favorite actions we want.
 * @returns {Object[]} An array of action objects. Each object has:
 *   - id: The item's unique ID.
 *   - name: The item's name.
 *   - img: The image (icon) of the item.
 *   - sort: The sort order for the favorite.
 *
 * @example
 * // Suppose the actor has favorites set up. Calling getActions(actor) returns an array of items.
 * const actions = getActions(actor);
 * console.log(actions[0].name); // Might print "Dagger"
 */
function getActions(actor) {
  console.log("Generating actions for actor:", actor.name);
  // Read the favorites array from the actor's system data.
  const favsArray = actor.system.favorites || [];
  console.log("Favorites array:", favsArray);
  const actions = [];
  // Loop through each favorite in the array.
  for (const fav of favsArray) {
    if (!fav.id) continue; // Skip if there's no id.
    try {
      // Use fromUuidSync to get the item document using its relative id.
      // For example, ".Item.eaoSDox05BrFS9Lh" might point to a dagger.
      const itemDoc = fromUuidSync(fav.id, { relative: actor });
      if (!itemDoc) continue;
      // Determine the type of the item. This tells us if it is a spell, weapon, etc.
      const itemType = itemDoc.data?.type || itemDoc.type;
      // Only include items if they are one of the allowed types.
      if (!["spell", "consumable", "weapon", "feat"].includes(itemType)) continue;
      actions.push({
        id: itemDoc.id,
        name: itemDoc.name,
        img: itemDoc.img,
        sort: fav.sort || 0
      });
      console.log("Including favorite action:", itemDoc.name);
    } catch (err) {
      console.error("Error resolving favorite id:", fav.id, err);
    }
  }
  // Sort the actions array by the sort value so they show in the right order.
  actions.sort((a, b) => a.sort - b.sort);
  console.log("Sorted actions:", actions.length);
  return actions;
}

/**
 * Checks if an item should be included in the action list.
 *
 * This helper function is simple. It looks at the item and checks its type.
 * Only items of type "spell", "consumable", "weapon", or "feat" are allowed.
 *
 * @param {Item5e} item - The item to check.
 * @returns {boolean} True if the item should be included; otherwise false.
 *
 * @example
 * // If you have a dagger item, calling isItemInActionList(dagger) returns true.
 * const include = isItemInActionList(dagger);
 * console.log(include); // true or false
 */
function isItemInActionList(item) {
  console.log("Checking item for action list:", item?.name || "undefined item", item?.type || "undefined type");
  const type = item.data?.type || item.type;
  return ["spell", "consumable", "weapon", "feat"].includes(type);
}
