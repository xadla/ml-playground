import { type ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

interface RenderWithRouterOptions {
  route?: string;
}

export function renderWithRouter(
  ui: ReactElement,
  options: RenderWithRouterOptions = { route: '/' }
) {
  const { route = '/' } = options;

  window.history.pushState({}, 'Test page', route);

  return {
    ...render(ui, {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      ),
    }),
  };
}
