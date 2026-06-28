'use client';
import { useState } from 'react';
import { ServiceUnderConstructionModal } from './service-under-construction-modal';
import { Button } from './button'; // caminho corrigido

type ServiceOption = {
  id: string;
  label: string;
};

const serviceOptions: readonly ServiceOption[] = [
  { id: 'loan', label: 'Empréstimo' },
  { id: 'my-cards', label: 'Meus cartões' },
  { id: 'donations', label: 'Doações' },
  { id: 'instant-payments', label: 'Pix' },
  { id: 'insurance', label: 'Seguros' },
  { id: 'mobile-top-up', label: 'Crédito celular' },
];
const readyServices = ['my-cards'];

export function OtherServicesPanel() {
  const [activeService, setActiveService] = useState<ServiceOption | null>(null);

  const handleServiceClick = (option: ServiceOption) => {
    setActiveService(option);
  };

  return (
    <section className="relative cursor-pointer overflow-hidden rounded-md p-5" aria-live="polite">
      {activeService?.id === 'my-cards' ? (
        <div className="bg-[#cbcbcb] rounded-2xl p-6 sm:p-10">
          <h2 className="text-xl sm:text-2xl font-bold text-black">Meus Cartões</h2>

          <div className="pt-5">
            <p className="text-body-md">Cartão Físico</p>
          </div>

          {/* Primeiro cartão */}
          <div className="flex flex-col lg:flex-row items-start gap-6 mt-6">
            <div className="bg-[#004d61] rounded-2xl w-full sm:w-[300px] lg:w-[350px] p-4 shadow-md flex-shrink-0">
              <p className="text-xl sm:text-2xl text-white">Byte</p>
              <p className="text-body-md tracking-[0.05em] text-white">Platinum</p>
              <p className="text-body-md mt-8 text-white">Joana Fonseca Gomes</p>
              <p className="text-body-md mt-2 text-white">•••••••••</p>
            </div>

            <div className="flex flex-col flex-1 items-stretch">
              <Button styleType="primary">Configurar</Button>
              <Button styleType="secondary" className="mt-3">
                Bloquear
              </Button>
              <p className="mt-4 text-sm text-center text-gray-700">Função: Débito/Crédito</p>
            </div>
          </div>

          {/* Segundo cartão */}
          <div className="flex flex-col lg:flex-row items-start gap-6 mt-6">
            <div className="bg-[#8b8b8b] rounded-2xl w-full sm:w-[300px] lg:w-[350px] p-4 shadow-md flex-shrink-0">
              <p className="text-xl sm:text-2xl text-white">Byte</p>
              <p className="text-body-md tracking-[0.05em] text-white">Platinum</p>
              <p className="text-body-md mt-8 text-white">Joana Fonseca Gomes</p>
              <p className="text-body-md mt-2 text-white">•••••••••</p>
            </div>

            <div className="flex flex-col flex-1 items-stretch">
              <Button styleType="primary">Configurar</Button>
              <Button styleType="secondary" className="mt-3">
                Bloquear
              </Button>
              <p className="mt-4 text-sm text-center text-gray-700">Função: Débito/Crédito</p>
            </div>
          </div>

          <div className="mt-6">
            <Button styleType="primary" onClick={() => setActiveService(null)}>
              Voltar
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative z-10">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-black">
            Confira os serviços disponíveis
          </h2>
          <p className="mt-2 text-body-md text-body">
            Acesse atalhos do seu banco em um único lugar.
          </p>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {serviceOptions.map((option) => (
              <article key={option.id} className="min-h-[98px] rounded-md bg-surface shadow-sm">
                <button
                  type="button"
                  onClick={() => handleServiceClick(option)}
                  className="flex h-full w-full items-center justify-center rounded-md p-4"
                >
                  <span className="text-body-md font-semibold text-heading">{option.label}</span>
                </button>
              </article>
            ))}
          </div>
        </div>
      )}

      {activeService && !readyServices.includes(activeService.id) && (
        <ServiceUnderConstructionModal
          serviceLabel={activeService.label}
          onClose={() => setActiveService(null)}
        />
      )}
    </section>
  );
}
