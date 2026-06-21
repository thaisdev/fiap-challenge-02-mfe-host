import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type McintoshFinancialVisibilityElementProps = DetailedHTMLProps<
  HTMLAttributes<HTMLElement>,
  HTMLElement
> & {
  'customer-id'?: string;
};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'mcintosh-financial-visibility': McintoshFinancialVisibilityElementProps;
    }
  }
}
