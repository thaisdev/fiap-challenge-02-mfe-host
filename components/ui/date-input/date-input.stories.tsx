import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { DateInput } from './date-input';

const meta = {
  title: 'Components/UI/DateInput',
  component: DateInput,
  args: {
    label: 'Data',
    name: 'date',
    value: '2026-06-25',
    disabled: false,
    onChange: () => {},
  },
} satisfies Meta<typeof DateInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Empty: Story = {
  args: {
    value: '',
  },
};

export const WithMin: Story = {
  args: {
    label: 'Data fim',
    name: 'end-date',
    min: '2026-06-01',
  },
};

export const WithMax: Story = {
  args: {
    label: 'Data início',
    name: 'start-date',
    max: '2026-06-25',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
