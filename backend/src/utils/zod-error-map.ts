import { z } from 'zod';

// Fallback pt-BR messages for issues without a custom message in the schema
z.config({
  customError: (issue) => {
    switch (issue.code) {
      case 'invalid_type':
        return issue.input === undefined || issue.input === null
          ? 'Campo obrigatório'
          : 'Tipo de valor inválido';
      case 'too_small':
        return issue.origin === 'string'
          ? `Deve ter no mínimo ${issue.minimum} caracteres`
          : `Deve ser no mínimo ${issue.minimum}`;
      case 'too_big':
        return issue.origin === 'string'
          ? `Deve ter no máximo ${issue.maximum} caracteres`
          : `Deve ser no máximo ${issue.maximum}`;
      case 'invalid_format':
        return 'Formato inválido';
      case 'invalid_value':
        return 'Valor inválido';
      case 'unrecognized_keys':
        return 'Campos não permitidos';
      default:
        return 'Valor inválido';
    }
  },
});
