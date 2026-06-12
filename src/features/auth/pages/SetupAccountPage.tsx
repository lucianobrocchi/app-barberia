import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Scissors } from 'lucide-react';
import { supabase } from '@/shared/lib/supabase';

const setupSchema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm_password'],
});

type SetupFormData = z.infer<typeof setupSchema>;

export function SetupAccountPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
  });

  useEffect(() => {
    // Supabase sets the session automatically from URL hash on invitation flow
    supabase.auth.getSession().then(({ data: { session } }) => {
      setTokenValid(!!session);
    });
  }, [searchParams]);

  async function onSubmit(data: SetupFormData) {
    setServerError(null);
    try {
      const { data: { user }, error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (updateError) throw updateError;
      if (!user) throw new Error('No se pudo obtener el usuario');

      // Update the profile with the full name provided
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: data.full_name })
        .eq('id', user.id);

      if (profileError) throw profileError;

      navigate('/barber', { replace: true });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Ocurrió un error al configurar tu cuenta');
    }
  }

  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <p className="text-foreground font-medium">El link de invitación es inválido o ya expiró.</p>
          <p className="text-muted-foreground text-sm mt-2">Pedile al dueño que te envíe uno nuevo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4">
            <Scissors className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Configurá tu cuenta</h1>
          <p className="text-sm text-muted-foreground mt-1">Completá tus datos para empezar</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Nombre completo</label>
            <input
              {...register('full_name')}
              type="text"
              placeholder="Juan García"
              className="w-full px-3 py-2.5 rounded-[var(--radius)] border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            {errors.full_name && (
              <p className="mt-1 text-xs text-danger">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Contraseña</label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-[var(--radius)] border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Confirmá la contraseña</label>
            <input
              {...register('confirm_password')}
              type="password"
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-[var(--radius)] border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            {errors.confirm_password && (
              <p className="mt-1 text-xs text-danger">{errors.confirm_password.message}</p>
            )}
          </div>

          {serverError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 rounded-[var(--radius)] bg-danger/10 border border-danger/20 text-danger text-sm"
            >
              {serverError}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-medium rounded-[var(--radius)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Guardando...
              </span>
            ) : (
              'Activar mi cuenta'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
