/**
 * Travel AI — chat, hotel search, itineraries (OpenAI + Supabase + mock fill).
 * POST /.netlify/functions/travel-ai
 * Actions: chat (default), search_hotels
 * Always returns HTTP 200 with { success, error, ... }.
 */
const { randomUUID } = require("crypto");
const { mergeFromHistory } = require("./lib/travel-ai-intent");
const tools = require("./lib/travel-ai-tools");
const consultant = require("./lib/ai-consultant");

const OPENAI_API = "https://api.openai.com/v1/responses";
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const FALLBACK_MSG =
  "Уучлаарай, AI зөвлөх түр холбогдож чадсангүй. Буудал, маршрут эсвэл eSIM товчийг сонгоод хайлтаа үргэлжлүүлээрэй.";

const TOOL_DEFS = [
  {
    type: "function",
    name: "search_hotels",
    description: "Search hotels in a city. Returns Supabase verified hotels plus mock recommendations if needed.",
    parameters: {
      type: "object",
      properties: {
        city_id: { type: "string" },
        city: { type: "string" },
        nights: { type: "number" },
        guests: { type: "number" },
        stars: { type: "number" },
        district: { type: "string" },
        budget_min: { type: "number" },
        budget_max: { type: "number" },
        wants_cheaper: { type: "boolean" }
      }
    }
  },
  {
    type: "function",
    name: "search_esim_plans",
    description: "Search eSIM data plans for China or travel duration.",
    parameters: {
      type: "object",
      properties: {
        nights: { type: "number" },
        country: { type: "string" }
      }
    }
  },
  {
    type: "function",
    name: "create_itinerary",
    description: "Create a day-by-day travel itinerary for a city.",
    parameters: {
      type: "object",
      properties: {
        city_id: { type: "string" },
        city: { type: "string" },
        nights: { type: "number" },
        guests: { type: "number" }
      }
    }
  },
  {
    type: "function",
    name: "search_flights",
    description: "Search flights from Ulaanbaatar to destination city.",
    parameters: {
      type: "object",
      properties: {
        city_id: { type: "string" },
        city: { type: "string" }
      }
    }
  },
  {
    type: "function",
    name: "get_supabase_catalog",
    description: "Get available countries and cities from Supabase catalog.",
    parameters: { type: "object", properties: {} }
  }
];

const SYSTEM_INSTRUCTIONS = `Та eSIM Mongolia-ийн аяллын зөвлөх AI.
Хэрэглэгч өөр хэл заавал хүсэхээс бусад тохиолдолд ЗӨВХӨН Монгол хэлээр хариул.
Монгол хэлээр энгийн, найрсаг, зөвлөх мэт хариул.
- Заавал нэг л тодруулга асуу (хэрвээ хот, хоног, хүн мэдээгүй бол).
- Буудлын боломж баталгаажсан гэж бүү хэл. "Үнэ болон өрөөний боломж захиалга баталгаажуулах үед шалгагдана" гэж хэл.
- Хуурамч захиалга, review, баталгаажсан өрөө гэж бүү хэл.
- Tool-ийн өгөгдөлд тулгуурлан 5 хамгийн сайн сонголтыг тайлбарла.
- Disneyland, төв, хямд гэх мэт шүүлтүүр санал болго.`;

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
}

function respond(body) {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", ...cors() },
    body: JSON.stringify(body)
  };
}

function ok(data) {
  return respond({ success: true, error: null, ...data });
}

function fail(error, data = {}) {
  return respond({ success: false, error: error || "unknown_error", ...data });
}

function extractOutputText(response) {
  const chunks = [];
  for (const item of response.output || []) {
    if (item.type === "message") {
      for (const part of item.content || []) {
        if (part.type === "output_text" && part.text) chunks.push(part.text);
      }
    }
  }
  return chunks.join("\n").trim();
}

function extractFunctionCalls(response) {
  return (response.output || []).filter((item) => item.type === "function_call");
}

async function callOpenAI(body) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(OPENAI_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[travel-ai] OpenAI error", res.status, errText.slice(0, 300));
    return null;
  }
  return res.json();
}

function buildInputFromHistory(history, message) {
  const items = [];
  (history || []).slice(-8).forEach((m) => {
    if (!m?.content) return;
    items.push({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content
    });
  });
  items.push({ role: "user", content: message });
  return items;
}

function cardsFromToolResults(toolResults) {
  let cards = [];
  if (toolResults.search_hotels) cards = cards.concat(tools.hotelsToCards(toolResults.search_hotels));
  if (toolResults.search_flights) cards = cards.concat(tools.flightsToCards(toolResults.search_flights));
  if (toolResults.search_esim_plans) cards = cards.concat(tools.esimToCards(toolResults.search_esim_plans));
  return cards;
}

async function runOpenAIWithTools(message, history, intent, devLog) {
  const toolResults = {};
  let response = await callOpenAI({
    model: MODEL,
    instructions: SYSTEM_INSTRUCTIONS,
    input: buildInputFromHistory(history, message),
    tools: TOOL_DEFS,
    tool_choice: "auto"
  });

  if (!response) {
    devLog.openai_status = "failed";
    return null;
  }

  devLog.openai_status = response.status || "completed";
  let guard = 0;

  while (guard < 4) {
    const calls = extractFunctionCalls(response);
    if (!calls.length) break;

    const toolOutputs = [];
    for (const call of calls) {
      let args = {};
      try {
        args = JSON.parse(call.arguments || "{}");
      } catch {
        args = {};
      }
      devLog.tool = call.name;
      const result = await tools.runTool(call.name, args, intent, devLog);
      toolResults[call.name] = result;
      toolOutputs.push({
        type: "function_call_output",
        call_id: call.call_id,
        output: JSON.stringify(result)
      });
    }

    response = await callOpenAI({
      model: MODEL,
      previous_response_id: response.id,
      input: toolOutputs
    });
    if (!response) {
      devLog.openai_status = "tool_round_failed";
      return null;
    }
    devLog.openai_status = response.status || "completed";
    guard += 1;
  }

  const text = extractOutputText(response);
  if (!text) return null;
  return { reply: text, toolResults };
}

function pickToolsForIntent(intent) {
  switch (intent.intent) {
    case "hotel_search": return ["search_hotels"];
    case "flight_search": return ["search_flights"];
    case "esim_search": return ["search_esim_plans"];
    case "itinerary": return ["create_itinerary"];
    default: return intent.city_id ? ["search_hotels"] : [];
  }
}

async function executeIntentTools(intent, devLog) {
  const toolResults = {};
  const names = pickToolsForIntent(intent);
  for (const name of names) {
    devLog.tool = name;
    toolResults[name] = await tools.runTool(name, {}, intent, devLog);
  }
  return toolResults;
}

function buildLocalReply(message, intent, toolResults) {
  if (intent.intent === "hotel_search" && toolResults.search_hotels) {
    const h = toolResults.search_hotels;
    const totalEst = (h.hotels || []).reduce((s, x) => s + (x.price_per_night || 0), 0) * (intent.nights || 5);
    const lines = [
      `${intent.check_in ? intent.check_in + "-нд " : ""}${intent.city || h.city} хотод ${intent.nights || 5} хоног, ${intent.guests || 2} хүнд тохирох **${(h.hotels || []).length} буудлын санал** оллоо.`,
      "",
      ...(h.hotels || []).map((x, i) =>
        `${i + 1}. **${x.name}** (${x.stars}★) — ${Number(x.price_per_night || 0).toLocaleString("mn-MN")}₮/шөнө · ${x.district || "төв"}`
      ),
      "",
      `Ойролцоо нийт төсөв: **${Number(totalEst).toLocaleString("mn-MN")}₮** (${intent.nights || 5} шөнө). Үнэ болон өрөөний боломж захиалга баталгаажуулах үед шалгагдана.`,
      "",
      "Disneyland ойролцоо, хотын төв эсвэл хямд сонголтоор шүүж өгч болно — жишээ нь «арай хямд» гэж бичээрэй."
    ];
    return {
      reply: lines.join("\n"),
      cards: cardsFromToolResults(toolResults),
      quickReplies: consultant.QUICK_REPLIES?.slice(0, 4) || [],
      ctas: [{ id: "hotel_suggest", label: "Буудал санал авах" }],
      context: intent
    };
  }

  if (intent.intent === "esim_search" && toolResults.search_esim_plans) {
    const e = toolResults.search_esim_plans;
    const lines = [
      `Хятад ${e.requested_days || 20} хоногийн аялалд тохирох eSIM санал:`,
      "",
      ...(e.plans || []).map((p, i) => `${i + 1}. ${p.name} — ${Number(p.price_mnt).toLocaleString("mn-MN")}₮`)
    ];
    return {
      reply: lines.join("\n"),
      cards: cardsFromToolResults(toolResults),
      quickReplies: [],
      ctas: [{ id: "esim_view", label: "eSIM харах" }],
      context: intent
    };
  }

  if (intent.intent === "itinerary" && toolResults.create_itinerary) {
    const it = toolResults.create_itinerary;
    return {
      reply: `🗺 ${it.summary}\n\n${(it.itinerary || []).join("\n")}`,
      cards: cardsFromToolResults(toolResults),
      quickReplies: consultant.QUICK_REPLIES?.slice(0, 4) || [],
      ctas: [],
      context: intent
    };
  }

  const full = consultant.buildConsultantReply({
    city_id: intent.city_id,
    city: intent.city,
    country: intent.country_mn,
    days: intent.nights,
    people: intent.guests,
    month: intent.month,
    day: intent.day,
    wantsDisney: intent.wants_disney
  }, message);

  if (full) {
    return {
      reply: full.reply,
      cards: [...(full.cards || []), ...cardsFromToolResults(toolResults)],
      quickReplies: full.quickReplies || [],
      ctas: full.ctas || [],
      context: { ...intent, ...(full.context || {}) }
    };
  }

  const greet = consultant.buildGreetingReply();
  return {
    reply: greet.reply,
    cards: greet.cards || [],
    quickReplies: greet.quickReplies || [],
    ctas: greet.ctas || [],
    context: intent
  };
}

async function handleChat(body) {
  const message = String(body.message || "").trim();
  if (!message) return fail("message_required");

  const sessionId = body.sessionId || randomUUID();
  const history = Array.isArray(body.history) ? body.history.slice(-12) : [];
  const prevContext = body.context && typeof body.context === "object" ? body.context : {};

  const devLog = {
    sessionId,
    openai_status: "skipped",
    intent: null,
    tool: null,
    supabase_count: 0,
    mock_count: 0
  };

  const intent = mergeFromHistory(history, message, prevContext);
  devLog.intent = intent.intent;

  let result = null;

  try {
    const toolResults = await executeIntentTools(intent, devLog);
    const local = buildLocalReply(message, intent, toolResults);

    if (process.env.OPENAI_API_KEY) {
      const ai = await runOpenAIWithTools(message, history, intent, devLog);
      if (ai?.reply) {
        const mergedTools = { ...toolResults, ...ai.toolResults };
        result = {
          reply: ai.reply,
          cards: cardsFromToolResults(mergedTools).length
            ? cardsFromToolResults(mergedTools)
            : local.cards,
          quickReplies: local.quickReplies,
          ctas: local.ctas,
          context: local.context
        };
        devLog.openai_status = devLog.openai_status || "ok";
      }
    }

    if (!result) {
      result = local;
      devLog.openai_status = process.env.OPENAI_API_KEY ? "fallback_local" : "local_no_key";
    }
  } catch (err) {
    console.error("[travel-ai] pipeline failed", err.message);
    result = {
      reply: FALLBACK_MSG,
      cards: [],
      quickReplies: consultant.QUICK_REPLIES?.slice(0, 3) || [],
      ctas: [],
      context: intent
    };
    devLog.openai_status = "hard_fallback";
  }

  console.log("[travel-ai]", JSON.stringify({
    action: "chat",
    sessionId: devLog.sessionId,
    intent: devLog.intent,
    tool: devLog.tool,
    supabase_count: devLog.supabase_count,
    mock_count: devLog.mock_count,
    openai_status: devLog.openai_status
  }));

  return ok({
    action: "chat",
    sessionId,
    reply: result.reply,
    cards: result.cards || [],
    quickReplies: result.quickReplies || [],
    ctas: result.ctas || [],
    context: result.context || intent,
    locale: body.locale || "mn",
    _engine: devLog.openai_status,
    supabase_count: devLog.supabase_count,
    mock_count: devLog.mock_count
  });
}

async function handleHotelSearch(body) {
  const devLog = { tool: "search_hotels_full", supabase_count: 0, mock_count: 0 };
  try {
    const payload = await tools.searchHotelsFull(body, devLog);
    console.log("[travel-ai]", JSON.stringify({
      action: "search_hotels",
      city_id: body.city_id,
      supabase_count: devLog.supabase_count,
      mock_count: devLog.mock_count,
      total: payload.results?.length || 0
    }));

    if (!payload.success) {
      return fail(payload.error || "hotel_search_failed", {
        action: "search_hotels",
        results: [],
        meta: payload.meta || {}
      });
    }

    return ok({
      action: "search_hotels",
      results: payload.results || [],
      meta: payload.meta || {},
      supabase_count: devLog.supabase_count,
      mock_count: devLog.mock_count
    });
  } catch (err) {
    console.error("[travel-ai] hotel search failed", err.message);
    return fail(err.message || "hotel_search_error", {
      action: "search_hotels",
      results: [],
      meta: {}
    });
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors(), body: "" };
  if (event.httpMethod !== "POST") {
    return respond({ success: false, error: "method_not_allowed" });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return fail("invalid_json");
  }

  const action = body.action || "chat";
  if (action === "search_hotels") return handleHotelSearch(body);
  return handleChat(body);
};
