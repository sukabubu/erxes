import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';

import { init } from '@module-federation/enhanced/runtime';

import { NODE_ENV, REACT_APP_API_URL } from 'erxes-ui';

import '@blocknote/shadcn/style.css';
import './styles.css';

import { App } from '@/app/components/App';
import { ClientConfigError } from '@/error-handler/components/ClientConfigError';

const devRemotes = (process.env.ENABLED_PLUGINS || '')
  .split(',')
  .map((plugin) => plugin.trim())
  .filter(Boolean)
  .map((plugin) => ({
    name: `${plugin}_ui`,
    entry: `http://localhost:3016/${plugin}_ui/remoteEntry.js`,
  }));

async function initFederation() {
  const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement,
  );

  if (NODE_ENV === 'development') {
    init({
      name: 'core',
      remotes: devRemotes,
    });

    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } else {
    fetch(`${REACT_APP_API_URL}/get-frontend-plugins`)
      .then((res) => res.json())
      .then((data) => {
        init({
          name: 'core',
          remotes: data,
        });

        root.render(<App />);
      })
      .catch((error: unknown) => {
        console.error(
          'Failed to initialize frontend plugins:',
          error instanceof Error ? error.message : String(error),
        );

        root.render(
          <ClientConfigError
            error={
              error instanceof Error
                ? error
                : new Error('Failed to initialize frontend plugins')
            }
          />,
        );
      });
  }
}

initFederation().catch((err) => {
  console.error('Failed to initialize module federation:', err);
});
