import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import type { FinancialVisibilityData } from '@/app/dashboard/_store/account/account.types';

export type McintoshFinancialVisibilityElement = HTMLElement & {
  financialVisibilityData?: FinancialVisibilityData;
};

type McintoshFinancialVisibilityElementProps = DetailedHTMLProps<
  HTMLAttributes<McintoshFinancialVisibilityElement>,
  McintoshFinancialVisibilityElement
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
