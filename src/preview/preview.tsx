import React from 'react';
import { render } from '@react-email/render';
import Email from '../emails/my-email';
import { Injectable } from '@nestjs/common';

@Injectable()
export default class PreviewRenderer {
  public constructor() {}

  public async preview(
    title: string,
    previewText: string,
    bodyText: string,
  ): Promise<string> {
    return render(
      <Email
        title={title}
        previewText={previewText}
        bodyText={bodyText}
        imageSrc="/amsterdam-logo.png"
      />,
      { pretty: true },
    );
  }
}
