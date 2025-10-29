import React from "react";
import { render } from "@react-email/render";
import Email from "../emails/my-email.tsx";

export default class PreviewRenderer {
  public constructor(private baseUrl: string) {}

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
        imageSrc={`${this.baseUrl}/amsterdam-logo.png`}
      />,
      { pretty: true },
    );
  }
}
