export async function GET() {
  return Response.json({
    status: 'OK',
    app: 'Sistem Administrasi Padukuhan Majegan',
    timestamp: new Date(),
  });
}
