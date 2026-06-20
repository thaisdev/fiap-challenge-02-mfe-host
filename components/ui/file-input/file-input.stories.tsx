import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FileInput } from './file-input';

const meta = {
  title: 'Components/UI/FileInput',
  component: FileInput,
  args: {
    label: 'Comprovante',
    name: 'comprovante',
    accept: 'image/*,.pdf',
    disabled: false,
  },
  argTypes: {
    accept: { control: 'text' },
  },
} satisfies Meta<typeof FileInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const ImagensEPdf: Story = {
  args: {
    label: 'Comprovante',
    name: 'comprovante',
    accept: 'image/*,.pdf',
  },
};

export const ApenasImagens: Story = {
  args: {
    label: 'Foto do documento',
    name: 'foto-documento',
    accept: 'image/*',
  },
};

export const Desabilitado: Story = {
  args: {
    label: 'Comprovante',
    name: 'comprovante',
    disabled: true,
  },
};
