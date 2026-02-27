export async function GET() {
  return Response.json({
    alertType: 'deadline',
    urgent: true,
    message: 'Your FAFSA verification form is due in 3 days and has not been started.',
    cta: 'Walk me through it',
    action: 'start-form-walkthrough'
  })
}
