export async function GET() {
  return Response.json({
    status: 'OK',
    app: 'Sistem Administrasi Dukuh Majegan',
    timestamp: new Date(),
  });
}
