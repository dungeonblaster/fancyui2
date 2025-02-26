/**
 * Rolls an ability check.
 * Expects the clicked element (or one of its ancestors) to have:
 * - data-character-id : the actor's ID
 * - data-ability : the abbreviation of the ability to roll (e.g., "str", "dex", etc.)
 */
export async function rollAbility(e) {
  e.preventDefault();
  $(".character-actions").removeClass("show");
  $(".character-stats").removeClass("show");

  const element = e.currentTarget.closest("[data-character-id]");
  if (!element) return ui.notifications.warn("No character data found.");
  const characterId = element.dataset.characterId;
  const ability = element.dataset.ability;
  if (!characterId || !ability) return ui.notifications.warn("Missing required data attributes.");
  const actor = game.actors.get(characterId);
  if (!actor) return ui.notifications.warn("Actor not found.");
  await actor.rollAbilityCheck(ability, { dialog: false });
}

/**
 * Rolls a skill check.
 * Expects the clicked element (or one of its ancestors) to have:
 * - data-character-id : the actor's ID
 * - data-skill : the abbreviation of the skill to roll (e.g., "acr", "ath", etc.)
 */
export async function rollSkill(e) {
  e.preventDefault();
  $(".character-actions").removeClass("show");
  $(".character-stats").removeClass("show");

  const element = e.currentTarget.closest("[data-character-id]");
  if (!element) return ui.notifications.warn("No character data found.");
  const characterId = element.dataset.characterId;
  const skill = element.dataset.skill;
  if (!characterId || !skill) return ui.notifications.warn("Missing required data attributes.");
  const actor = game.actors.get(characterId);
  if (!actor) return ui.notifications.warn("Actor not found.");
  if (actor.rollSkillV2) {
    await actor.rollSkillV2(skill, { dialog: false });
  } else {
    await actor.rollSkill(skill, { dialog: false });
  }
}

/**
 * Rolls a saving throw.
 * Expects the clicked element (or one of its ancestors) to have:
 * - data-character-id : the actor's ID
 * - data-ability : the abbreviation of the ability for the save (e.g., "str", "dex", etc.)
 */
export async function rollSave(e) {
  e.preventDefault();
  e.stopPropagation(); // Prevent event from bubbling up to parent elements
  $(".character-actions").removeClass("show");
  $(".character-stats").removeClass("show");

  const element = e.currentTarget.closest("[data-character-id]");
  if (!element) return ui.notifications.warn("No character data found.");
  const characterId = element.dataset.characterId;
  const ability = element.dataset.ability;
  if (!characterId || !ability) return ui.notifications.warn("Missing required data attributes.");
  const actor = game.actors.get(characterId);
  if (!actor) return ui.notifications.warn("Actor not found.");
  await actor.rollSavingThrow(ability, { dialog: false });
}

/**
 * Displays an item action in chat.
 * Expects the clicked element (or one of its ancestors) to have:
 * - data-character-id : the actor's ID
 * - data-item-id : the item's ID
 *
 * This function now handles displaying the item in chat and rolling any associated activities.
 */
export async function rollAction(e) {
  e.preventDefault();
  $(".character-actions").removeClass("show");
  $(".character-stats").removeClass("show");

  const element = e.currentTarget.closest("[data-character-id]");
  if (!element) return ui.notifications.warn("No character data found.");
  const characterId = element.dataset.characterId;
  const itemId = element.dataset.itemId;
  if (!characterId || !itemId) return ui.notifications.warn("Missing required data attributes.");
  const actor = game.actors.get(characterId);
  if (!actor) return ui.notifications.warn("Actor not found.");
  const item = actor.items.get(itemId);
  if (!item) return ui.notifications.warn("Item not found.");

  // Check if the item has activities with a roll method
  const activities = item.data?.data?.activities || {};
  for (const activity of Object.values(activities)) {
    if (typeof activity.roll === "function") {
      // Call the activity's roll method for chat output
      await activity.roll();
      return;
    }
  }

  // If no rollable activity, display the item's card in chat
  await item.displayCard();
}

/**
 * Opens the character's sheet.
 * Expects the clicked element (or one of its ancestors) to have:
 * - data-character : the actor's ID
 */
export async function openSheet(e) {
  e.preventDefault();
  $(".character-actions").removeClass("show");
  $(".character-stats").removeClass("show");

  const element = e.currentTarget.closest("[data-character]");
  const characterId = element ? element.dataset.character : null;
  if (!characterId) return ui.notifications.warn("Character not found.");
  const actor = game.actors.get(characterId);
  if (!actor) return ui.notifications.warn("Actor not found.");
  actor.sheet.render(true);
}

/**
 * Selects the token associated with a character (used in the party UI).
 * Expects the clicked element (or one of its ancestors) to have:
 * - data-character : the actor's ID
 */
export async function selectToken(e) {
  e.preventDefault();
  const element = e.currentTarget.closest("[data-character]");
  const characterId = element ? element.dataset.character : null;
  if (!characterId) return ui.notifications.warn("Character not found.");
  const token = canvas.tokens.placeables.find(t => t.actor?.id === characterId);
  if (token) token.control();
}
