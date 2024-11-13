import nodemailer from "nodemailer";

const sendEmailService = async ({ to, subject, html }) => {
  // email configuration
  const transporter = nodemailer.createTransport({
    host: "localhost",
    service: "gmail",
    port: 465,
    secure: false,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const info = await transporter.sendMail({
    from: `" " <${process.env.EMAIL}>`,
    to,
    subject,
    html,
  });

  return info.accepted.length ? true : false;
};

export default sendEmailService;
