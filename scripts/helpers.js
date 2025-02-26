/**
 * This file defines several helpers for Handlebars templates.
 * Handlebars helpers are small functions that help us format or change data before it is shown on the screen.
 *
 * For example, we have helpers to check if a list is not empty, change numbers to show a plus sign,
 * and translate ability or skill IDs into nice names.
 */

/**
 * A Handlebars helper that checks if an input is not empty.
 *
 * This helper looks at an input value and determines if it has content.
 * It checks if the input has a "length" (like an array or a string) or a "size" (like a collection).
 * If the input is not empty, it runs the block of code provided.
 *
 * @example
 * // In a Handlebars template:
 * // {{#ifNotEmpty myList}}
 * //   <p>The list has items!</p>
 * // {{/ifNotEmpty}}
 */
Handlebars.registerHelper("ifNotEmpty", (input, block) => {
  if (
    input &&
    ((input.length && input.length > 0) || (input.size && input.size > 0))
  ) {
    return block.fn(this);
  }
});

/**
 * An object that maps activity types to a key string.
 *
 * This is like a little dictionary that tells us what to call each type of action.
 * For example, if the type is "action", we call it "actions".
 *
 * @type {Object<string, string>}
 */
const actionTypeNames = {
  action: "actions",
  bonus: "bonus_actions",
  reaction: "reactions",
  crew: "crew_actions",
};

/**
 * A Handlebars helper that returns the localized (translated) name of an activity type.
 *
 * This helper takes a type (like "action") and uses our dictionary (actionTypeNames)
 * to find the key (like "actions"). It then asks the game’s internationalization (i18n)
 * system to translate the key "FANCYUI5E.actions" into a proper string.
 *
 * @param {string} type - The activity type (for example, "action" or "bonus").
 * @returns {string} The localized name for that activity type.
 *
 * @example
 * // In a Handlebars template:
 * // {{actionTypeName "action"}}
 * // Might display: "Actions" (after translation)
 */
Handlebars.registerHelper("actionTypeName", (type) => {
  const key = actionTypeNames[type] || "other_actions";
  return game.i18n.localize(`FANCYUI5E.${key}`);
});

/**
 * A Handlebars helper that formats a number as a modifier.
 *
 * In many games, if a number is positive we like to show a plus sign.
 * This helper checks if the number is negative; if it isn’t, it adds a "+" in front.
 *
 * @param {number} x - The number to format.
 * @returns {string} A string representing the number with a "+" if it is positive.
 *
 * @example
 * // If x is 3, this returns "+3".
 * // If x is -2, this returns "-2".
 */
Handlebars.registerHelper("modifier", (x) => (x < 0 ? x : `+${x}`));

/**
 * A Handlebars helper that returns the localized abbreviation for an ability.
 *
 * This helper takes an ability ID (like "str" for Strength) and uses the game’s
 * internationalization system to find a nice short name for that ability.
 * It uses the method titleCase() to make sure the ability ID starts with a capital letter.
 *
 * @param {string} id - The ability ID (for example, "str", "dex", "con", etc.).
 * @returns {string} The localized abbreviation for the ability.
 *
 * @example
 * // In a Handlebars template:
 * // {{abilityName "str"}}
 * // Might display: "STR" (if that's how the game localizes it)
 */
Handlebars.registerHelper("abilityName", (id) =>
  game.i18n.localize(`DND5E.Ability${id.titleCase()}Abbr`)
);

/**
 * A Handlebars helper that returns the localized name for a skill.
 *
 * This helper takes a skill ID (like "acr" for Acrobatics) and translates it into a nice name.
 * It also uses titleCase() to ensure the first letter is capitalized.
 *
 * @param {string} id - The skill ID (for example, "acr" for Acrobatics).
 * @returns {string} The localized name of the skill.
 *
 * @example
 * // In a Handlebars template:
 * // {{skillName "acr"}}
 * // Might display: "Acrobatics"
 */
Handlebars.registerHelper("skillName", (id) =>
  game.i18n.localize(`DND5E.Skill${id.titleCase()}`)
);

/**
 * A Handlebars helper that returns the first word of a given string.
 *
 * This helper splits the string into words and returns the first one.
 * This is useful when you only want a short version of a longer text.
 *
 * @param {string} str - The input string.
 * @returns {string} The first word of the input string.
 *
 * @example
 * // If str is "Hello world", this returns "Hello".
 * // In a Handlebars template: {{firstWord "Hello world"}} will display "Hello".
 */
Handlebars.registerHelper("firstWord", (str) => str.split(" ")[0]);
