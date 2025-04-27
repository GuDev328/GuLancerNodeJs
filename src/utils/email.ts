import nodemailer from 'nodemailer';
import { env } from '~/constants/config';
import fs from 'fs';
import path from 'path';

// Khởi tạo transporter cho nodemailer
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: env.emailApp,
    pass: env.emailAppPassword
  }
});

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

/**
 * Hàm gửi email chung
 */
const sendEmail = async (options: SendEmailOptions): Promise<void> => {
  try {
    await transporter.sendMail({
      from: `"GuLancer" <${env.emailApp}>`,
      to: Array.isArray(options.to) ? options.to.join(',') : options.to,
      subject: options.subject,
      html: options.html
    });
  } catch (error) {
    console.error('Lỗi khi gửi email:', error);
    throw new Error('Không thể gửi email');
  }
};

/**
 * Gửi email mật khẩu cho người dùng mới
 */
export const sendPasswordEmail = async (to: string, userName: string, password: string): Promise<void> => {
  const template = fs.readFileSync(path.resolve('src/templates/SendPassword.html'), 'utf8');
  const html = template
    .replace('{{userName}}', userName)
    .replace('{{password}}', password)
    .replace('{{loginUrl}}', `${env.clientUrl}/login`)
    .replace('{{year}}', new Date().getFullYear().toString());

  await sendEmail({
    to,
    subject: 'Chào mừng đến với GuLancer - Thông tin đăng nhập của bạn',
    html
  });
};

/**
 * Gửi email đặt lại mật khẩu
 */
export const sendResetPasswordEmail = async (to: string, userName: string, resetToken: string): Promise<void> => {
  const template = fs.readFileSync(path.resolve('src/templates/ForgotPassword.html'), 'utf8');
  const html = template
    .replace('{{userName}}', userName)
    .replace('{{resetLink}}', `${env.clientUrl}/reset-password?token=${resetToken}`)
    .replace('{{year}}', new Date().getFullYear().toString());

  await sendEmail({
    to,
    subject: 'GuLancer - Yêu cầu đặt lại mật khẩu',
    html
  });
};
