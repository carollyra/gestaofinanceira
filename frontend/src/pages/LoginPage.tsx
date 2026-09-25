import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router';

import { AuthLayout } from '@/components/AuthLayout';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { PasswordField } from '@/components/ui/PasswordField';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/hooks/useAuth';
import { type LoginFormValues, loginSchema } from '@/utils/auth-schemas';
import { applyApiErrors } from '@/utils/form-errors';

interface LocationState {
  from?: { pathname: string; search?: string };
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login(values);
      const from = (location.state as LocationState | null)?.from;
      navigate(from ? `${from.pathname}${from.search ?? ''}` : '/', { replace: true });
    } catch (error) {
      setFormError(applyApiErrors(error, setError, ['email', 'password']));
    }
  });

  return (
    <AuthLayout
      title="Entrar"
      subtitle="Acesse seu controle financeiro"
      footer={
        <>
          Ainda não tem conta?{' '}
          <Link to="/cadastro" className="font-medium text-emerald-400 hover:text-emerald-300">
            Criar conta
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {formError && <Alert>{formError}</Alert>}

        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <PasswordField
          label="Senha"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" loading={isSubmitting} className="mt-2">
          Entrar
        </Button>
      </form>
    </AuthLayout>
  );
}
