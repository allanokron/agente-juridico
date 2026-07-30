import { ptBR } from "@clerk/localizations";

export const lexoPtBR = {
  ...ptBR,
  formFieldAction__forgotPassword: "Esqueci minha senha",
  signIn: {
    ...ptBR.signIn,
    forgotPassword: {
      ...ptBR.signIn?.forgotPassword,
      formTitle: "Código de recuperação",
      resendButton: "Não recebeu o código? Reenviar",
      subtitle: "para recuperar o acesso à sua conta LEXO",
      subtitle_email: "Digite o código enviado para o seu e-mail",
      subtitle_phone: "Digite o código enviado para o seu telefone",
      title: "Recuperar senha",
    },
    forgotPasswordAlternativeMethods: {
      ...ptBR.signIn?.forgotPasswordAlternativeMethods,
      blockButton__resetPassword: "Redefinir minha senha",
      label__alternativeMethods: "Ou utilize outro método de acesso.",
      title: "Esqueceu sua senha?",
    },
    resetPassword: {
      ...ptBR.signIn?.resetPassword,
      formButtonPrimary: "Salvar nova senha",
      requiredMessage:
        "Por segurança, defina uma nova senha para continuar.",
      successMessage:
        "Senha alterada com sucesso. Entrando na sua conta LEXO...",
      title: "Defina sua nova senha",
    },
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
