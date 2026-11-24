// Email system replaced with phone-based guest checkout
// Stubbed for safe backward compatibility without external dependencies
const sendEmail = async ({ to, subject, html }) => {
  console.log(`[Email Stub] To: ${to}, Subject: ${subject}`);
  return { id: "email_disabled" };
};

export default sendEmail;
