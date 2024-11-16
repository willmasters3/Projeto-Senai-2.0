// Variáveis globais para armazenar agendamentos e navegação
let agendamentos = []; // Array para armazenar todos os agendamentos
let currentPage = 1; // Página atual
const agendamentosPorPagina = 8; // Total de agendamentos por página
let rolando = false; // Variável para controlar o estado da rolagem automática

document.addEventListener('DOMContentLoaded', () => {
    carregarUnidades();

    const unidadeSelect = document.getElementById('unidadeSelect');
    const agendamentosList = document.getElementById('agendamentosList');

    // Recupera a unidade selecionada do localStorage e define como selecionada
    const codigoUnidade = localStorage.getItem('codigoUnidade');
    if (codigoUnidade) {
        unidadeSelect.value = codigoUnidade; // Define a unidade selecionada
        carregarAgendamentosPorUnidade(codigoUnidade); // Carrega agendamentos da unidade selecionada
    }

    unidadeSelect.addEventListener('change', async () => {
        const codigoUnidade = unidadeSelect.value;
        localStorage.setItem('codigoUnidade', codigoUnidade); // Armazena a unidade selecionada no localStorage
        if (codigoUnidade) {
            currentPage = 1; // Reseta para a primeira página ao mudar a unidade
            await carregarAgendamentosPorUnidade(codigoUnidade);
        } else {
            agendamentosList.innerHTML = '';
        }
    });

    // Verifica e remove agendamentos expirados a cada 60 segundos
    setInterval(verificarEExcluirAgendamentosExpirados, 60000);

    // Rolagem
    iniciarRolagem();

    // Atualiza a página a cada 100 segundos para teste
    setInterval(() => {
        console.log("Atualizando a página...");
        location.reload(); // Atualiza a página
    }, 3600000); // 1h em milissegundos
});

function iniciarRolagem() {
    if (rolando) return; // Se já estiver rolando, sai da função
    rolando = true; // Marca que a rolagem está ativa
    mostrarAgendamentos(); // Mostra os agendamentos iniciais

    setInterval(() => {
        // Alterna para a próxima página
        currentPage++;
        const totalPaginas = Math.ceil(agendamentos.length / agendamentosPorPagina);
        // Se alcançar a última página, volta para a primeira
        if (currentPage > totalPaginas) {
            currentPage = 1;
        }

        // Mostra os agendamentos da página atual
        mostrarAgendamentos(); // Atualiza a exibição

        // Verifica se não há agendamentos na página atual
        const agendamentosFiltrados = filtrarAgendamentosPorTurno(agendamentos);
        const agendamentosParaMostrar = agendamentosFiltrados.slice((currentPage - 1) * agendamentosPorPagina, currentPage * agendamentosPorPagina);
        if (agendamentosParaMostrar.length === 0) {
            currentPage = 1; // Reseta para a primeira página se não houver agendamentos
            mostrarAgendamentos(); // Atualiza a exibição novamente
        }
    }, 10000); // 10000 ms (10 segundos)
}

async function verificarEExcluirAgendamentosExpirados() {
    const agendamentosList = document.getElementById('agendamentosList');
    const agendamentoItems = agendamentosList.getElementsByClassName('agendamento-item');

    const now = new Date(); // Data e hora atuais em São Paulo
    console.log('Data e Hora Atual:', now);

    for (let agendamentoItem of agendamentoItems) {
        const dataFimText = agendamentoItem.querySelector('.data-fim').textContent.split(': ')[1];
        const horaFimText = agendamentoItem.querySelector('.hora-fim').textContent.split(': ')[1];

        // Extrair as partes da data final
        const dataFimParts = dataFimText.split('/');
        const horaFimParts = horaFimText.split(':');

        // Convertendo data e hora final do agendamento para um objeto Date
        const dataFimDate = new Date(dataFimParts[2], dataFimParts[1] - 1, dataFimParts[0], horaFimParts[0], horaFimParts[1], horaFimParts[2] || 0);

        console.log('Data e Hora Final do Agendamento:', dataFimDate);

        if (now >= dataFimDate) { // Comparação para ver se o agendamento expirou
            const agendamentoId = agendamentoItem.dataset.agendamentoId;
            console.log(`Agendamento expirado detectado: ID ${agendamentoId}`);
            // Remova as duas linhas abaixo para não excluir mais.
            // await excluirAgendamento(agendamentoId); 
            // agendamentoItem.remove(); // Remover o agendamento do DOM
        } else {
            console.log(`Agendamento ainda ativo: ID ${agendamentoItem.dataset.agendamentoId}`);
        }
    }

    const codigoUnidade = unidadeSelect.value;
    if (codigoUnidade) {
        await carregarAgendamentosPorUnidade(codigoUnidade);
    }
}

// Variáveis globais para os turnos
const turnoManhaInicio = new Date(new Date().setHours(6, 0, 0)); // 6:00
const turnoManhaFim = new Date(new Date().setHours(12, 15, 0)); // 12:15
const turnoTardeInicio = new Date(new Date().setHours(12, 15, 0)); // 12:15
const turnoTardeFim = new Date(new Date().setHours(17, 15, 0)); // 17:15
const turnoNoiteInicio = new Date(new Date().setHours(17, 15, 0)); // 17:15
const turnoNoiteFim = new Date(new Date().setHours(23, 59, 59)); // 23:59

async function carregarUnidades() {
    try {
        const response = await fetch('/listar-unidades');
        if (!response.ok) throw new Error('Erro ao carregar unidades');
        
        const unidades = await response.json();
        const unidadeSelect = document.getElementById('unidadeSelect');
        unidades.forEach(unidade => {
            const option = document.createElement('option');
            option.value = unidade.codigo;
            option.textContent = unidade.nome;
            unidadeSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar unidades:', error);
        alert('Erro ao carregar unidades.');
    }
}

async function carregarAgendamentosPorUnidade(codigoUnidade) {
    try {
        const response = await fetch(`/listar-agendamento/${codigoUnidade}`);
        if (!response.ok) throw new Error('Erro ao carregar agendamentos');
        
        agendamentos = await response.json(); // Armazena os agendamentos globalmente
        mostrarAgendamentos(); // Chama para exibir os agendamentos após o carregamento
    } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
        alert('Erro ao carregar agendamentos.');
    }
}

function mostrarAgendamentos() {
    const agendamentosList = document.getElementById('agendamentosList');
    agendamentosList.innerHTML = ''; // Limpa a lista de agendamentos

    const gridContainer = document.createElement('div');
    gridContainer.classList.add('agendamentos-grid');
    agendamentosList.appendChild(gridContainer); // Adiciona a grid ao agendamentosList

    // Filtrar agendamentos
    const agendamentosFiltrados = filtrarAgendamentosPorTurno(agendamentos); // Filtra os agendamentos por turno

    // Paginando os agendamentos filtrados
    const totalPaginas = Math.ceil(agendamentosFiltrados.length / agendamentosPorPagina);
    const inicio = (currentPage - 1) * agendamentosPorPagina;
    const fim = inicio + agendamentosPorPagina;
    const agendamentosParaMostrar = agendamentosFiltrados.slice(inicio, fim);

    // Exibe os agendamentos filtrados na grid
    agendamentosParaMostrar.forEach(agendamento => {
        const agendamentoItem = document.createElement('div');
        agendamentoItem.classList.add('agendamento-item');
        agendamentoItem.dataset.agendamentoId = agendamento.id_agendamento;

        const salaNome = document.createElement('h3');
        salaNome.textContent = `Sala: ${agendamento.nome_sala}`;
        agendamentoItem.appendChild(salaNome);

        const professorNome = document.createElement('p');
        professorNome.textContent = `Professor: ${agendamento.nome}`;
        agendamentoItem.appendChild(professorNome);

        const dataInicio = document.createElement('p');
        dataInicio.textContent = `Data de Início: ${formatarData(agendamento.data_reservas)}`;
        agendamentoItem.appendChild(dataInicio); 

        const horaInicio = document.createElement('p');
        horaInicio.textContent = `Hora de Início: ${formatarHora(agendamento.hora_inicio)}`;
        agendamentoItem.appendChild(horaInicio);

        const dataFim = document.createElement('p');
        dataFim.classList.add('data-fim');
        dataFim.textContent = `Data de Fim: ${formatarData(agendamento.data_reservas)}`;
        agendamentoItem.appendChild(dataFim);

        const horaFim = document.createElement('p');
        horaFim.classList.add('hora-fim');
        horaFim.textContent = `Hora de Fim: ${formatarHora(agendamento.hora_fim)}`;
        agendamentoItem.appendChild(horaFim);

        const tipo_aula = document.createElement('p');
        tipo_aula.textContent = `Tipo de Atividade/UC: ${agendamento.tipo_aula || 'Nenhuma aula fornecida'}`;
        agendamentoItem.appendChild(tipo_aula);

        const motivo = document.createElement('p');
        motivo.textContent = `Motivo/Turma: ${agendamento.motivo || 'Nenhum motivo fornecido'}`;
        agendamentoItem.appendChild(motivo);

        gridContainer.appendChild(agendamentoItem);
    });

    // Adiciona a navegação à lista de agendamentos
    const navContainer = document.createElement('div');
    navContainer.classList.add('nav-container');

    const prevButton = document.createElement('button');
    prevButton.textContent = 'Anterior';
    prevButton.disabled = currentPage === 1; // Desabilita se for a primeira página
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            mostrarAgendamentos(); // Atualiza a exibição
        }
    });
    navContainer.appendChild(prevButton);

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Próximo';
    nextButton.disabled = currentPage === totalPaginas; // Desabilita se for a última página
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPaginas) {
            currentPage++;
            mostrarAgendamentos(); // Atualiza a exibição
        }
    });
    navContainer.appendChild(nextButton);

    // Adiciona a navegação à lista de agendamentos
    agendamentosList.appendChild(navContainer);

    if (gridContainer.childElementCount === 0) {
        agendamentosList.textContent = 'Nenhum agendamento para hoje.';
    }
}

// Função para filtrar agendamentos com base no turno ativo
function filtrarAgendamentosPorTurno(agendamentos) {
    const agora = new Date(); // horário atual
    let turnoAtivo = null;

    // Determina o turno ativo com base no horário atual
    if (agora >= turnoManhaInicio && agora <= turnoManhaFim) {
        turnoAtivo = 'manha';
    } else if (agora > turnoTardeInicio && agora <= turnoTardeFim) {
        turnoAtivo = 'tarde';
    } else if (agora > turnoNoiteInicio && agora <= turnoNoiteFim) {
        turnoAtivo = 'noite';
    }

    // Filtrar agendamentos com base no turno ativo
    return agendamentos.filter(agendamento => {
        const horaInicio = new Date(`${agendamento.data_reservas}T${agendamento.hora_inicio}`);
        const horaFim = new Date(`${agendamento.data_reservas}T${agendamento.hora_fim}`);
        return (
            (turnoAtivo === 'manha' && horaInicio < turnoManhaFim && horaFim > turnoManhaInicio) ||
            (turnoAtivo === 'tarde' && horaInicio < turnoTardeFim && horaFim > turnoTardeInicio) ||
            (turnoAtivo === 'noite' && horaInicio < turnoNoiteFim && horaFim > turnoNoiteInicio)
        );
    });
}

// Função para formatar a data considerando o fuso horário de São Paulo (Brazil)
function formatarData(data) {
    const dataObj = new Date(data);
    const utcDay = dataObj.getUTCDate();
    const utcMonth = dataObj.getUTCMonth() + 1; // Os meses são indexados de 0 a 11
    const utcYear = dataObj.getUTCFullYear();

    const day = utcDay < 10 ? '0' + utcDay : utcDay;
    const month = utcMonth < 10 ? '0' + utcMonth : utcMonth;

    return `${day}/${month}/${utcYear}`; // Formato brasileiro
}

// Função para formatar a hora considerando o fuso horário de São Paulo (Brazil)
function formatarHora(hora) {
    const [hours, minutes, seconds] = hora.split(':').map(Number);
    const dataHora = new Date(Date.UTC(1970, 0, 1, hours, minutes, seconds || 0));

    const horasUTC = dataHora.getUTCHours();
    const minutosUTC = dataHora.getUTCMinutes();
    const segundosUTC = dataHora.getUTCSeconds();

    const horas = horasUTC < 10 ? '0' + horasUTC : horasUTC;
    const minutos = minutosUTC < 10 ? '0' + minutosUTC : minutosUTC;
    const segundos = segundosUTC < 10 ? '0' + segundosUTC : segundosUTC;

    return `${horas}:${minutos}:${segundos}`;
}
