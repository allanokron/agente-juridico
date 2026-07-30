import { ptBR } from "@clerk/localizations";

export const lexoPtBR = {
  ...ptBR,
  signIn: {
    ...ptBR.signIn,
    start: {
      ...ptBR.signIn?.start,
      title: "Bem-vindo ao LEXO",
      titleCombined: "Bem-vindo ao LEXO",
      subtitle: "Entre na sua conta LEXO para continuar",
      subtitleCombined: "Entre na sua conta LEXO para continuar",
      actionText: "O acesso ao LEXO é feito somente por convite.",
      actionLink: "",
    },
  },
} as const;
