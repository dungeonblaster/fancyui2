/**
 * Main module file for the Fancy UI 5e module.
 *
 * This file is the heart of the module. It imports helper functions,
 * loads data from the character file, and sets up event listeners.
 * It also renders the HUD (heads-up display) for both the player character and the party.
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
  const tpl = await renderTemplate("modules/fancy-hud-5e/templates/character.hbs", data);
  elem.innerHTML = tpl;
}

/**
 * Renders the party HUD.
 *
 * The party HUD shows all characters in the party. If the module setting "disable-party-hud"
 * is turned on, it will not display anything. Otherwise, it uses a Handlebars template to show all characters.
 *
 * @returns {Promise<void>} A promise that resolves when the party HUD is rendered.
 */
async function renderParty() {
  console.log("Rendering party");
  const disablePartyHud = game.settings.get("fancy-hud-5e", "disable-party-hud");
  const elem = getOrCreateElement("party");
  if (disablePartyHud) {
    console.log("Party HUD disabled");
    elem.innerHTML = "";
    return;
  }
  const characters = getPartyCharacters().map(characterData);
  console.log("renderParty characters:", characters);
  const tpl = await renderTemplate("modules/fancy-hud-5e/templates/party.hbs", { characters });
  elem.innerHTML = tpl;
  elem.style.top = `${window.innerHeight / 2 - elem.clientHeight / 2}px`;
}

/**
 * Activates event listeners for the player HUD.
 *
 * This function adds click listeners to different parts of the player's HUD.
 * It also sets up the health points tracker.
 */
function activatePlayerListeners() {
  console.log("Activating player listeners");
  $(document).on("click", "#player-character .sheet", actions.openSheet);
  setupHealthPointsTracker("#player-character #current-health");
  $(document).on("click", "#player-character .action", async (e) => await actions.rollAction(e));
  $(document).on("click", "#player-character .skill", async (e) => await actions.rollSkill(e));
  $(document).on("click", "#player-character .save", async (e) => await actions.rollSave(e));
  $(document).on("click", "#player-character .ability", async (e) => await actions.rollAbility(e));
  $(document).on("click", "#player-character .actions-toggle", toggleActions);
  $(document).on("click", "#player-character .stats-toggle", toggleStats);

  // NEW: Right-click listener to toggle the paper doll window inside our HUD.
  $(document).on("contextmenu", "#player-character .character-picture", (e) => {
    e.preventDefault(); // Prevent default browser context menu
    const actor = getCharacter(); // Retrieve the current character actor
    if (!actor) return ui.notifications.warn("No character data found.");

    // Look for an existing paper doll container.
    let dollContainer = $("#character-paperdoll");
    if (!dollContainer.length) {
      dollContainer = $(`<div id="character-paperdoll" class="character-paperdoll"></div>`);
      $("#player-character").append(dollContainer);
    }
    // Toggle the paper doll container.
    if (dollContainer.is(":visible")) {
      dollContainer.hide().empty();
    } else {
      // Instantiate the paper doll UI and render it without opening a separate window.
      const dollApp = new ui.paperDoll(actor);
      const dollHtml = dollApp.render(false);
      dollContainer.html(dollHtml);
      dollContainer.show();
    }
  });
}

/**
 * Toggles (shows or hides) the actions panel in the player's HUD.
 */
function toggleActions(e) {
  console.log("Toggling actions");
  e.stopPropagation();
  $(".character-actions").toggleClass("show");
  $(".character-stats").removeClass("show");
}

/**
 * Toggles (shows or hides) the stats panel in the player's HUD.
 */
function toggleStats(e) {
  console.log("Toggling stats");
  e.stopPropagation();
  $(".character-stats").toggleClass("show");
  $(".character-actions").removeClass("show");
}

/**
 * Activates event listeners for the party HUD.
 */
function activatePartyListeners() {
  console.log("Activating party listeners");
  $(document).on("dblclick", "#party .character-picture", actions.openSheet);
  $(document).on("click", "#party .character-picture", actions.selectToken);
}

/**
 * Sets up a tracker for the health points (HP) of the player's character.
 */
function setupHealthPointsTracker(selector) {
  console.log("Setting up health points tracker for:", selector);
  $(document).on("focus", selector, function () {
    this.value = "";
  });
  $(document).on("blur", selector, function () {
    const actor = game.actors.get(this.dataset.id);
    if (actor) {
      const currentHp = actor.system.attributes.hp.value;
      this.value = currentHp;
      this.dataset.value = currentHp;
    }
  });
  $(document).on("keydown", selector, async function (e) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    e.stopPropagation();
    const actor = game.actors.get(this.dataset.id);
    if (!actor) return;
    const current = Number(actor.system.attributes.hp.value);
    const inputValue = this.value.trim();
    if (!inputValue) return;
    let newHp = inputValue.startsWith("+") || inputValue.startsWith("-")
      ? current + Number(inputValue)
      : Number(inputValue);
    console.log("Updating HP from", current, "to", newHp);
    await actor.update({ "system.attributes.hp.value": newHp });
    this.value = "";
    this.dataset.value = newHp;
  });
}

/**
 * Module initialization code.
 */
Hooks.once("init", () => {
  console.log("Module initialized");

  game.settings.register("fancy-hud-5e", "party-only-active", {
    name: game.i18n.localize("FANCYUI5E.config_party_only_active"),
    hint: game.i18n.localize("FANCYUI5E.config_party_only_active_help"),
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register("fancy-hud-5e", "disable-party-hud", {
    name: "Disable Party HUD",
    hint: "When enabled, the party HUD will not be rendered.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  Hooks.on("renderApplication", async (app, html, data) => {
    console.log("renderApplication hook fired");
    await renderCharacter();
    await renderParty();
    if (isGm()) {
      $("#players").removeClass("hidden");
    } else {
      $("#players").addClass("hidden");
    }
  });

  Hooks.on("updateActor", async (actor) => {
    console.log("updateActor hook fired");
    if (actor.id === getCharacter()?.id) {
      await renderCharacter();
    }
    await renderParty();
  });

  Hooks.on("updateItem", (item, diff) => {
    console.log("updateItem hook fired");
    const actor = item.actor;
    if (!actor || actor.id !== getCharacter()?.id) return;
    setTimeout(async () => {
      await renderCharacter();
    }, 1000);
  });

  Hooks.on("controlToken", async () => {
    console.log("controlToken hook fired");
    if (!isGm()) return;
    await renderCharacter();
  });

  Hooks.on("deleteToken", async () => {
    console.log("deleteToken hook fired");
    if (!isGm()) return;
    await renderCharacter();
  });

  Hooks.once("ready", async () => {
    console.log("ready hook fired");
    await renderCharacter();
    await renderParty();
  });

  activatePlayerListeners();
  activatePartyListeners();
});
