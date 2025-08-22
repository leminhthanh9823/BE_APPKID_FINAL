const nodemailer = require('nodemailer');
require('dotenv').config(); 

var emailFormat = ''; 
function buildEmailHtml(content) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notification from Your Kids English Learning App</title>
    <style type="text/css">
        /* Reset CSS for better email client compatibility */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; }

        /* Reset default browser styles */
        body { margin: 0; padding: 0; }
        img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        a { text-decoration: none; }

        /* General Font and Colors */
        body {
            font-family: 'Arial', sans-serif; /* Friendly, common font */
            background-color: #f0f0f0; /* Soft background color */
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }

        /* Main email container */
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff; /* White background for content */
            border-radius: 12px; /* Rounded corners */
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); /* Gentle shadow */
            border: 2px solid #FFA07A; /* Added border here: Light orange color */
            overflow: hidden;
        }

        /* Email Header */
        .header {
            background-color: #FF6347; /* Tomato Red */
            padding: 25px 20px;
            text-align: center;
            border-top-left-radius: 12px;
            border-top-right-radius: 12px;
        }
        .header h1 {
            color: #FFD700; /* Gold Yellow */
            font-size: 32px;
            margin: 0;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2); /* Text shadow */
        }
        /* No img tag for logo as requested previously */

        /* Main Content Section */
        .content {
            padding: 30px 40px;
            color: #333333;
            line-height: 1.6;
            text-align: left;
        }
        .content p {
            margin-bottom: 15px;
            font-size: 16px;
        }
        .content strong {
            color: #FF6347; /* Highlight with red */
        }

        /* Call to Action Button */
        .button-container {
            text-align: center;
            padding: 20px 40px 30px;
        }
        .button {
            display: inline-block;
            background-color: #FFD700; /* Gold Yellow */
            color: #FF6347; /* Red text */
            padding: 15px 30px;
            border-radius: 8px; /* Rounded corners */
            font-size: 18px;
            font-weight: bold;
            text-decoration: none;
            transition: background-color 0.3s ease; /* Color transition effect */
            box-shadow: 0 4px 10px rgba(255, 215, 0, 0.4); /* Light shadow */
            border: 2px solid #FFA07A; /* Light orange border */
        }
        /* Hover effect for button (may not work on all email clients) */
        .button:hover {
            background-color: #FFC107; /* Darker yellow on hover */
        }

        /* Email Footer */
        .footer {
            background-color: #FF6347; /* Tomato Red */
            padding: 20px;
            text-align: center;
            color: #FFFFFF; /* White text */
            font-size: 14px;
            border-bottom-left-radius: 12px;
            border-bottom-right-radius: 12px;
        }
        .footer a {
            color: #FFD700; /* Yellow link */
            text-decoration: underline;
        }

        /* Responsive styles (may not be fully supported) */
        @media only screen and (max-width: 500px) {
            .email-container {
                margin: 10px;
                border-radius: 0;
            }
            .header h1 {
                font-size: 24px;
            }
            .content {
                padding: 20px;
            }
            .button {
                padding: 12px 25px;
                font-size: 16px;
            }
        }
    </style>
</head>
<body>
    <center>
        <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
            <tr>
                <td align="center" style="padding: 20px 0;">
                    <table border="0" cellpadding="0" cellspacing="0" class="email-container" width="600" role="presentation">
                        <tr>
                            <td align="center" class="header">
                                <h1>Learning English Is Fun With EngKid!</h1>
                            </td>
                        </tr>

                        <tr>
                            <td align="left" class="content">
                                <p>Dear students,</p>
                                <p>We are EngKid - the English learning app for children, where learning turns into colorful adventures!</p>
                                <p>Here's a special message for you:</p>
                                <p style="font-size: 18px; color: #FF6347; font-weight: bold; text-align: center; margin: 25px 0;">
                                    ${content}
                                </p>
                                <p>We are delighted to accompany your child on this English discovery journey. Let's continue this enriching learning adventure together!</p>
                            </td>
                        </tr>

                        <tr>
                            <td align="center" class="button-container">
                                <a href="https://your-app-link.com" class="button" target="_blank">Explore Now</a>
                            </td>
                        </tr>

                        <tr>
                            <td align="center" class="footer">
                                <p>&copy; 2025 EngKid. All rights reserved.</p>
                                <p>If you have any questions, please contact us at <a href="mailto:EngKid.SEP490@gmail.com">EngKid.SEP490@gmail.com</a></p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </center>
</body>
</html>`;
}

const sendEmail = async (to, subject, content) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
            });


        const htmlContent = buildEmailHtml(content);

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'EngKid.SEP490@gmail.com',
            to: to,
            subject: subject,
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error("Lỗi khi gửi email:", error);
        return false;
    }
};

module.exports = sendEmail;