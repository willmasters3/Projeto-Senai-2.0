document.getElementById('verificarSalas').addEventListener('click', async () => {
    const dataInicio = document.getElementById('data_inicio').value;
    const dataFim = document.getElementById('data_fim').value;
    const horaInicio = document.getElementById('hora_inicio').value;
    const horaFim = document.getElementById('hora_fim').value;

    const resposta = await fetch(`/salas-disponiveis?data_inicio=${dataInicio}&data_fim=${dataFim}&hora_inicio=${horaInicio}&hora_fim=${horaFim}`);
    const resultado = await resposta.json();

    const resultadoDiv = document.getElementById('resultadoSalasDisponiveis');
    resultadoDiv.innerHTML = ''; // Limpa os resultados anteriores

    if (resultado.salasDisponiveis.length > 0) {
        resultadoDiv.innerHTML = `<h3>Salas Disponíveis:</h3><ul>`;
        resultado.salasDisponiveis.forEach(sala => {
            resultadoDiv.innerHTML += `<li>${sala.nome_sala}</li>`;
        });
        resultadoDiv.innerHTML += `</ul>`;
    } else {
        resultadoDiv.innerHTML = '<p>Não há salas disponíveis para as datas e horários selecionados.</p>';
    }

    if (resultado.salasIndisponiveis.length > 0) {
        resultadoDiv.innerHTML += `<h3>Salas Indisponíveis:</h3><ul>`;
        resultado.salasIndisponiveis.forEach(sala => {
            resultadoDiv.innerHTML += `<li>${sala.nome_sala}: Ocupada por ${sala.nome_professor} de ${sala.hora_inicio} até ${sala.hora_fim}</li>`;
        });
        resultadoDiv.innerHTML += `</ul>`;
    }
});
