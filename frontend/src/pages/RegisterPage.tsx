import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';

import { AuthLayout } from '@/components/AuthLayout';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { PasswordField } from '@/components/ui/PasswordField';
import { PasswordRequirements } from '@/components/ui/PasswordRequirements';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/hooks/useAuth';
import { type RegisterFormValues, registerSchema } from '@/utils/auth-schemas';
import { applyApiErrors } from '@/utils/form-errors';

export function RegisterPage() {
  const { register: signUp } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const password = useWatch({ control, name: 'password' });

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    setFormError(null);
    try {
      await signUp({ name, email, password });
      navigate('/', { replace: true });
    } catch (error) {
      setFormError(applyApiErrors(error, setError, ['name', 'email', 'password']));
    }
  });

  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Comece a organizar suas finanças"
      footer={
        <>
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-emerald-400 hover:text-emerald-300">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {formError && <Alert>{formError}</Alert>}

        <TextField
          label="Nome"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />

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
          autoComplete="new-password"
          error={errors.password?.message}
          hint={<PasswordRequirements password={password} />}
          {...register('password')}
        />

        <PasswordField
          label="Confirmar senha"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" loading={isSubmitting} className="mt-2">
          Criar conta
        </Button>
      </form>
    </AuthLayout>
  );
}
