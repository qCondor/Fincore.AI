'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a1628',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
          padding: '24px'
        }}>
          <div style={{ maxWidth: '400px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>
              App Error
            </h1>
            <p style={{ opacity: 0.7, marginBottom: '24px' }}>
              Something went critically wrong. Please reload the app.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '12px 32px',
                backgroundColor: '#005FCC',
                color: 'white',
                border: 'none',
                borderRadius: '999px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Reload App
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
