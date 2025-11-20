import nodemailer, { type Transporter } from 'nodemailer';
import Email from '../emails/my-email';
import React from 'react';
import { render, toPlainText } from '@react-email/render';
import fs from 'fs';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import type CredentialsRepository from 'src/repositories';

export class TransporterFactory {
  public constructor(
    private smtpHost: string,
    private smtpPort: number,
  ) {}

  public produce(
    smtpUsername: string,
    smtpPassword: string,
  ): Transporter<SMTPTransport.SentMessageInfo, SMTPTransport.Options> {
    return nodemailer.createTransport(
      `smtp://${this.smtpHost}:${this.smtpPort}`,
      {
        auth: {
          user: smtpUsername,
          pass: smtpPassword,
        },
      },
    );
  }
}

export class MailerFactory {
  public constructor(
    private credentialsRepository: CredentialsRepository,
    private transporterFactory: TransporterFactory,
  ) {}

  public async produce(sub: string): Promise<Mailer> {
    const credentials =
      await this.credentialsRepository.getCredentialsBySub(sub);

    return new Mailer(
      this.transporterFactory.produce(
        credentials.smtpUsername,
        credentials.smtpPassword,
      ),
    );
  }
}

export class SenderFactory {
  public constructor(
    private renderer: Renderer,
    private mailerFactory: MailerFactory,
  ) {}

  public async produce(sub: string): Promise<Sender> {
    const mailer = await this.mailerFactory.produce(sub);
    return new Sender(this.renderer, mailer);
  }
}

interface Rendered {
  html: string;
  text: string;
}

export class Renderer {
  public async render(
    title: string,
    previewText: string,
    bodyText: string,
  ): Promise<Rendered> {
    const component = (
      <Email
        title={title}
        previewText={previewText}
        bodyText={bodyText}
        imageSrc="cid:logo@amsterdam.nl"
      />
    );

    const html = await render(component);
    const text = toPlainText(html);

    return { html: html, text: text };
  }
}

export class Mailer {
  public constructor(
    private transporter: Transporter<
      SMTPTransport.SentMessageInfo,
      SMTPTransport.Options
    >,
  ) {}

  public async mail(
    from: string,
    to: string,
    subject: string,
    html: string,
    text: string,
  ): Promise<SMTPTransport.SentMessageInfo> {
    const options = {
      from: from,
      to: to,
      subject: subject,
      html: html,
      text: text,
      attachments: [
        {
          filename: 'amsterdam-logo.png',
          content: fs.readFileSync('public/amsterdam-logo.png'),
          cid: 'logo@amsterdam.nl',
        },
      ],
    };

    return this.transporter.sendMail(options);
  }
}

export default class Sender {
  public constructor(
    private renderer: Renderer,
    private mailer: Mailer,
  ) {}

  public async send(
    title: string,
    previewText: string,
    bodyText: string,
    from: string,
    to: string,
    subject: string,
  ): Promise<SMTPTransport.SentMessageInfo> {
    const { html, text } = await this.renderer.render(
      title,
      previewText,
      bodyText,
    );
    return this.mailer.mail(from, to, subject, html, text);
  }
}
