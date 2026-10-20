import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import PageLayout from './PageLayout';

vi.mock('./Header', () => ({ default: () => <header>Header</header> }));
vi.mock('./Call', () => ({ Call: () => null }));

describe('PageLayout viewport constraint', () => {
  it('opts into a desktop viewport-height shell without fixing the header height', () => {
    const markup = renderToStaticMarkup(
      <PageLayout fitViewport>AI Agent</PageLayout>,
    );
    expect(markup).toContain('md:h-dvh');
    expect(markup).toContain('md:min-h-0');
    expect(markup).toContain('md:overflow-hidden');
    expect(markup).toContain('AI Agent');
  });

  it('keeps the normal scrolling page for other modes', () => {
    const markup = renderToStaticMarkup(<PageLayout>SDK demo</PageLayout>);
    expect(markup).not.toContain('md:h-dvh');
    expect(markup).not.toContain('md:overflow-hidden');
    expect(markup).toContain('overflow-y-auto');
  });
});
