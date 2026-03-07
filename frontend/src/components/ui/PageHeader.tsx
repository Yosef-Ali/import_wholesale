import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: action ? 'space-between' : undefined,
      marginBottom: '1.75rem',
    }}>
      <div>
        <h1 style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 700,
          fontSize: '1.5rem',
          color: 'var(--text)',
          letterSpacing: '-0.025em',
          margin: '0 0 0.25rem',
        }}>{title}</h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
          {subtitle}
        </p>
      </div>
      {action}
    </div>
  );
}

interface LoadingStateProps {
  message?: string;
  padding?: string;
}

export function LoadingState({ message = 'Loading…', padding = '3rem 0' }: LoadingStateProps) {
  return (
    <div style={{
      textAlign: 'center',
      padding,
      fontFamily: 'var(--font-sans)',
      fontSize: '0.875rem',
      color: 'var(--text-muted)',
    }}>
      {message}
    </div>
  );
}
