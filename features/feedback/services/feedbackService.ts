import { sessionService } from '../../../services/session';

import { apiV1Url } from '../../../utils/apiOrigin';

import { parseApiError } from '../../../utils/formatters';

import {

  FeedbackItem,

  FeedbackItemSchema,

  FeedbackSubmitInput,

} from '../schemas/feedbackSchemas';



const BASE = apiV1Url('/Feedback');



export class FeedbackApiUnavailableError extends Error {

  constructor() {

    super('O envio de feedback ainda não está disponível no servidor. Tente mais tarde.');

    this.name = 'FeedbackApiUnavailableError';

  }

}



const authHeaders = (): HeadersInit => {

  const { token } = sessionService.getSession();

  return {

    accept: '*/*',

    Authorization: `Bearer ${token ?? ''}`,

  };

};



/** Feedback da plataforma PagWeb (envio pelo cliente ou estabelecimento). */

export const feedbackService = {

  async submit(

    input: FeedbackSubmitInput,

    files: File[],

  ): Promise<FeedbackItem> {

    const formData = new FormData();

    formData.append('titulo', input.titulo);

    formData.append('descricao', input.descricao);

    const { user } = sessionService.getSession();

    if (user?.tipo) {

      formData.append('tipoPerfil', String(user.tipo));

    }

    files.forEach((file) => {

      formData.append('arquivos', file);

    });



    const response = await fetch(BASE, {

      method: 'POST',

      headers: authHeaders(),

      body: formData,

    });



    if (response.status === 404 || response.status === 405) {

      throw new FeedbackApiUnavailableError();

    }



    if (!response.ok) {

      const message = await parseApiError(response);

      throw new Error(message || 'Não foi possível enviar o feedback.');

    }



    const raw: unknown = await response.json();

    const parsed = FeedbackItemSchema.safeParse(raw);

    if (!parsed.success) {

      return {

        idFeedback: Date.now(),

        titulo: input.titulo,

        descricao: input.descricao,

        dataCriacao: new Date().toISOString(),

        idUsuario: 0,

        nomeUsuario: '',

        emailUsuario: '',

        tipoPerfil: user?.tipo ?? '',

        arquivos: [],

      };

    }

    return parsed.data;

  },

};


