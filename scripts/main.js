import "./helpers.js";
import { getCharacter, getPartyCharacters, characterData } from "./character.js";
import * as actions from "./actions.js";
import { isGm } from "./utils.js";

// Helper: Ensure a container element exists in the DOM.
function getOrCreateElement(id) {
  console.log("Getting or creating element:", id);
  let elem = document.getElementById(id);
  if (!elem) {
    $("body.game").append(`<div id="${id}"></div>`);
    elem = document.getElementById(id);
  }
  return elem;
}

// Render the player's character HUD.
async function renderCharacter() {
  console.log("Rendering character");
  const elem = getOrCreateElement("player-character");
  const character = getCharacter();
  console.log("renderCharacter character:", character);
  if (!character) {
    elem.remove();
    getOrCreateElement("player-character");
    return;
  }
  const data = characterData(character);
  console.log("renderCharacter data:", data);
  if (!data) return;
  const tpl = await renderTemplate("modules/fancy-ui-5e/templates/character.hbs", data);
  elem.innerHTML = tpl;
}

// Render the party HUD.
async function renderParty() {
  console.log("Rendering party");
  const disablePartyHud = game.settings.get("fancy-ui-5e", "disable-party-hud");
  const elem = getOrCreateElement("party");
  if (disablePartyHud) {
    console.log("Party HUD disabled");
    elem.innerHTML = "";
    return;
  }
  const characters = getPartyCharacters().map(characterData);
  console.log("renderParty characters:", characters);
  const tpl = await renderTemplate("modules/fancy-ui-5e/templates/party.hbs", { characters });
  elem.innerHTML = tpl;
  elem.style.top = `${window.innerHeight / 2 - elem.clientHeight / 2}px`;
}

// Activate event listeners for player actions.
function activatePlayerListeners() {
  console.log("Activating player listeners");
  $(document).on("click", "#player-character .sheet", actions.openSheet);
  // Note the selector now uses the element's id (#current-health)
  setupHealthPointsTracker("#player-character #current-health");
  $(document).on("click", "#player-character .action", async (e) => await actions.rollAction(e));
  $(document).on("click", "#player-character .skill", async (e) => await actions.rollSkill(e));
  $(document).on("click", "#player-character .save", async (e) => await actions.rollSave(e));
  $(document).on("click", "#player-character .ability", async (e) => await actions.rollAbility(e));
  $(document).on("click", "#player-character .actions-toggle", toggleActions);
  $(document).on("click", "#player-character .stats-toggle", toggleStats);
}

function toggleActions(e) {
  console.log("Toggling actions");
  e.stopPropagation();
  $(".character-actions").toggleClass("show");
  $(".character-stats").removeClass("show");
}

function toggleStats(e) {
  console.log("Toggling stats");
  e.stopPropagation();
  $(".character-stats").toggleClass("show");
  $(".character-actions").removeClass("show");
}

// Activate event listeners for party elements.
function activatePartyListeners() {
  console.log("Activating party listeners");
  $(document).on("dblclick", "#party .character-picture", actions.openSheet);
  $(document).on("click", "#party .character-picture", actions.selectToken);
  // No HP editing binding for the party HUD.
}

/**
 * Sets up the HP input for the player-character HUD:
 * - On focus, clears the field.
 * - On blur, refreshes the value from the actor.
 * - On Enter (keydown), reads the new value and updates the actor's HP.
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
    let newHp;
    if (inputValue.startsWith("+") || inputValue.startsWith("-")) {
      newHp = current + Number(inputValue);
    } else {
      newHp = Number(inputValue);
    }
    console.log("Updating HP from", current, "to", newHp);
    await actor.update({ "system.attributes.hp.value": newHp });
    this.value = "";
    this.dataset.value = newHp;
  });
}

// Module initialization.
Hooks.once("init", () => {
  console.log("Module initialized");

  // Register module settings.
  game.settings.register("fancy-ui-5e", "party-only-active", {
    name: game.i18n.localize("FANCYUI5E.config_party_only_active"),
    hint: game.i18n.localize("FANCYUI5E.config_party_only_active_help"),
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });
  game.settings.register("fancy-ui-5e", "disable-party-hud", {
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