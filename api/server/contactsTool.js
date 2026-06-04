const { retrieveRelevantContacts, formatContactsForLLM } = require('../services/contactRetrieval');

/**
 * OpenAI-compatible function/tool definition.
 * Pass this in the `tools` array when calling the LLM.
 */
const contactsToolDefinition = {
  type: 'function',
  function: {
    name: 'search_contacts',
    description:
      "Search the user's personal contact list. Use this whenever the user asks about " +
      'people, colleagues, companies, roles, or anything that sounds like contact information. ' +
      'Examples: "who works at Stripe", "tell me about John Doe", "list all CTOs", ' +
      '"which contacts are in AI infrastructure".',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'The search term. Extract the key name, company, role, or topic from the user message. ' +
            'E.g. for "who works at Acme Corp?" use query="Acme Corp".',
        },
      },
      required: ['query'],
    },
  },
};

/**
 * Execute the tool — called when the LLM invokes search_contacts.
 *
 * @param {{ query: string }} args
 * @param {string} userId
 * @returns {Promise<string>}  Human-readable contact list for the LLM
 */
async function handleContactsTool(args, userId) {
  try {
    const { query } = args;
    const contacts = await retrieveRelevantContacts(query, userId, 20);
    return formatContactsForLLM(contacts);
  } catch (err) {
    console.error('[contactsTool] error:', err);
    return 'Error retrieving contacts. Please try again.';
  }
}

/**
 * HOW TO INTEGRATE INTO LIBRECHAT'S CHAT HANDLER:
 *
 * In your LLM request builder (e.g. api/server/routes/ask/gptPlugins.js
 * or wherever the OpenAI/Google API call is made), do the following:
 *
 *   const { contactsToolDefinition, handleContactsTool } = require('../../plugins/contactsTool');
 *
 *   // 1. Add tool to the request
 *   const response = await openai.chat.completions.create({
 *     model: 'gpt-4o',
 *     messages,
 *     tools: [contactsToolDefinition],
 *     tool_choice: 'auto',
 *   });
 *
 *   // 2. Handle tool call in the response
 *   const toolCalls = response.choices[0].message.tool_calls;
 *   if (toolCalls) {
 *     for (const call of toolCalls) {
 *       if (call.function.name === 'search_contacts') {
 *         const args = JSON.parse(call.function.arguments);
 *         const result = await handleContactsTool(args, req.user.id);
 *         messages.push({ role: 'tool', tool_call_id: call.id, content: result });
 *       }
 *     }
 *     // Re-call LLM with tool result appended to messages
 *   }
 */

module.exports = { contactsToolDefinition, handleContactsTool };
