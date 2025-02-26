/**
 * Rolls an ability check.
 *
 * When you click on a part of the HUD that is meant to roll an ability (like Strength),
 * this function will find the right character and then roll the dice for that ability.
 *
 * Expected data on the clicked element:
 * - data-character-id: The ID of the character (actor).
 * - data-ability: The short name of the ability (for example, "str" for Strength).
 *
 * @param {Event} e - The click event.
 * @example
 * // If a button has data-character-id="123" and data-ability="str", clicking it will roll Strength.
 * rollAbility(event);
 */
export async function rollAbility(e) {
  e.preventDefault(); // Stop the default click action.
  $(".character-actions").removeClass("show");
  $(".character-stats").removeClass("show");

  // Find the element that has the character ID.
  const element = e.currentTarget.closest("[data-character-id]");
  if (!element) return ui.notifications.warn("No character data found.");
  
  const characterId = element.dataset.characterId;
  const ability = element.dataset.ability;
  if (!characterId || !ability) {
    return ui.notifications.warn("Missing required data attributes.");
  }
  
  // Get the actor (the character) by ID.
  const actor = game.actors.get(characterId);
  if (!actor) return ui.notifications.warn("Actor not found.");
  
  // Roll the ability check. This simulates throwing dice.
  await actor.rollAbilityCheck(ability, { dialog: false });
}

/**
 * Rolls a skill check.
 *
 * This function is similar to rollAbility, but it works for skills like Acrobatics.
 *
 * Expected data on the clicked element:
 * - data-character-id: The actor's ID.
 * - data-skill: The abbreviation of the skill (for example, "acr" for Acrobatics).
 *
 * @param {Event} e - The click event.
 * @example
 * // If a button has data-character-id="123" and data-skill="ath", clicking it will roll Athletics.
 * rollSkill(event);
 */
export async function rollSkill(e) {
  e.preventDefault();
  $(".character-actions").removeClass("show");
  $(".character-stats").removeClass("show");

  const element = e.currentTarget.closest("[data-character-id]");
  if (!element) return ui.notifications.warn("No character data found.");
  
  const characterId = element.dataset.characterId;
  const skill = element.dataset.skill;
  if (!characterId || !skill) {
    return ui.notifications.warn("Missing required data attributes.");
  }
  
  const actor = game.actors.get(characterId);
  if (!actor) return ui.notifications.warn("Actor not found.");

  // We try to call the new rollSkillV2 method if it exists. Otherwise, we fall back.
  if (actor.rollSkillV2) {
    await actor.rollSkillV2(skill, { dialog: false });
  } else {
    await actor.rollSkill(skill, { dialog: false });
  }
}

/**
 * Rolls a saving throw.
 *
 * This function is used when a character needs to roll a save (for example, to dodge something).
 *
 * Expected data on the clicked element:
 * - data-character-id: The actor's ID.
 * - data-ability: The ability abbreviation for the saving throw (like "dex" for Dexterity save).
 *
 * @param {Event} e - The click event.
 * @example
 * // Clicking a save button with data-character-id="123" and data-ability="dex" rolls a Dexterity saving throw.
 * rollSave(event);
 */
export async function rollSave(e) {
  e.preventDefault();
  e.stopPropagation(); // Stop the event from bubbling up.
  $(".character-actions").removeClass("show");
  $(".character-stats").removeClass("show");

  const element = e.currentTarget.closest("[data-character-id]");
  if (!element) return ui.notifications.warn("No character data found.");
  
  const characterId = element.dataset.characterId;
  const ability = element.dataset.ability;
  if (!characterId || !ability) {
    return ui.notifications.warn("Missing required data attributes.");
  }
  
  const actor = game.actors.get(characterId);
  if (!actor) return ui.notifications.warn("Actor not found.");
  
  // Roll the saving throw (like dodging a trap).
  await actor.rollSavingThrow(ability, { dialog: false });
}

/**
 * Rolls an item action.
 *
 * When you click on an item (like a dagger or a special ability called Rage) in the Actions panel,
 * this function figures out what to do.
 *
 * It first gets the item from the actor's collection. Then it looks at the item's activities,
 * which is a list of things the item can do (like "attack" for a weapon or "cast" for a spell).
 * If it finds an activity with a roll() method, it calls that method (this means "roll the dice").
 *
 * If no rollable activity is found (for example, if the item is a class feature like Rage),
 * it will display the item's details in the chat.
 *
 * Expected data on the clicked element:
 * - data-character-id: The actor's ID.
 * - data-item-id: The item's ID.
 *
 * @param {Event} e - The click event.
 * @example
 * // Clicking on a dagger in the HUD will trigger this function and roll an attack.
 * rollAction(event);
 */
export async function rollAction(e) {
  e.preventDefault();
  $(".character-actions").removeClass("show");
  $(".character-stats").removeClass("show");

  // Find the element with the character's ID.
  const element = e.currentTarget.closest("[data-character-id]");
  if (!element) return ui.notifications.warn("No character data found.");
  
  const characterId = element.dataset.characterId;
  const itemId = element.dataset.itemId;
  if (!characterId || !itemId) {
    return ui.notifications.warn("Missing required data attributes.");
  }
  
  const actor = game.actors.get(characterId);
  if (!actor) return ui.notifications.warn("Actor not found.");
  
  // Get the item from the actor's items collection.
  const item = actor.items.get(itemId);
  if (!item) return ui.notifications.warn("Item not found.");

  // Get the type of the item (for example, "weapon" or "spell").
  const itemType = item.data?.type || item.type;

  // Look for activities on the item.
  // Activities are a list of things the item can do (like attack or cast).
  const activities = item.data?.data?.activities || {};

  // Loop over each activity to see if it can roll.
  for (const activity of Object.values(activities)) {
    // If the activity has a roll() method, we use it.
    if (typeof activity.roll === "function") {
      // This will "roll the dice" for that activity.
      await activity.roll();
      return;
    }
  }

  // If we did not find any activity with a roll() method,
  // then the item might not be rollable (like the Rage feature).
  // In that case, we display the item's details in chat.
  if (typeof item.toChat === "function") {
    await item.toChat();
  } else if (item.system?.description?.value) {
    // Create a simple chat message showing the item's name and description.
    const content = `<h2>${item.name}</h2><div>${item.system.description.value}</div>`;
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      content: content
    });
  } else {
    ui.notifications.warn("This item type cannot be rolled or sent to chat.");
  }
}

/**
 * Opens the character's sheet.
 *
 * When you click a button to view the full character sheet, this function opens it.
 *
 * Expected data on the clicked element:
 * - data-character: The actor's ID.
 *
 * @param {Event} e - The click event.
 * @example
 * // Clicking a button with data-character="123" opens the sheet for that character.
 * openSheet(event);
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
  
  // Open the actor's character sheet (like a detailed page).
  actor.sheet.render(true);
}

/**
 * Selects the token for a character.
 *
 * In the party UI, when you click on a character, this function finds their token on the canvas
 * and makes it active (selected).
 *
 * Expected data on the clicked element:
 * - data-character: The actor's ID.
 *
 * @param {Event} e - The click event.
 * @example
 * // Clicking a character's picture in the party panel will select their token.
 * selectToken(event);
 */
export async function selectToken(e) {
  e.preventDefault();
  const element = e.currentTarget.closest("[data-character]");
  const characterId = element ? element.dataset.character : null;
  if (!characterId) return ui.notifications.warn("Character not found.");
  
  // Find the token on the canvas that belongs to this character.
  const token = canvas.tokens.placeables.find(t => t.actor?.id === characterId);
  if (token) token.control();
}
