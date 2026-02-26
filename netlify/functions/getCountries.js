

exports.handler = async () => {
  try {
    const LOGIN_URL = process.env.AIRHUB_LOGIN_URL;
    const PLAN_URL = process.env.AIRHUB_PLAN_URL;
    const EMAIL = process.env.AIRHUB_EMAIL;
    const PASSWORD = process.env.AIRHUB_PASSWORD;
    const PARTNER_CODE = process.env.AIRHUB_PARTNER_CODE;

    // 1️⃣ Login
    const loginRes = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: EMAIL,
        password: PASSWORD,
      }),
    });

    const loginData = await loginRes.json();
    if (!loginData?.data?.token) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Airhub login failed" }),
      };
    }

    const token = loginData.data.token;

    // 2️⃣ Нэг л удаа бүх plan авах
    const planRes = await fetch(PLAN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        partnerCode: PARTNER_CODE,
        multiplecountrycode: [],
      }),
    });

    const planData = await planRes.json();

    if (!planData?.data?.getInformation) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "No plan data" }),
      };
    }

    const plans = planData.data.getInformation;

    // 3️⃣ Улс бүрийг unique болгох
    const countryMap = {};

    plans.forEach((plan) => {
      const code = plan.countryCode;
      if (!countryMap[code]) {
        countryMap[code] = {
          code,
          name: plan.countryName,
        };
      }
    });

    const countries = Object.values(countryMap);

    return {
      statusCode: 200,
      body: JSON.stringify(countries),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
