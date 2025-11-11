import { readFileSync } from 'fs';
import PreviewRenderer from './preview';
import { describe, it, expect } from 'vitest';

describe('PreviewRenderer', () => {
  describe('preview', () => {
    it('should render a preview', async () => {
      const previewer = new PreviewRenderer('http://localhost:3001');
      const preview = await previewer.preview(
        'My Title',
        'My Preview Text',
        'My Body Text',
      );

      const expectedPreviewResponseBody = readFileSync(
        './test/resources/previewResponse.html',
        { encoding: 'utf-8' },
      );

      expect(preview).toStrictEqual(expectedPreviewResponseBody);
    });
  });
});
