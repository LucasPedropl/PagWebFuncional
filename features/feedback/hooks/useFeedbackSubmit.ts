import { useCallback, useState } from 'react';
import { FeedbackSubmitInputSchema } from '../schemas/feedbackSchemas';
import { feedbackService } from '../services/feedbackService';

export function useFeedbackSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = useCallback(async (titulo: string, descricao: string, files: File[]) => {
    const parsed = FeedbackSubmitInputSchema.safeParse({ titulo, descricao });
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? 'Dados inválidos.';
      throw new Error(first);
    }

    setIsSubmitting(true);
    try {
      return await feedbackService.submit(parsed.data, files);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { submit, isSubmitting };
}
