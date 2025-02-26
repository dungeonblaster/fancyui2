/**
 * Main module file for the Fancy UI 5e module.
 *
 * This file is the heart of the module. It imports helper functions,
 * loads data from the character file, and sets up event listeners.
 * It also renders the HUD (heads-up display) for both the player character and the party.
 *
 * Think of it like the control center that makes everything show up on your screen
 * and tells the game what to do when you click on things.
 */

import "./helpers.js";
import { getCharacter, getPartyCharacters, characterData } from "./character.js";
import * as actions from "./actions.js";
import { isGm } from "./utils.js";

/**
 * Ensures that an HTML element with the given id exists in the web page.
 * If the element does not exist, it creates a new <div> with that id and adds it to the page.
 *
 * @param {string} id - The id of the HTML element.
 * @returns {HTMLElement} The element with the specified id.
 *
 * @example
 * // This will find or create a div with id "player-character".
 * const elem = getOrCreateElement("player-character");
 */
function getOrCreateElement(id) {
  console.log("Getting or creating element:", id);
  let elem = document.getElementById(id);
  if (!elem) {
    $("body.game").append(`<div id="${id}"></div>`);
    elem = document.getElementById(id);
  }
  return elem;
}

/**
 * Renders the player's character HUD (heads-up display).
 *
 * This function gets the player's character data and then renders the character
 * using a Handlebars template. If no character is found, it removes the element and tries to create it again.
 *
 * @returns {Promise<void>} A promise that resolves when rendering is complete.
 *
 * @example
 * // When the game starts, the player's character HUD is rendered on the screen.
 * renderCharacter();
 */
async function renderCharacter() {
  console.log("Rendering character");
  const elem = getOrCreateElement("player-character");
  const character = getCharacter();
  console.log("renderCharacter character:", character);
  if (!character) {
    // If there is no character, remove the element and create a new one.
    elem.remove();
    getOrCreateElement("player-character");
    return;
  }
  // Get all the character data (like name, level, hit points, etc.)
  const data = characterData(character);
  console.log("renderCharacter data:", data);
  if (!data) return;
  // Render the character using a Handlebars template.
  const tpl = await renderTemplate("modules/fancy-ui-5e/templates/character.hbs", data);
  elem.innerHTML = tpl;
}

/**
 * Renders the party HUD.
 *
 * The party HUD shows all characters in the party. If the module setting "disable-party-hud"
 * is turned on, it will not display anything. Otherwise, it uses a Handlebars template to show all characters.
 *
 * @returns {Promise<void>} A promise that resolves when the party HUD is rendered.
 *
 * @example
 * // When the game starts, the party HUD is rendered (if it is not disabled).
 * renderParty();
 */
async function renderParty() {
  console.log("Rendering party");
  // Get the module setting "disable-party-hud". If true, we do not render the party HUD.
  const disablePartyHud = game.settings.get("fancy-ui-5e", "disable-party-hud");
  const elem = getOrCreateElement("party");
  if (disablePartyHud) {
    console.log("Party HUD disabled");
    elem.innerHTML = "";
    return;
  }
  // Get the list of party characters and build data for each.
  const characters = getPartyCharacters().map(characterData);
  console.log("renderParty characters:", characters);
  // Render the party using a Handlebars template.
  const tpl = await renderTemplate("modules/fancy-ui-5e/templates/party.hbs", { characters });
  elem.innerHTML = tpl;
  // Center the party HUD vertically.
  elem.style.top = `${window.innerHeight / 2 - elem.clientHeight / 2}px`;
}

/**
 * Activates event listeners for the player HUD.
 *
 * This function adds click listeners to different parts of the player's HUD.
 * For example, clicking on the character's sheet, health bar, actions, skills, saves, abilities,
 * and toggle buttons. It also sets up the health points tracker.
 *
 * @example
 * // Call this function to make sure the player's HUD reacts when you click on it.
 * activatePlayerListeners();
 */
function activatePlayerListeners() {
  console.log("Activating player listeners");
  $(document).on("click", "#player-character .sheet", actions.openSheet);
  // The health points tracker uses the element with id "current-health" in the player HUD.
  setupHealthPointsTracker("#player-character #current-health");
  $(document).on("click", "#player-character .action", async (e) => await actions.rollAction(e));
  $(document).on("click", "#player-character .skill", async (e) => await actions.rollSkill(e));
  $(document).on("click", "#player-character .save", async (e) => await actions.rollSave(e));
  $(document).on("click", "#player-character .ability", async (e) => await actions.rollAbility(e));
  $(document).on("click", "#player-character .actions-toggle", toggleActions);
  $(document).on("click", "#player-character .stats-toggle", toggleStats);
}

/**
 * Toggles (shows or hides) the actions panel in the player's HUD.
 *
 * When you click the toggle button, it makes the actions panel appear or disappear.
 *
 * @param {Event} e - The click event.
 *
 * @example
 * // Clicking the actions toggle button will show or hide the actions panel.
 * toggleActions(event);
 */
function toggleActions(e) {
  console.log("Toggling actions");
  e.stopPropagation(); // Stop the click from affecting other things.
  $(".character-actions").toggleClass("show");
  $(".character-stats").removeClass("show");
}

/**
 * Toggles (shows or hides) the stats panel in the player's HUD.
 *
 * When you click the toggle button, it makes the stats panel appear or disappear.
 *
 * @param {Event} e - The click event.
 *
 * @example
 * // Clicking the stats toggle button will show or hide the stats panel.
 * toggleStats(event);
 */
function toggleStats(e) {
  console.log("Toggling stats");
  e.stopPropagation();
  $(".character-stats").toggleClass("show");
  $(".character-actions").removeClass("show");
}

/**
 * Activates event listeners for the party HUD.
 *
 * This function adds listeners for when you double-click or click on a character picture
 * in the party panel. Double-clicking will open that character's sheet, while a single click
 * will select the character's token on the game board.
 *
 * @example
 * // Call this function to enable party HUD interactions.
 * activatePartyListeners();
 */
function activatePartyListeners() {
  console.log("Activating party listeners");
  $(document).on("dblclick", "#party .character-picture", actions.openSheet);
  $(document).on("click", "#party .character-picture", actions.selectToken);
  // Note: We do not allow HP editing from the party HUD.
}

/**
 * Sets up a tracker for the health points (HP) of the player's character.
 *
 * This function attaches event listeners to the HP input field.
 * - When the field is focused (clicked into), it clears the text so you can type a new value.
 * - When the field loses focus (you click away), it resets to the current HP value from the character.
 * - When you press the Enter key while the field is focused, it updates the character's HP.
 *
 * @param {string} selector - The CSS selector for the HP input element.
 *
 * @example
 * // This sets up the HP field so that you can update your character's HP.
 * setupHealthPointsTracker("#player-character #current-health");
 */
function setupHealthPointsTracker(selector) {
  console.log("Setting up health points tracker for:", selector);
  // When the input field is focused, clear its value.
  $(document).on("focus", selector, function () {
    this.value = "";
  });
  // When the input field loses focus, refresh it with the current HP from the actor.
  $(document).on("blur", selector, function () {
    const actor = game.actors.get(this.dataset.id);
    if (actor) {
      const currentHp = actor.system.attributes.hp.value;
      this.value = currentHp;
      this.dataset.value = currentHp;
    }
  });
  // When the Enter key is pressed in the HP field, update the actor's HP.
  $(document).on("keydown", selector, async function (e) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    e.stopPropagation();
    const actor = game.actors.get(this.dataset.id);
    if (!actor) return;
    const current = Number(actor.system.attributes.hp.value);
    const inputValue = this.value.trim();
    if (!inputValue) return;
    let newHp;
    // If you type a value starting with + or -, adjust the current HP.
    if (inputValue.startsWith("+") || inputValue.startsWith("-")) {
      newHp = current + Number(inputValue);
    } else {
      // Otherwise, set the HP to the typed number.
      newHp = Number(inputValue);
    }
    console.log("Updating HP from", current, "to", newHp);
    await actor.update({ "system.attributes.hp.value": newHp });
    // Clear the input field and set its stored value.
    this.value = "";
    this.dataset.value = newHp;
  });
}

/**
 * Module initialization code.
 *
 * When the module first loads, this block of code runs once.
 * It registers module settings, sets up hook listeners for various game events,
 * and activates the event listeners for both the player and party HUDs.
 */
Hooks.once("init", () => {
  console.log("Module initialized");

  // Register a module setting to control whether only active party characters are shown.
  game.settings.register("fancy-ui-5e", "party-only-active", {
    name: game.i18n.localize("FANCYUI5E.config_party_only_active"),
    hint: game.i18n.localize("FANCYUI5E.config_party_only_active_help"),
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  // Register a module setting to disable the party HUD.
  game.settings.register("fancy-ui-5e", "disable-party-hud", {
    name: "Disable Party HUD",
    hint: "When enabled, the party HUD will not be rendered.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  // When an application is rendered, show the player's character and party HUD.
  Hooks.on("renderApplication", async (app, html, data) => {
    console.log("renderApplication hook fired");
    await renderCharacter();
    await renderParty();
    // If you are the game master (GM), show the players list.
    if (isGm()) {
      $("#players").removeClass("hidden");
    } else {
      $("#players").addClass("hidden");
    }
  });

  // When an actor is updated, re-render the HUD.
  Hooks.on("updateActor", async (actor) => {
    console.log("updateActor hook fired");
    if (actor.id === getCharacter()?.id) {
      await renderCharacter();
    }
    await renderParty();
  });

  // When an item is updated (changed), re-render the character HUD after a short delay.
  Hooks.on("updateItem", (item, diff) => {
    console.log("updateItem hook fired");
    const actor = item.actor;
    if (!actor || actor.id !== getCharacter()?.id) return;
    setTimeout(async () => {
      await renderCharacter();
    }, 1000);
  });

  // When a token is controlled (selected), re-render the character HUD if you are the GM.
  Hooks.on("controlToken", async () => {
    console.log("controlToken hook fired");
    if (!isGm()) return;
    await renderCharacter();
  });

  // When a token is deleted, re-render the character HUD if you are the GM.
  Hooks.on("deleteToken", async () => {
    console.log("deleteToken hook fired");
    if (!isGm()) return;
    await renderCharacter();
  });

  // When the game is ready, render the HUDs.
  Hooks.once("ready", async () => {
    console.log("ready hook fired");
    await renderCharacter();
    await renderParty();
  });

  // Activate the event listeners for both the player and party HUDs.
  activatePlayerListeners();
  activatePartyListeners();
});
