document.getElementById('id_professor').addEventListener('change', (event) => {
    console.log('Professor selecionado:', event.target.value);
});

// Funções de carregamento das unidades e salas
document.addEventListener('DOMContentLoaded', () => {
    // Carregar apenas a unidade do professor logado
    carregarUnidadesDoProfessor(); 
    carregarProfessoresPorUnidade();
    

    // Inicializa o Flatpickr para permitir seleção múltipla
    flatpickr("#data_selecionada", {
        mode: "multiple", // Modo que permite a seleção de múltiplas datas
        dateFormat: "Y-m-d", // Formato das datas
        locale: "pt",
        onClose: function(selectedDates) {
            // Atualiza o campo de texto com as datas selecionadas formatadas
            const formataData = selectedDates.map(date => date.toISOString().split('T')[0]).join(', ');
            document.getElementById('data_selecionada').value = formataData; // Atualiza o valor do input
        }
    });
});

// Carregar tipos de aula por unidade
async function carregarTiposAulaPorUnidade(codigoUnidade) {
    try {
        const response = await fetch(`/listar-tipos-aula-por-unidade/${codigoUnidade}`);
        if (!response.ok) {
            throw new Error('Erro ao carregar tipos de aula');
        }
        const tiposAula = await response.json();
        tiposAula.sort((a, b) => a.descricao.localeCompare(b.descricao)); // Ordena os tipos de aula
        
        const tipoAulaSelect = document.getElementById('id_tipo_aula');
        tipoAulaSelect.innerHTML = ''; // Limpa opções existentes

        // Adiciona a opção padrão "Selecionar Unidade Curricular"
        const defaultOption = document.createElement('option');
        defaultOption.value = ''; // Valor vazio
        defaultOption.textContent = 'Selecionar Unidade Curricular'; // Texto da opção
        defaultOption.disabled = true; // Sem opção de seleção
        defaultOption.selected = true; // Selecionado por padrão
        tipoAulaSelect.appendChild(defaultOption); 
        
        if (tiposAula.length === 0) {
            console.log('Nenhum tipo de aula encontrado');
            return; // Se não houver tipos de aula, retornar
        }

        tiposAula.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo.id_tipo_aula; // ID do tipo de aula
            option.textContent = tipo.descricao; // A descrição do tipo de aula
            tipoAulaSelect.appendChild(option); // Adiciona a opção ao select
        });
    } catch (error) {
        console.error('Erro ao carregar tipos de aula:', error);
    }
}

// Atualizar o evento para carregar salas e tipos de aula quando a unidade for mudada
document.getElementById('codigo_unidade').addEventListener('change', async (event) => {
    const codigoUnidade = event.target.value;
    console.log("Unidade selecionada:", codigoUnidade); // Verifica se a unidade é capturada corretamente
    if (codigoUnidade) {
        await carregarTiposAulaPorUnidade(codigoUnidade); // Carrega os tipos de aula da nova unidade
        await carregarSalasProfessoresPorUnidade(codigoUnidade); // Carrega as salas e professores da nova unidade
    }
});

// Carregar apenas a unidade do professor logado
async function carregarUnidadesDoProfessor() {
    try {
        const response = await fetch('/user-info'); // Pega as informações do usuário logado
        if (!response.ok) {
            throw new Error('Erro ao carregar unidade do professor');
        }
        const userInfo = await response.json();

        const unidadeSelect = document.getElementById('codigo_unidade');
        unidadeSelect.innerHTML = ''; // Limpa o select antes de preencher
        
        // Adicionando opções para cada unidade associada
        if (userInfo.unidades && userInfo.unidades.length > 0) {
            userInfo.unidades.forEach(codigoUnidade => {
                const option = document.createElement('option');
                option.value = codigoUnidade;
                option.textContent = codigoUnidade; // Ou algum texto descritivo da unidade
                unidadeSelect.appendChild(option); 
            });
        } else {
            unidadeSelect.innerHTML = `<option disabled selected>Não há unidades associadas</option>`;
        }

        // Se houver pelo menos uma unidade, carrega os tipos de aula e salas
        if (userInfo.unidades.length > 0) {
            await carregarTiposAulaPorUnidade(userInfo.unidades[0]); // Carregando para a primeira unidade
            await carregarSalasProfessoresPorUnidade(userInfo.unidades[0]);
        }
    } catch (error) {
        console.error('Erro ao carregar unidade:', error);
    }
}

// Carregar salas e professores por unidade
async function carregarSalasProfessoresPorUnidade(codigoUnidade) {
    try {
        const responseSalas = await fetch(`/listar-salas/${codigoUnidade}`); // Busca salas apenas para a unidade atual
        if (!responseSalas.ok) {
            throw new Error('Erro ao carregar salas'); // Lança erro se a requisição falhar
        }
        
        // Limpa o select de salas antes de preencher
        const salaSelect = document.getElementById('id_sala');
        salaSelect.innerHTML = ''; 

        // Adiciona a opção padrão "Selecionar Sala"
        const defaultOption = document.createElement('option');
        defaultOption.value = ''; // Valor vazio
        defaultOption.textContent = 'Selecionar Sala'; // Texto da opção
        defaultOption.disabled = true; // Sem opção de seleção
        defaultOption.selected = true; // Selecionado por padrão
        salaSelect.appendChild(defaultOption);    

        const salas = await responseSalas.json(); // Processa a resposta JSON
        
        // Ordenando as salas por nome
        salas.sort((a, b) => a.nome_sala.localeCompare(b.nome_sala)); // Ordena alfabética

        salas.forEach(sala => {
            const option = document.createElement('option');
            option.value = sala.id_sala; // Define o ID da sala como valor da opção
            option.textContent = sala.nome_sala; // Define o nome da sala como texto da opção
            salaSelect.appendChild(option); // Adiciona a opção ao select
        });

        // Carregar professores para a nova unidade
        await carregarProfessoresPorUnidade(codigoUnidade); // Chama a função para carregar professores da unidade
    } catch (error) {
        console.error('Erro ao carregar salas e professores:', error); // Loga erro se houver
    }
}

async function carregarProfessoresPorUnidade(codigoUnidade) {
    try {
        const response = await fetch(`/listar-professores-por-unidade/${codigoUnidade}`);
        if (!response.ok) {
            throw new Error('Erro ao carregar professores');
        }
        const professores = await response.json();
        professores.sort((a, b) => a.nome.localeCompare(b.nome)); // Ordena os professores

        const professorSelect = document.getElementById('id_professor');
        professorSelect.innerHTML = ''; // Limpa o select de professores antes de preencher

        const userInfoResponse = await fetch('/user-info');
        const userInfo = await userInfoResponse.json();

        if (userInfo.permissao === 'user') {
            const option = document.createElement('option');
            option.value = userInfo.id_professor;  // O ID do professor logado
            option.textContent = userInfo.nome;     // O nome do professor logado
            option.selected = true; // Marque como selecionado
            professorSelect.appendChild(option);  
        } else {
            professores.forEach(professor => {
                const option = document.createElement('option');
                option.value = professor.id_professor; // ID do professor
                option.textContent = professor.nome; // Nome do professor
                professorSelect.appendChild(option);
            });
        }

        // Se não houver professores, exibe uma mensagem padrão
        if (professorSelect.innerHTML === '') {
            professorSelect.innerHTML = `<option disabled selected>Não há professores disponíveis</option>`;
        }
    } catch (error) {
        console.error('Erro ao carregar professores:', error);
    }
}

async function agendarSala(event) {
    event.preventDefault(); // Previne o envio do formulário

    const idSala = document.getElementById('id_sala').value; // Obtém o ID da sala selecionada
    const idProfessor = document.getElementById('id_professor').value; // Obtém o ID do professor selecionado
    const tipoAulaSelect = document.getElementById('id_tipo_aula'); // Obter a descrição do tipo de aula
    const tipoAulaDescricao = tipoAulaSelect.options[tipoAulaSelect.selectedIndex].textContent; 

    // Log para verificar os valores
    console.log('ID do professor selecionado:', idProfessor);
    
    // Validar se o idProfessor é válido
    if (!idProfessor || isNaN(idProfessor)) {
        alert('ID do professor é inválido.');
        return;
    }

    const datasSelecionadas = document.getElementById('data_selecionada').value.split(',').map(date => date.trim());
    const horaInicio = document.getElementById('hora_inicio').value; // Obtém a hora de início
    const horaFim = document.getElementById('hora_fim').value; // Obtém a hora de fim
    const motivo = document.getElementById('motivo').value; // Obtém o motivo

    const agora = new Date(); // Obtém a data atual
    const [horaInicioH, horaInicioM] = horaInicio.split(':').map(Number); // Divide a hora de início
    const [horaFimH, horaFimM] = horaFim.split(':').map(Number); // Divide a hora de fim

    // Verificações de data e hora
    for (const data of datasSelecionadas) {
        const [ano, mes, dia] = data.split('-').map(Number);
        const dataSelecionada = new Date(ano, mes - 1, dia, horaInicioH, horaInicioM); // Cria um novo objeto Date com a data e a hora

        if (dataSelecionada < agora) {
            alert(`A data ${data} e horário já passaram. Não é possível agendar.`);
            return; // Se a data já passou, não permite agendamento
        }

        if (horaInicioH > horaFimH || (horaInicioH === horaFimH && horaInicioM >= horaFimM)) {
            alert('A hora de início deve ser anterior à hora de fim.');
            return; // Garantir que o horário início é anterior ao de fim
        }
    }

    const agendamentoData = {
        id_sala: idSala,
        id_professor: idProfessor,
        tipo_aula: tipoAulaDescricao, 
        data_reservas: datasSelecionadas, 
        hora_inicio: horaInicio,
        hora_fim: horaFim,
        motivo // Armazena o motivo da reserva
    };

    console.log('Dados do agendamento:', agendamentoData); // Registra os dados do agendamento.

    // Requisição POST para agendar a sala
    try {
        const response = await fetch('/agendar-sala', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(agendamentoData) // Envia os dados do agendamento
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro ao agendar sala:', errorText);
            alert(`${errorText}`);
            return; // Se houver erro, exiba uma mensagem
        }

        alert('Sala agendada com sucesso!'); // Confirmação de agendamento
        document.getElementById('agendamentoForm').reset(); // Reseta o formulário após o agendamento
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao agendar sala. Por favor, tente novamente.'); // Mensagem de erro genérica
    }
}

// Verificar agendamentos existentes
async function verificarAgendamentosExistentes(agendamentoData) {
    let conflitos = []; // Array para armazenar conflitos

    // Loop através de cada data selecionada
    for (let data of agendamentoData.data_reservas) {
        // Verifica se já há agendamentos para a sala na data e horário específicos
        const resposta = await fetch(`/verificar-agendamento/${agendamentoData.id_sala}/${data}/${agendamentoData.hora_inicio}/${agendamentoData.hora_fim}`);

        if (resposta.ok) {
            const resultado = await resposta.json();
            if (resultado.existe) {
                // Adiciona os agendamentos ao array de conflitos
                conflitos.push(...resultado.agendamentos); // Adiciona todos os agendamentos que causam conflito
            }
        }
    }

    return conflitos; // Retorna os conflitos encontrados, se houver
}

// Adiciona o evento de submit ao formulário
document.getElementById('agendamentoForm').addEventListener('submit', agendarSala);

// Inicializa o carregamento das unidades
carregarUnidadesDoProfessor(); // Chama a função para carregar apenas a unidade do professor logado

// Verificar conflitos ao clicar
document.getElementById('verificarAgendamentos').addEventListener('click', async () => {
    const datasSelecionadas = document.getElementById('data_selecionada').value.split(',').map(date => date.trim());
    const idSala = document.getElementById('id_sala').value;
    const horaInicio = document.getElementById('hora_inicio').value;
    const horaFim = document.getElementById('hora_fim').value;

    // Formatar horas
    const horaInicioFormatada = formatarHora(horaInicio);
    const horaFimFormatada = formatarHora(horaFim);

    // Log das horas formatadas
    console.log('Hora de Início formatada:', horaInicioFormatada);
    console.log('Hora de Fim formatada:', horaFimFormatada);

    const conflitos = await verificarAgendamentosExistentes({
        id_sala: idSala, // Certifique-se de que está aqui
        data_reservas: datasSelecionadas,
        hora_inicio: horaInicioFormatada,
        hora_fim: horaFimFormatada
    });

    // Exibir resultados
    const resultadoDiv = document.getElementById('resultadoVerificacao');
    resultadoDiv.innerHTML = ''; // Limpa resultados anteriores

    if (conflitos.length > 0) {
        resultadoDiv.innerHTML = `<p>Conflitos encontrados nas seguintes datas/horários:</p><ul>`;
        conflitos.forEach(conflito => {
            // Aqui você deve acessar o nome do professor diretamente do objeto 'conflito'
            const partesData = conflito.data_reservas.split('-'); 
            const dataFormatada = `${partesData[2]}-${partesData[1]}-${partesData[0]}`; 

            // Exiba os horários corretos do agendamento existente
            resultadoDiv.innerHTML += `<li>Data: ${dataFormatada}, de ${conflito.hora_inicio} a ${conflito.hora_fim} | Agendado por: ${conflito.nome_professor}</li>`;
        });

        resultadoDiv.innerHTML += '</ul>';
    } else {
        resultadoDiv.innerHTML = '<p>Não há conflitos para as datas e horários selecionados.</p>';
    }
});

// Lógica para verificar salas disponíveis
// Verificar salas disponíveis
document.getElementById('verificarSalas').addEventListener('click', async () => {
    const datasSelecionadas = document.getElementById('data_selecionada').value.split(',').map(date => date.trim());
    const horaInicio = document.getElementById('hora_inicio').value;
    const horaFim = document.getElementById('hora_fim').value;
    const codigoUnidade = document.getElementById('codigo_unidade').value; 

    // Validar entradas antes da requisição
    if (!datasSelecionadas.length || !horaInicio || !horaFim || !codigoUnidade) {
        alert('Por favor, preencha as datas, horas e selecione a unidade.');
        return;
    }

    // Fazer requisição para verificar salas disponíveis
    const resposta = await fetch(`/salas-disponiveis?data=${datasSelecionadas.join(',')}&hora_inicio=${horaInicio}&hora_fim=${horaFim}&codigo_unidade=${codigoUnidade}`);

    if (!resposta.ok) {
        const errorText = await resposta.text();
        console.error(`Erro ao buscar salas: ${errorText}`);
        alert(`Erro: ${resposta.status} - ${errorText}`);
        return;
    }

    const resultado = await resposta.json();

    // Limpando os resultados anteriores
    const resultadoDiv = document.getElementById('resultadoSalasDisponiveis');
    resultadoDiv.innerHTML = '';

    // Exibir salas disponíveis
    if (resultado.salasDisponiveis && resultado.salasDisponiveis.length > 0) {
        resultadoDiv.innerHTML = `<h3>Salas Disponíveis:</h3><ul>`;
        resultado.salasDisponiveis.forEach(sala => {
            // Formatar as datas de 'YYYY-MM-DD' para 'DD-MM-YYYY'
            const datasFormatadas = sala.datas_disponiveis.map(data => {
                const partes = data.split('-');
                return `${partes[2]}-${partes[1]}-${partes[0]}`; // DD-MM-YYYY
            });

            // Adiciona a opção de sala com dados para o clique
            resultadoDiv.innerHTML += `<li class="sala-item" data-id="${sala.id_sala}" data-datas="${datasFormatadas.join(', ')}">
                ${sala.nome_sala} - disponível nas datas:
                <span class="datas">${datasFormatadas.join(', ')}</span>
            </li>`;
        });
        resultadoDiv.innerHTML += `</ul>`;
    } else {
        resultadoDiv.innerHTML = '<p>Não há salas disponíveis para as datas e horários selecionados.</p>';
    }

    // Adicionar evento de clique para as salas disponíveis
    const salaItems = document.querySelectorAll('.sala-item');

    salaItems.forEach(item => {
        item.addEventListener('click', () => {
            const idSala = item.getAttribute('data-id'); // Obtém o ID da sala clicada
            const datas = item.getAttribute('data-datas'); // Obtém as datas disponíveis

            document.getElementById('id_sala').value = idSala; // Preenche o campo da sala
            document.getElementById('data_selecionada').value = datas; // Preenche o campo das datas selecionadas
        });
    });
});



// Função para formatar a data de YYYY-MM-DD para DD-MM-YYYY
function formatarData(data) {
    const partes = data.split('-'); // Divide a string em partes
    return `${partes[2]}/${partes[1]}/${partes[0]}`; // Retorna o formato DD-MM-YYYY
}


// Função para ordenar datas
function ordenarDatas(datas) {
    return datas.sort((a, b) => new Date(a) - new Date(b));
}
function formatarHora(hora) {
    const [h, m] = hora.split(':');
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`; // Adiciona ':00' para os segundos
}



// Função para validar se a hora está no formato correto
function isValidTime(time) {
    const timePattern = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/; 
    return timePattern.test(time);
}





// Função para excluir um agendamento
async function excluirAgendamento(id) {
    try {
        const response = await fetch(`/excluir-agendamento/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Agendamento excluído com sucesso!');
            carregarAgendamentosDoProfessor(); // Recarrega os agendamentos
        } else {
            alert('Erro ao excluir agendamento.');
        }
    } catch (error) {
        console.error('Erro ao excluir agendamento:', error);
    }
}

document.getElementById('aplicarFiltros').addEventListener('click', async () => {
    const salaFiltro = document.getElementById('filtroSala').value.toLowerCase();
    const dataFiltro = document.getElementById('filtroData').value; // Datas em formato YYYY-MM-DD
    const horaFiltro = document.getElementById('filtroHora').value;

    // Busque os agendamentos novamente
    const response = await fetch('/listar-agendamentos-professor-logado');
    if (!response.ok) {
        const errorText = await response.text();
        alert('Erro ao carregar agendamentos: ' + errorText);
        return;
    }

    const agendamentos = await response.json();
    const agendamentosList = document.getElementById('agendamentosExistentes');
    agendamentosList.innerHTML = '';

    // Convertendo as datas do filtro para um array
    const datasFiltro = dataFiltro ? dataFiltro.split(',').map(data => data.trim()).map(formatarData) : [];

    // Filtrando agendamentos com base nos critérios fornecidos
    const agendamentosFiltrados = agendamentos.filter(agendamento => {
        const salaAgendamento = agendamento.nome_sala.toLowerCase();
        const dataAgendamento = formatarData(agendamento.data_reservas); // Formata para DD/MM/YYYY
        const horaAgendamento = formatarHora(agendamento.hora_inicio);

        const correspondeSala = salaFiltro ? salaAgendamento.includes(salaFiltro) : true;
        const correspondeData = datasFiltro.length ? datasFiltro.includes(dataAgendamento) : true; // Verifica se a data do agendamento está nas datas filtradas
        const correspondeHora = horaFiltro ? horaAgendamento.startsWith(horaFiltro) : true;

        return correspondeSala && correspondeData && correspondeHora;
    });

    // Exibir os agendamentos filtrados
    if (agendamentosFiltrados.length === 0) {
        agendamentosList.textContent = 'Nenhum agendamento encontrado com os filtros aplicados.';
    } else {
        agendamentosFiltrados.forEach(agendamento => {
            const agendamentoItem = document.createElement('div');
            agendamentoItem.innerHTML = `
                <p><strong>Sala:</strong> ${agendamento.nome_sala}</p>
                <p><strong>Data:</strong> ${formatarData(agendamento.data_reservas)}</p>
                <p><strong>Início:</strong> ${formatarHora(agendamento.hora_inicio)}</p>
                <p><strong>Fim:</strong> ${formatarHora(agendamento.hora_fim)}</p>
                <p><strong>Motivo:</strong> ${agendamento.motivo || 'Nenhum motivo fornecido'}</p>
                <button onclick="excluirAgendamento(${agendamento.id_agendamento})">Excluir</button>
                <hr>
            `;
            agendamentosList.appendChild(agendamentoItem);
        });
    }
    // Supondo que agendamentosFiltrados seja a lista de agendamentos já filtrados
    agendamentosAtual = agendamentosFiltrados; // Armazena os agendamentos filtrados
    paginaAtual = 0; // Reseta a página atual
    exibirAgendamentos(); // Chama a função para mostrar os agendamentos
});

flatpickr("#filtroData", {
    mode: "multiple", // Permite a seleção de várias datas
    dateFormat: "Y-m-d", // Formato de entrada
    locale: "pt", // Definindo o idioma
    onClose: function(selectedDates) {
        const formataData = selectedDates.map(date => date.toISOString().split('T')[0]).join(', ');
        document.getElementById('filtroData').value = formataData; // Atualiza o valor do input
    }
});


// Permitir que o usuário pressione "Enter" para aplicar os filtros
document.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        document.getElementById('aplicarFiltros').click();
    }
});
// Variáveis globais para controlar a exibição de agendamentos
let agendamentosAtual = []; // Array para armazenar os agendamentos filtrados
let paginaAtual = 0; // Variável para controlar a página atual
const itensPorPagina = 8; // Número de itens que você deseja mostrar por página (8 para 2 linhas de 4)

// Função para exibir os agendamentos
function exibirAgendamentos() {
    const agendamentosList = document.getElementById('agendamentosExistentes');
    agendamentosList.innerHTML = ''; // Limpa o conteúdo anterior

    // Calcular os índices para a exibição da página atual
    const inicio = paginaAtual * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const agendamentosParaExibir = agendamentosAtual.slice(inicio, fim); // Obtém os agendamentos da página atual

    if (agendamentosParaExibir.length === 0) {
        agendamentosList.innerHTML = '<p>Nenhum agendamento encontrado.</p>';
    } else {
        agendamentosParaExibir.forEach(agendamento => {
            const agendamentoItem = document.createElement('div');
            agendamentoItem.innerHTML = `
                <p><strong>Sala:</strong> ${agendamento.nome_sala}</p>
                <p><strong>Data:</strong> ${formatarData(agendamento.data_reservas)}</p>
                <p><strong>Início:</strong> ${formatarHora(agendamento.hora_inicio)}</p>
                <p><strong>Fim:</strong> ${formatarHora(agendamento.hora_fim)}</p>
                <p><strong>Motivo:</strong> ${agendamento.motivo || 'Nenhum motivo fornecido'}</p>
                <button onclick="excluirAgendamento(${agendamento.id_agendamento})">Excluir</button>
                <hr>
            `;
            agendamentosList.appendChild(agendamentoItem);
        });
    }

    // Controle da exibição dos botões de navegação
    document.getElementById('botaoAnterior').style.display = paginaAtual > 0 ? 'block' : 'none';
    document.getElementById('botaoProximo').style.display = (paginaAtual + 1) * itensPorPagina < agendamentosAtual.length ? 'block' : 'none';
}

// Evento ao clicar no botão "Ver meus Agendamentos"
document.getElementById('verMeusAgendamentos').addEventListener('click', async () => {
    const response = await fetch('/listar-agendamentos-professor-logado');
    
    // Verifique se a resposta é OK
    if (!response.ok) {
        const errorText = await response.text();
        alert('Erro ao carregar agendamentos: ' + errorText);
        return;
    }

    const agendamentos = await response.json();
    
    // Armazenar os agendamentos na variável global
    agendamentosAtual = agendamentos; 

    // Resetar a página atual
    paginaAtual = 0; 

    // Exibir os agendamentos
    exibirAgendamentos(); 
});

// Funções de navegação
document.getElementById('botaoProximo').addEventListener('click', () => {
    paginaAtual++;
    exibirAgendamentos();
});

document.getElementById('botaoAnterior').addEventListener('click', () => {
    paginaAtual--;
    exibirAgendamentos();
});
