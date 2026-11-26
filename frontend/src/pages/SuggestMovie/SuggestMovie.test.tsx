import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SuggestMovie from '.';
import * as api from 'services/api';
import { loginAs, renderWithProviders } from 'test-utils';

jest.mock('services/api', () => ({
  ...jest.requireActual('services/api'),
  sendMovieProposal: jest.fn(),
}));

const mockedSend = api.sendMovieProposal as jest.MockedFunction<typeof api.sendMovieProposal>;

describe('SuggestMovie (integração com POST /api/movie-requests)', () => {
  beforeEach(() => {
    mockedSend.mockReset();
    loginAs('user');
  });

  it('bloqueia envio sem os campos obrigatórios', async () => {
    renderWithProviders(<SuggestMovie />);
    userEvent.click(screen.getByRole('button', { name: /enviar/i }));
    expect(await screen.findByText(/preencha o seu nome e o nome do filme/i)).toBeInTheDocument();
    expect(mockedSend).not.toHaveBeenCalled();
  });

  it('envia a indicação para o backend', async () => {
    mockedSend.mockResolvedValue(undefined);
    renderWithProviders(<SuggestMovie />);
    userEvent.type(screen.getByLabelText('Seu nome'), 'Maria Silva');
    userEvent.type(screen.getByLabelText('Nome do filme'), 'Interestelar');
    userEvent.click(screen.getByRole('button', { name: /enviar/i }));

    expect(await screen.findByText(/indicação de "Interestelar" enviada/i)).toBeInTheDocument();
    expect(mockedSend).toHaveBeenCalledWith({
      title: 'Interestelar',
      message: 'Indicação enviada por Maria Silva',
    });
  });
});
