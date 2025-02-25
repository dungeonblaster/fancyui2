// character.js

/**
 * Returns the actor associated with the currently controlled token.
 * In Foundry VTT v13, tokens may need to be resolved via their document.
 */
export function getCharacter() {
  console.log("Fetching character");
  const controlled = canvas.tokens?.controlled || [];
  console.log("Controlled tokens:", controlled);
  if (controlled.length > 0) {
    let actor = controlled[0].actor;
    if (!actor && controlled[0].document) {
      actor = game.actors.get(controlled[0].document.actorId);
    }
    if (actor) {
      console.log("Found actor:", actor.name);
      return actor;
    }
  }
  // Fallback for players who have an assigned character.
  const userCharacter = game.user.character;
  console.log("Player character:", userCharacter);
  return userCharacter || undefined;
}

/**
 * Returns a list of actors for the party.
 * If the "party-only-active" setting is enabled, only actors with tokens on the canvas are returned.
 */
export function getPartyCharacters() {
  console.log("Fetching party characters");
  const partyOnlyActive = game.settings.get("fancy-ui-5e", "party-only-active");
  const actors = Array.from(game.actors.contents).filter(actor => actor.type === "character");
  console.log("Found characters:", actors.length);
  if (partyOnlyActive) {
    const activeActors = actors.filter(actor => canvas.tokens.placeables.some(t => t.actor?.id === actor.id));
    console.log("Active party characters:", activeActors.length);
    return activeActors;
  }
  return actors;
}

/**
 * Builds a data object for a given actor to pass to the Handlebars template.
 * This function remains synchronous.
 */
export function characterData(actor) {
  console.log("Generating character data for:", actor?.name || "undefined actor");
  if (!actor) return {};
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
    ini: (typeof data.attributes?.init === "object" && data.attributes?.init.total !== undefined)
         ? data.attributes.init.total 
         : data.attributes?.init || 0,
    armor: data.attributes?.ac?.value || data.attributes?.ac || "",
    hp: {
      value: data.attributes?.hp?.value,
      max: data.attributes?.hp?.max,
      percent: Math.floor((data.attributes?.hp?.value / data.attributes?.hp?.max) * 100),
      status: (data.attributes?.hp?.value / data.attributes?.hp?.max) > 0.5 ? "healthy" : "injured"
    },
    abilities: data.abilities,
    skills: data.skills,
    actions: getActions(actor)
  };
}

/**
 * Generates a list of favorite actions based on the actor's items.
 *
 * It reads the favorites array from actor.system.favorites and, for each favorite object,
 * uses fromUuidSync (with the actor as the relative context) to resolve the item.
 * Only items of allowed types ("spell", "consumable", "weapon", "feat") are included.
 */
function getActions(actor) {
  console.log("Generating actions for actor:", actor.name);
  const favsArray = actor.system.favorites || [];
  console.log("Favorites array:", favsArray);
  const actions = [];
  for (const fav of favsArray) {
    if (!fav.id) continue;
    try {
      // Resolve the favorite's relative id; e.g., ".Item.eaoSDox05BrFS9Lh"
      const itemDoc = fromUuidSync(fav.id, { relative: actor });
      if (!itemDoc) continue;
      const itemType = itemDoc.data?.type || itemDoc.type;
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
  actions.sort((a, b) => a.sort - b.sort);
  console.log("Sorted actions:", actions.length);
  return actions;
}

/**
 * A simplified check to determine if an item should be included.
 */
function isItemInActionList(item) {
  console.log("Checking item for action list:", item?.name || "undefined item", item?.type || "undefined type");
  const type = item.data?.type || item.type;
  return ["spell", "consumable", "weapon", "feat"].includes(type);
}