'use client';
import { useState } from 'react';
import { ServiceUnderConstructionModal } from './service-under-construction-modal';
import { Button } from "@/components/ui/button";

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
    <section className="relative cursor-pointer overflow-hidden rounded-md p-5 flex flex-col" aria-live="polite">
      {activeService?.id === 'my-cards' ? (
        <div className="bg-[#cbcbcb] rounded-2xl p-6 sm:p-8 w-full min-h-full flex flex-col overflow-hidden">
          <h2 className="text-xl sm:text-2xl font-bold text-black">Meus Cartões</h2>

          {/* Primeiro cartão */}
          <div className="pt-5">
            <p className="text-body-md mb-3">Cartão Físico</p>
            <div className="flex flex-row items-center gap-4 w-full">
              {/* Cartão */}
              <div className="bg-[#004d61] rounded-2xl p-4 shadow-md flex-shrink-0 w-[55%] min-w-0">
                <p className="text-lg sm:text-xl text-white font-bold italic">Byte</p>
                <p className="text-sm tracking-[0.05em] text-white">Platinum</p>
                <p className="text-sm mt-6 text-white">Joana Fonseca Gomes</p>
                <p className="text-sm mt-2 text-white">•••••••••</p>
              </div>

              {/* Botões */}
              <div className="flex flex-col gap-3 flex-1 min-w-0">
                <Button variant="solid" tone="accent" className="w-full cursor-pointer transition-transform hover:scale-105">
                  Configurar
                </Button>
                <Button variant="outline" tone="error" className="w-full cursor-pointer transition-transform hover:scale-105">
                  Bloquear
                </Button>
                <p className="text-xs text-center text-gray-700">Função: Débito/Crédito</p>
              </div>
            </div>
          </div>

          {/* Segundo cartão */}
          <div className="pt-6">
            <p className="text-body-md mb-3">Cartão Digital</p>
            <div className="flex flex-row items-center gap-4 w-full">
              {/* Cartão */}
              <div className="bg-[#8b8b8b] rounded-2xl p-4 shadow-md flex-shrink-0 w-[55%] min-w-0">
                <p className="text-lg sm:text-xl text-white font-bold italic">Byte</p>
                <p className="text-sm tracking-[0.05em] text-white">Platinum</p>
                <p className="text-sm mt-6 text-white">Joana Fonseca Gomes</p>
                <p className="text-sm mt-2 text-white">•••••••••</p>
              </div>

              {/* Botões */}
              <div className="flex flex-col gap-3 flex-1 min-w-0">
                <Button variant="solid" tone="accent" className="w-full cursor-pointer transition-transform hover:scale-105">
                  Configurar
                </Button>
                <Button variant="outline" tone="error" className="w-full cursor-pointer transition-transform hover:scale-105">
                  Bloquear
                </Button>
                <p className="text-xs text-center text-gray-700">Função: Débito</p>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6">
            <Button
              variant="solid"
              tone="accent"
              onClick={() => setActiveService(null)}
              className="w-full sm:w-auto cursor-pointer transition-transform hover:scale-105"
            >
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
                  aria-label={`Abrir aviso do serviço ${option.label}`}
                  onClick={() => handleServiceClick(option)}
                  className="flex h-full w-full items-center justify-center rounded-md p-4 cursor-pointer transition-transform hover:scale-105"
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