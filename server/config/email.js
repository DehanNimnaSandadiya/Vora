import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

let transporter = null;

export const initializeEmail = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    logger.warn('Email credentials not configured. Email features will be disabled.');
    return;
  }

  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  logger.info('Email transporter initialized');
};

export const sendRoomInvite = async (to, roomName, roomCode, inviteLink) => {
  if (!transporter) {
    throw new Error('Email transporter not initialized');
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `You've been invited to join ${roomName} on Vora`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Join ${roomName}</h2>
        <p>You've been invited to join a study room on Vora!</p>
        ${roomCode ? `<p><strong>Room Code:</strong> ${roomCode}</p>` : ''}
        <p>
          <a href="${inviteLink}" 
             style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 8px; margin-top: 20px;">
            Join Room
          </a>
        </p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          ${inviteLink}
        </p>
      </div>
    `,
    text: `
You've been invited to join ${roomName} on Vora!

${roomCode ? `Room Code: ${roomCode}\n` : ''}
Join the room: ${inviteLink}
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Error sending email:', error);
    throw error;
  }
};

export const sendInviteEmail = async (to, roomName, inviterName, inviteLink) => {
  if (!transporter) {
    throw new Error('Email transporter not initialized');
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `${inviterName} invited you to join ${roomName} on Vora`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">You've been invited!</h2>
        <p><strong>${inviterName}</strong> invited you to join the study room <strong>${roomName}</strong> on Vora.</p>
        <p>
          <a href="${inviteLink}" 
             style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 8px; margin-top: 20px;">
            Accept Invitation
          </a>
        </p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          ${inviteLink}
        </p>
      </div>
    `,
    text: `
${inviterName} invited you to join ${roomName} on Vora!

Accept the invitation: ${inviteLink}
    `,
  };  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Invite email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Error sending invite email:', error);
    throw error;
  }
};