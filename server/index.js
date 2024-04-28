const express = require("express");
const app = express();
const cors = require("cors");
const multer = require("multer");
const xlsx = require("xlsx");
const connectToDb = require("./connectToDb");
const User = require("./model");
const api2pdf = require("api2pdf");
const nodemailer = require("nodemailer");
const ejs = require("ejs");
const dotenv = require("dotenv");
dotenv.config();

const PORT = process.env.PORT || 4000;
const mongoURI = process.env.MONGO_URI;
const emailSender = process.env.EMAIL_SENDER;
const emailSenderPassword = process.env.EMAIL_SENDER_PASSWORD;
const api2pdfApiKey = process.env.API2PDF_API_KEY;

const a2pClient = new api2pdf(api2pdfApiKey);

app.use(express.json());
app.use(cors());
app.set("view engine", "ejs");

connectToDb(mongoURI);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const generateCertificate = async (user) => {
  const pdfFileName = `certificate_${user.name.replace(/\s+/g, "_")}.pdf`;

  const htmlContent = await ejs.renderFile("certificate.ejs", { user });

  const pdfOptions = {
    inline: false,
    filename: pdfFileName,
  };

  try {
    const result = await a2pClient.wkHtmlToPdf(htmlContent, pdfOptions);
    const pdfUrl = result.FileUrl;
    user.pdfUrl = pdfUrl;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailSender,
        pass: emailSenderPassword,
      },
    });

    const mailOptions = {
      from: emailSender,
      to: user.email,
      subject: "🌳 Your Tree-tastic Certification Has Arrived! 🌿",
      text: `Hey ${user.name}! 🌟\n\nHats off to you for being an eco-hero! 🌍 Your generosity is like sunshine for our planet. 🌞\n\nDrumroll, please... 🥁 We're thrilled to share your dazzling Tree Donation Certification! 🎉 Your $${user.amount} donation for planting ${user.noOfTrees} trees is a monumental contribution to our green revolution. 🌱\n\nReady to showcase your green thumb? 🌳 The certificate is attached to this email as a PDF file. Simply open the attachment to view and download your certificate. Keep rocking the green vibes! 🌿\n\nCheers,\nThe Tree Tribe 🌲`,
      attachments: [
        {
          filename: pdfFileName,
          path: pdfUrl,
          contentType: "application/pdf",
        },
      ],
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });
  } catch (err) {
    console.log(err);
  }
};

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const userDataWithTrees = jsonData.map((user) => ({
      ...user,
      noOfTrees: user.amount / 100,
    }));

    const result = await User.insertMany(userDataWithTrees);

    for (const user of userDataWithTrees) {
      await generateCertificate(user);
    }

    res.status(200).send("Data successfully uploaded to MongoDB");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error " + error);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
