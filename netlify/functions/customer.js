exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  try {
    const data = JSON.parse(event.body || "{}");

    const webhookUrl = process.env.LEAD_WEBHOOK_URL;

    if (!webhookUrl) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "LEAD_WEBHOOK_URL env variable not found",
        }),
      };
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: data.name || "",
        phone: data.phone || "",
        email: data.email || "",
        facebook: data.facebook || "",
        plan: data.plan || "",
        price: data.price || "",
        page: data.page || "",
        createdAt: new Date().toISOString(),
      }),
    });

    const text = await response.text();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        response: text,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
      }),
    };
  }
};
