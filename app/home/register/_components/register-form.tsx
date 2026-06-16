"use client";

import Image from "next/image";
import type { FormEventHandler } from "react";
import { useState } from "react";
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input, validateInputValue } from '@/components/ui/input';
import { registerAccount } from "../../_services/auth-service";

type RegisterFormLayout = "page" | "modal";

type RegisterFormProps = {
  layout?: RegisterFormLayout;
};

export function RegisterForm({ layout = "page" }: RegisterFormProps) {
  const isModal = layout === "modal";
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    variant: "success" | "error";
    message: string;
  } | null>(null);

  const isFormElementValid = (formElement: HTMLFormElement) => {
    const formData = new FormData(formElement);
    const consentElement = formElement.elements.namedItem("consent");
    const isConsentChecked =
      consentElement instanceof HTMLInputElement ? consentElement.checked : false;

    return (
      validateInputValue("name", String(formData.get("name") ?? "")) === null &&
      validateInputValue("email", String(formData.get("email") ?? "")) === null &&
      validateInputValue("password", String(formData.get("password") ?? "")) === null &&
      isConsentChecked
    );
  };

  const updateFormValidity: FormEventHandler<HTMLFormElement> = (event) => {
    setIsFormValid(isFormElementValid(event.currentTarget));
  };

  const submitRegister = async (formElement: HTMLFormElement) => {
    setIsSubmitting(true);
    setFeedback(null);

    const formData = new FormData(formElement);
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    const result = await registerAccount(payload);

    if (result.ok) {
      formElement.reset();
      setIsFormValid(false);
    }

    setFeedback({
      variant: result.ok ? "success" : "error",
      message: result.message,
    });
    setIsSubmitting(false);
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const isValid = isFormElementValid(formElement);

    setIsFormValid(isValid);

    if (!isValid) {
      formElement.reportValidity();
      return;
    }

    void submitRegister(formElement);
  };

  const handleAlertClose = () => setFeedback(null);

  return (
    <div className={isModal ? "w-full" : "w-full rounded-lg bg-surface p-6 shadow-sm md:p-8"}>
      <div className="mb-6 flex justify-center">
        <Image
          src="/home/login/new-account.svg"
          alt="Ilustração de abertura de conta"
          width={355}
          height={262}
          className={isModal ? "h-auto w-full max-w-[280px]" : "h-auto w-full max-w-[320px]"}
          priority
        />
      </div>

      <h1 className="mb-6 text-title-lg font-bold text-heading">
        Preencha os campos abaixo para criar sua conta corrente!
      </h1>

      <form
        className="space-y-4"
        noValidate
        onInput={updateFormValidity}
        onChange={updateFormValidity}
        onSubmit={handleSubmit}
      >
        <Input
          label="Nome"
          id="name"
          name="name"
          type="text"
          validationKind="name"
          placeholder="Digite seu nome completo"
        />

        <Input
          label="Email"
          id="email"
          name="email"
          type="email"
          validationKind="email"
          placeholder="Digite seu email"
        />

        <Input
          label="Senha"
          id="password"
          name="password"
          type="password"
          validationKind="password"
          placeholder="Digite sua senha"
          inputClassName={isModal ? "max-w-[165px] mobile:max-w-none" : undefined}
        />

        <label className="flex items-start gap-2 pt-1 text-body-sm text-body">
          <input
            type="checkbox"
            name="consent"
            required
            className="mt-0.5 h-4 w-4 rounded border-border text-secondary focus:ring-secondary"
          />
          <span>
            Li e estou ciente quanto às condições de tratamento dos meus dados conforme descrito na Política de Privacidade do banco.
          </span>
        </label>

        {feedback ? (
          <div className="pt-2">
            <Alert
              variant={feedback.variant}
              message={feedback.message}
              dismissAfterMs={5000}
              onClose={handleAlertClose}
              className="w-full"
            />
          </div>
        ) : null}

        <div className={isModal ? "flex justify-center pt-2" : "pt-2"}>
          <Button
            type="submit"
            variant="solid"
            tone="accent"
            className="h-11 min-w-[124px] justify-center"
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? "Criando..." : "Criar conta"}
          </Button>
        </div>
      </form>
    </div>
  );
}
