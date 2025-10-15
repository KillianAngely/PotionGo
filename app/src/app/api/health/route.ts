export async function GET() {
  return new Response(
    JSON.stringify({
      message: "Hello from PotionGo API!",
    }),
    { status: 200 },
  )
}
