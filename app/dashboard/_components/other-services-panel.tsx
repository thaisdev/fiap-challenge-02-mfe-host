'use client';
import { useState } from 'react';
import { ServiceUnderConstructionModal } from './service-under-construction-modal';

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
        <div className="bg-[#cbcbcb] rounded-2xl p-10">
          {/* Aqui entra a tela de Meus Cartões */}
          <h2 className="text-2xl font-bold text-black">Meus Cartões</h2>

          {/* Exemplo de conteúdo da aba */}
          <div className="bg-none">
            <div className="bg-none pt-5">
              <p className="text-body-md">Cartão Físico</p>
            </div>
          </div>

          {/* Container do cartão + botões */}
          <div className="flex items-start gap-6 mt-6">
            {/* Cartão */}
            <div className="bg-[#004d61] rounded-2xl w-[350px] p-4 shadow-md">
              <p className="text-2xl text-white">Byte</p>
              <p className="text-body-md tracking-[0.05em] text-white">Platinum</p>
              <p className="text-body-md mt-8 text-white">Joana Fonseca Gomes</p>
              <p className="text-body-md mt-2 text-white">•••••••••</p>
            </div>

            {/* Área dos botões */}
            <div className="flex flex-col flex-1">
              <button className="cursor-pointer rounded bg-orange-500 px-4 py-3 text-white font-semibold transition-transform hover:scale-105">
                Configurar
              </button>
              <button className="mt-3 cursor-pointer rounded border border-red-500 px-4 py-3 text-red-500 font-semibold transition-transform hover:scale-105">
                Bloquear
              </button>

              {/* Texto abaixo dos botões */}
              <p className="mt-4 text-sm text-center text-gray-700">Função: Débito/Crédito</p>
            </div>
          </div>

          {/* Container do cartão + botões */}
          <div className="flex items-start gap-6 mt-6">
            {/* Cartão */}
            <div className="bg-[#8b8b8b] rounded-2xl w-[350px] p-4 shadow-md">
              <p className="text-2xl text-white">Byte</p>
              <p className="text-body-md tracking-[0.05em] text-white">Platinum</p>
              <p className="text-body-md mt-8 text-white">Joana Fonseca Gomes</p>
              <p className="text-body-md mt-2 text-white">•••••••••</p>
            </div>

            {/* Área dos botões */}
            <div className="flex flex-col flex-1">
              <button className="cursor-pointer rounded bg-orange-500 px-4 py-3 text-white font-semibold transition-transform hover:scale-105">
                Configurar
              </button>
              <button className="mt-3 cursor-pointer rounded border border-red-500 px-4 py-3 text-red-500 font-semibold transition-transform hover:scale-105">
                Bloquear
              </button>

              {/* Texto abaixo dos botões */}
              <p className="mt-4 text-sm text-center text-gray-700">Função: Débito/Crédito</p>
            </div>
          </div>

          {/* Botão para voltar ao painel */}
          <button
            type="button"
            onClick={() => setActiveService(null)}
            className="mt-4 cursor-pointer rounded bg-primary px-4 py-2 text-white"
          >
            Voltar
          </button>
        </div>
      ) : (
        <div className="relative z-10">
          <h2 className="cursor-pointer text-title-xl font-bold text-black">
            Confira os serviços disponíveis
          </h2>
          <p className="mt-2 text-body-md text-body">
            Acesse atalhos do seu banco em um único lugar.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {serviceOptions.map((option) => (
              <article key={option.id} className="min-h-[98px] rounded-md bg-surface shadow-sm">
                <button
                  type="button"
                  onClick={() => handleServiceClick(option)}
                  className="flex h-full w-full items-center justify-center rounded-md p-4"
                >
                  <span className="text-body-md cursor-pointer font-semibold text-heading">
                    {option.label}
                  </span>
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
