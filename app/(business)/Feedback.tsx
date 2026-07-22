import React from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { PagWebFeedbackForm } from '../../features/feedback/components/PagWebFeedbackForm';

/** Estabelecimento — feedback sobre a plataforma PagWeb. */
export const Feedback: React.FC = () => (
  <BusinessLayout>
    <PagWebFeedbackForm />
  </BusinessLayout>
);
