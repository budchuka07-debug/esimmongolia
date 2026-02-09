export async function handler(event) {
  // QPay callback ирэхэд энд log үлдээнэ.
  // Дараагийн шатанд: төлбөр батлагдмагц order систем/Google Sheet-д тэмдэглэх, email/whatsapp automation хийх боломжтой.
  try{
    const payload = event.body ? JSON.parse(event.body) : {};
    console.log("QPay callback:", payload);
  }catch(e){
    console.log("QPay callback (non-json):", event.body);
  }
  return { statusCode: 200, body: "OK" };
}