/**
 * Public Cloudinary config for unsigned uploads (no API secret)
 * Cloud: dflwo8gmz | Preset: esimmongolia_upload
 */
exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || "";

  if (!cloudName || !uploadPreset) {
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({
        ok: false,
        error: "Cloudinary not configured",
        cloud_name: "",
        upload_preset: ""
      })
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ok: true,
      cloud_name: cloudName,
      upload_preset: uploadPreset,
      folders: {
        root: "esimmongolia",
        countries: "esimmongolia/countries",
        cities: "esimmongolia/cities",
        hotels: "esimmongolia/hotels",
        rooms: "esimmongolia/rooms",
        attractions: "esimmongolia/attractions",
        trains: "esimmongolia/trains",
        flights: "esimmongolia/flights",
        rentals: "esimmongolia/rentals",
        insurance: "esimmongolia/insurance",
        esim: "esimmongolia/esim"
      }
    })
  };
};
