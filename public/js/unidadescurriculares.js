
// Função para carregar informações do usuário
async function carregarInfoUsuario() {
    try {
        const response = await fetch('/user-info');
        if (!response.ok) throw new Error('Erro ao carregar informações do usuário.');

        const userInfo = await response.json();
        return userInfo;
    } catch (error) {
        console.error('Erro ao carregar informações do usuário:', error);
        return null;
    }
}

async function carregarUnidades() {
    const userInfo = await carregarInfoUsuario();

    if (!userInfo) {
        document.getElementById('resultadoAdicionar').innerHTML = 'Erro ao carregar unidades. Por favor, faça login novamente.';
        return;
    }

    try {
        const response = await fetch(`/listar-unidades-salas`);
        const unidades = await response.json();

        const selectUnidades = document.getElementById('id_unidade');
        selectUnidades.innerHTML = '<option value="">Selecione uma unidade</option>';

        // Filtra as unidades associadas ao usuário logado
        unidades.forEach(unidade => {
            if (userInfo.unidades.includes(unidade.codigo)) { // Verifique se a unidade está na lista de unidades do usuário
                const option = document.createElement('option');
                option.value = unidade.codigo;
                option.textContent = unidade.nome;
                selectUnidades.appendChild(option);
            }
        });

        // Se unidades foram carregadas, o primeiro é selecionado
        if (selectUnidades.options.length > 1) {
            carregarTiposAulaPorUnidade(selectUnidades.options[1].value); // Carregar tipos de aula para a primeira unidade
        }
    } catch (error) {
        console.error('Erro ao carregar unidades:', error);
        document.getElementById('resultadoAdicionar').innerHTML = 'Erro ao carregar unidades.';
    }
}


// Função para carregar tipos de aula com base na unidade selecionada
async function carregarTiposAulaPorUnidade(codigoUnidade) {
    try {
        const response = await fetch(`/listar-tipos-aula-por-unidade/${codigoUnidade}`);
        const tiposAula = await response.json();

        //Ordenar os tipos de aula pela descrição (alfabeticamente)
        tiposAula.sort((a, b) => {
            const aWords = a.descricao.split(' ');
            const bWords = b.descricao.split(' ');
            for (let i = 0; i < Math.max(aWords.length, bWords.length); i++) {
                // Se uma palavra existe apenas em um dos lados, é menor
                if (i >= aWords.length) return -1; 
                if (i >= bWords.length) return 1; 
                
                const comparison = aWords[i].localeCompare(bWords[i]);
                if (comparison !== 0) return comparison; // Se são diferentes, retorna a comparação
            }
            return 0; // Se são iguais até aqui
        });

        const selectTiposAula = document.getElementById('tipo_aula_id');
        selectTiposAula.innerHTML = '<option value="">Selecione um tipo de aula</option>';

        tiposAula.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo.id_tipo_aula;
            option.textContent = tipo.descricao;
            selectTiposAula.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar tipos de aula:', error);
    }
}

// Evento para carregar tipos de aula quando uma unidade for selecionada
document.getElementById('id_unidade').addEventListener('change', function() {
    const codigoUnidadeSelecionada = this.value;
    carregarTiposAulaPorUnidade(codigoUnidadeSelecionada);
});

// Ação ao enviar o formulário de adicionar
document.getElementById('tipoAulaForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const descricao = document.getElementById('descricao').value;
    const id_unidade = document.getElementById('id_unidade').value;

    

    try {
        const response = await fetch('/adicionar-unidade-tipo-aula', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ descricao, id_unidade })
        });

        if (response.ok) {
            document.getElementById('resultadoAdicionar').innerHTML = 'Tipo de aula adicionado e associado à unidade com sucesso!';
            document.getElementById('tipoAulaForm').reset();
            carregarTiposAulaPorUnidade(id_unidade); // Atualiza a lista de tipos de aula
        } else {
            const errorText = await response.text();
            document.getElementById('resultadoAdicionar').innerHTML = `Erro: ${errorText}`;
        }
    } catch (error) {
        console.error('Erro ao adicionar tipo de aula:', error);
        document.getElementById('resultadoAdicionar').innerHTML = 'Erro ao adicionar tipo de aula. Tente novamente.';
    }
});



//dessassociar
async function dessassociarTipoAula(idTipoAula) {
    try {
        const response = await fetch(`/dessassociar-tipo-aula/${idTipoAula}`, {
            method: 'DELETE', 
            
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ao dessassociar tipo de aula: ${errorText}`);
        }

        return true; 
        
    } catch (error) {
        console.error('Erro ao dessassociar tipo de aula:', error);
        return false; 
        
    }
}


// Ação para excluir tipo de aula
document.getElementById('btnExcluir').addEventListener('click', async function() {
    const idTipoAula = document.getElementById('tipo_aula_id').value;

    // Confirmação antes de excluir
    if (confirm('Tem certeza que deseja excluir este tipo de aula? Este tipo será dessassociado de todas as unidades antes da exclusão.')) {
        const dessassociado = await dessassociarTipoAula(idTipoAula);
        
        if (dessassociado) {
            
            try {
                const response = await fetch(`/excluir-tipo-aula/${idTipoAula}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    document.getElementById('resultadoExcluir').innerHTML = 'Tipo de aula excluído com sucesso!';
                    document.getElementById('editarTipoAulaForm').reset();
                    carregarTiposAulaPorUnidade(document.getElementById('id_unidade').value); // Atualiza a lista de tipos de aula
                } else {
                    const errorText = await response.text();
                    document.getElementById('resultadoExcluir').innerHTML = `Erro: ${errorText}`;
                }
            } catch (error) {
                console.error('Erro ao excluir tipo de aula:', error);
                document.getElementById('resultadoExcluir').innerHTML = 'Erro ao excluir tipo de aula. Tente novamente.';
            }
        } else {
            document.getElementById('resultadoExcluir').innerHTML = 'Erro ao dessassociar tipo de aula. Não foi possível excluir.';
        }
    }
});


// Ação ao enviar o formulário tipoAulaForm
document.getElementById('tipoAulaForm1').addEventListener('submit', async function(event) {
    event.preventDefault();

    const ano = document.getElementById('ano').value;
    const semestre = parseInt(document.getElementById('semestre').value);
    const turma = document.getElementById('turma').value;
    const turno = parseInt(document.getElementById('turno').value);
    const modulo = document.getElementById('modulo').value;
    const tipoCurso = document.getElementById('curso').value;

    try {
        const response = await fetch('/adicionar-unidade-curricular', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ano, semestre, turma, turno, modulo, tipoCurso })
        });

        if (response.ok) {
            document.getElementById('resultadoAdicionar').innerHTML = 'Unidade curricular adicionada com sucesso!';
            document.getElementById('tipoAulaForm1').reset();
        } else {
            const errorText = await response.text();
            document.getElementById('resultadoAdicionar').innerHTML = `Erro: ${errorText}`;
        }
    } catch (error) {
        console.error('Erro ao adicionar unidade curricular:', error);
        document.getElementById('resultadoAdicionar').innerHTML = 'Erro ao adicionar unidade curricular. Tente novamente.';
    }
});
document.getElementById('associarForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const tipoAula = document.getElementById('tipoAula').value;
    const unidadeCurricular = document.getElementById('unidadeCurricular').value;

    try {
        const response = await fetch('/associar-unidade-tipo-aula', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_unidade_curricular: unidadeCurricular, id_tipo_aula: tipoAula })
        });

        if (response.ok) {
            document.getElementById('resultadoAssociacao').innerHTML = 'Associação criada com sucesso!';
            document.getElementById('associarForm').reset();
        } else {
            const errorText = await response.text();
            document.getElementById('resultadoAssociacao').innerHTML = `Erro: ${errorText}`;
        }
    } catch (error) {
        console.error('Erro ao associar:', error);
        document.getElementById('resultadoAssociacao').innerHTML = 'Erro ao associar. Tente novamente.';
    }
});

document.addEventListener('DOMContentLoaded', function () {
    carregarUnidadesCurriculares();
    carregarTiposDeAula();
});

async function carregarUnidadesCurriculares() {
    try {
        const response = await fetch('/listar-unidades-curriculares');
        const unidades = await response.json();

        const selectUnidadeCurricular = document.getElementById('unidadeCurricular');
        selectUnidadeCurricular.innerHTML = '<option value="">Selecione uma unidade curricular</option>';

        unidades.forEach(unidade => {
            const option = document.createElement('option');
            option.value = unidade.id_unidade_curricular; // Certifique-se de que o campo de ID está correto
            option.textContent = `${unidade.ano} - ${unidade.tipo_curso} - ${unidade.turma}`;
            selectUnidadeCurricular.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar unidades curriculares:', error);
    }
}

async function carregarTiposDeAula() {
    try {
        const response = await fetch('/listar-todos-tipos-aula');
        const tipos = await response.json();

        const selectTipoAula = document.getElementById('tipoAula');
        selectTipoAula.innerHTML = '<option value="">Selecione um tipo de aula</option>';

        tipos.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo.id_tipo_aula;
            option.textContent = tipo.descricao;
            selectTipoAula.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar tipos de aula:', error);
    }
}
document.addEventListener('DOMContentLoaded', function () {
    carregarUnidadesParaDessociar();
});

async function carregarUnidadesParaDessociar() {
    try {
        const response = await fetch('/listar-unidades-curriculares');
        const unidades = await response.json();

        const selectUnidadeDessociar = document.getElementById('unidadeDessociar');
        selectUnidadeDessociar.innerHTML = '<option value="">Selecione uma unidade curricular</option>';

        unidades.forEach(unidade => {
            const option = document.createElement('option');
            option.value = unidade.id_unidade_curricular;
            option.textContent = `${unidade.ano} - ${unidade.tipo_curso} - ${unidade.turma}`;
            selectUnidadeDessociar.appendChild(option);
        });

        selectUnidadeDessociar.addEventListener('change', carregarTiposAssociados);
    } catch (error) {
        console.error('Erro ao carregar unidades curriculares:', error);
    }
}

async function carregarTiposAssociados() {
    const unidadeId = document.getElementById('unidadeDessociar').value;
    if (!unidadeId) return;

    try {
        const response = await fetch(`/listar-associacoes/${unidadeId}`);
        const associacoes = await response.json();

        const listaTipoAulas = document.getElementById('listaTipoAulas');
        listaTipoAulas.innerHTML = ''; // Limpa antes de adicionar

        associacoes.forEach(associacao => {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = associacao.id_tipo_aula;
            checkbox.id = 'tipo_' + associacao.id_tipo_aula;
            
            const label = document.createElement('label');
            label.htmlFor = 'tipo_' + associacao.id_tipo_aula;
            label.textContent = associacao.descricao;

            const container = document.createElement('div');
            container.appendChild(checkbox);
            container.appendChild(label);
            
            listaTipoAulas.appendChild(container);
        });

        document.getElementById('tiposAssociados').style.display = associacoes.length ? 'block' : 'none';
    } catch (error) {
        console.error('Erro ao carregar tipos de aula associados:', error);
    }
}

document.getElementById('dessociarForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const unidadeId = document.getElementById('unidadeDessociar').value;
    const checkboxes = document.querySelectorAll('#listaTipoAulas input[type="checkbox"]:checked');
    const tiposAulaIds = Array.from(checkboxes).map(checkbox => checkbox.value);

    if (!tiposAulaIds.length) {
        document.getElementById('resultadoDessociacao').innerHTML = 'Selecione ao menos um tipo de aula para dessassociar.';
        return;
    }

    try {
        const response = await fetch('/dessassociar-unidade-tipo-aula', {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id_unidade_curricular: unidadeId, id_tipos_aula: tiposAulaIds })
        });

        if (response.ok) {
            document.getElementById('resultadoDessociacao').innerHTML = 'Dessassociação realizada com sucesso!';
            carregarTiposAssociados();
        } else {
            const errorText = await response.text();
            document.getElementById('resultadoDessociacao').innerHTML = `Erro: ${errorText}`;
        }
    } catch (error) {
        console.error('Erro ao dessassociar:', error);
        document.getElementById('resultadoDessociacao').innerHTML = 'Erro ao dessassociar. Tente novamente.';
    }
});





// Chama a função para carregar as unidades ao carregar a página
document.addEventListener('DOMContentLoaded', carregarUnidades);
