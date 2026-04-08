import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly senderEmail: string;
  private readonly appName: string;
  private readonly senderName: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const portRaw = this.configService.get<string>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const port = Number(portRaw);

    if (!host || !portRaw || Number.isNaN(port) || !user || !pass) {
      throw new InternalServerErrorException('SMTP configuration is incomplete');
    }

    this.senderEmail = user;
    this.appName = this.configService.get<string>('APP_NAME')?.trim() || 'ClassHub';
    this.senderName = `${this.appName} Support`;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: Number(port) === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  async sendOtpEmail(email: string, otp: string): Promise<void> {
    const emailContent = this.buildPasswordResetOtpEmail(otp);

    await this.transporter.sendMail({
      from: `"${this.senderName}" <${this.senderEmail}>`,
      to: email,
      subject: 'Reset your password – OTP inside',
      text: emailContent.text,
      html: emailContent.html,
    });

    this.logger.log(`Password reset OTP email sent to ${this.maskEmail(email)}`);
  }

  private maskEmail(email: string): string {
    const [localPart, domain] = String(email || '').split('@');
    if (!localPart || !domain) {
      return '***';
    }
    if (localPart.length <= 2) {
      return `**@${domain}`;
    }
    const maskedLocal = `${localPart[0]}${'*'.repeat(Math.max(localPart.length - 2, 1))}${localPart[localPart.length - 1]}`;
    return `${maskedLocal}@${domain}`;
  }

  private buildPasswordResetOtpEmail(otp: string): { html: string; text: string } {
    const title = 'Reset your password';
    const intro = 'You requested to reset your password. Use the OTP below to proceed.';
    const otpFormatted = otp.split('').join(' ');
    const html = this.buildTransactionalEmailTemplate({
      title,
      intro,
      contentHtml: `
        <div style="margin: 24px 0; text-align: center;">
          <div
            style="display: inline-block; border: 1px solid #E2E8F0; border-radius: 12px; background-color: #F8FAFC; padding: 14px 20px; font-size: 28px; font-weight: 700; color: #0F172A; letter-spacing: 8px; line-height: 1.2;"
          >
            ${otpFormatted}
          </div>
        </div>
        <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.6;">
          This OTP is valid for <strong>10 minutes</strong>.
        </p>
        <p style="margin: 8px 0 0; color: #334155; font-size: 14px; line-height: 1.6;">
          Do not share this code with anyone.
        </p>
      `,
      footer:
        'If you did not request this, you can safely ignore this email.',
    });

    const text = [
      `${this.appName}`,
      '',
      title,
      '',
      intro,
      '',
      `OTP: ${otp}`,
      '',
      'This OTP is valid for 10 minutes.',
      'Do not share this code with anyone.',
      '',
      'If you did not request this, you can safely ignore this email.',
    ].join('\n');

    return { html, text };
  }

  private buildTransactionalEmailTemplate(params: {
    title: string;
    intro: string;
    contentHtml: string;
    footer: string;
  }): string {
    const { title, intro, contentHtml, footer } = params;
    const capIconSvg = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M22 10L12 5L2 10L12 15L22 10Z" stroke="#1E293B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6 12.5V16.5C6 17.2 8.7 19 12 19C15.3 19 18 17.2 18 16.5V12.5" stroke="#1E293B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    return `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${title}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: Arial, Helvetica, sans-serif;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F1F5F9; padding: 24px 12px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08); overflow: hidden;">
                  <tr>
                    <td style="height: 6px; background: linear-gradient(135deg, #5DA8FA 0%, #22C55E 100%); font-size: 0; line-height: 0;">&nbsp;</td>
                  </tr>
                  <tr>
                    <td style="padding: 28px 28px 20px; text-align: center;">
                      <div style="display: inline-flex; align-items: center; justify-content: center; width: 46px; height: 46px; border-radius: 12px; background-color: #FFFFFF; border: 1px solid #DBEAFE; box-shadow: 0 4px 8px rgba(93, 168, 250, 0.16);">
                        ${capIconSvg}
                      </div>
                      <p style="margin: 12px 0 0; color: #334155; font-size: 14px; font-weight: 700; letter-spacing: 0.2px;">
                        ${this.appName}
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 28px 28px;">
                      <h1 style="margin: 0 0 12px; color: #0F172A; font-size: 24px; line-height: 1.3; text-align: center;">
                        ${title}
                      </h1>
                      <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.7; text-align: center;">
                        ${intro}
                      </p>
                      ${contentHtml}
                      <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 24px 0 12px;" />
                      <p style="margin: 0; color: #64748B; font-size: 12px; line-height: 1.6; text-align: center;">
                        ${footer}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }
}
