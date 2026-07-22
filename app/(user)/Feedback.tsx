import React from 'react';
import { UserLayout } from '../../components/layout/UserLayout';
import { PagWebFeedbackForm } from '../../features/feedback/components/PagWebFeedbackForm';

/** Cliente — feedback sobre a plataforma PagWeb. */
export const Feedback: React.FC = () => (
  <UserLayout>
    <PagWebFeedbackForm />
  </UserLayout>
);
