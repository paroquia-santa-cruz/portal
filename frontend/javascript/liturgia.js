async function buscarLiturgia(dia, mes, ano) {
  const url = `https://liturgia.up.railway.app/v2/?dia=${dia}&mes=${mes}&ano=${ano}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Erro ao buscar liturgia");
    return await response.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

function getCorClasse(cor) {
  switch (cor.toLowerCase()) {
    case "branco":
      return "bg-light text-dark";
    case "vermelho":
      return "bg-danger text-white";
    case "verde":
      return "bg-success text-white";
    case "roxo":
      return "bg-purple text-white";
    default:
      return "bg-secondary text-white";
  }
}

function renderLiturgia(data) {
  const container = document.getElementById("liturgiaContainer");
  if (!data) {
    container.innerHTML = `<div class="alert alert-warning">Liturgia não disponível para essa data.</div>`;
    return;
  }

  const corTag = getCorClasse(data.cor);

  let html = `
    <div class="d-flex flex-wrap justify-content-center mb-5 gap-3">
      <div class="badge bg-dark text-white">Data</div>
      <div class="badge bg-info text-dark">${data.data}</div>

      <div class="badge bg-dark text-white">Tipo</div>
      <div class="badge bg-primary text-white">${data.liturgia}</div>

      <div class="badge bg-dark text-white">Cor</div>
      <div class="badge ${corTag}">${data.cor}</div>
    </div>
  `;

  if (data.antifonas?.entrada) {
    html += `<h5><strong>Antífona de Entrada</strong></h5><p>${data.antifonas.entrada}</p>`;
  }

  if (data.oracoes?.coleta) {
    html += `<h5><strong>Oração do Dia / Coleta</strong></h5><p>${data.oracoes.coleta.replace(/\n/g, "<br>")}</p>`;
  }

  html += `<hr><h5><strong>Leituras</strong></h5><div class="mb-4 d-flex flex-wrap gap-2">`;

  for (const [secao, leituras] of Object.entries(data.leituras)) {
    if (!leituras || leituras.length === 0) continue;

    let nome = secao;
    let badge = "bg-info text-white";
    let border = "border-info";

    if (secao === "salmo") {
      nome = "Salmo";
      badge = "bg-primary text-white";
      border = "border-primary";
    } else if (secao === "evangelho") {
      nome = "Evangelho";
      badge = "bg-success text-white";
      border = "border-success";
    } else if (secao === "primeiraLeitura") {
      nome = "Primeira Leitura";
    } else if (secao === "segundaLeitura") {
      nome = "Segunda Leitura";
    }

    html += `
      <span class="badge ${badge} rounded-pill cursor-pointer"
        role="button"
        onclick="toggleLeitura('${secao}', event)">
        ${nome}
        <i class="far fa-eye ms-1 leitura-icon d-none"></i>
      </span>
    `;
  }

  html += `</div>`;

  for (const [secao, leituras] of Object.entries(data.leituras)) {
    if (!leituras || leituras.length === 0) continue;

    let border = "border-info";
    if (secao === "salmo") border = "border-primary";
    else if (secao === "evangelho") border = "border-success";

    html += `<div id="leitura-${secao}" class="border ${border} rounded p-3 mb-4 d-none leitura-box">`;

    for (const leitura of leituras) {
      if (leitura.tipo) html += `<h6>${leitura.tipo}</h6>`;
      if (leitura.titulo || leitura.referencia) {
        html += `<p><strong>${leitura.titulo || leitura.referencia}</strong>`;
        if (leitura.titulo && leitura.referencia) html += ` – ${leitura.referencia}`;
        html += `</p>`;
      }
      if (leitura.refrao) html += `<p class="fw-bold text-info">Ref: ${leitura.refrao}</p>`;
      if (leitura.texto) html += `<p>${leitura.texto.replace(/\n/g, "<br>")}</p>`;
      html += `<br>`;
    }

    html += `</div>`;
  }

  if (data.oracoes?.oferendas) {
    html += `<hr><h5><strong>Oração sobre as Oferendas</strong></h5><p>${data.oracoes.oferendas.replace(/\n/g, "<br>")}</p>`;
  }

  if (data.antifonas?.comunhao) {
    html += `<hr><h5><strong>Antífona de Comunhão</strong></h5><p>${data.antifonas.comunhao}</p>`;
  }

  if (data.oracoes?.comunhao) {
    html += `<hr><h5><strong>Oração após a Comunhão</strong></h5><p>${data.oracoes.comunhao.replace(/\n/g, "<br>")}</p>`;
  }

  if (data.oracoes?.extras?.length > 0) {
    html += `<hr><h4><strong>Partes Litúrgicas Especiais</strong></h4>`;
    for (const extra of data.oracoes.extras) {
      html += `<h5>${extra.titulo}</h5><p>${extra.texto.replace(/\n/g, "<br>")}</p><br>`;
    }
  }

  container.innerHTML = html;
}

// Submit e carregamento inicial
document.getElementById("formLiturgia").addEventListener("submit", async (e) => {
  e.preventDefault();
  const inputData = document.getElementById("inputData").value;
  if (!inputData) return;

  const [ano, mes, dia] = inputData.split("-");
  const container = document.getElementById("liturgiaContainer");
  container.innerHTML = "Carregando...";

  const liturgia = await buscarLiturgia(dia, mes, ano);
  renderLiturgia(liturgia);
});

window.addEventListener("load", async () => {
  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, "0");
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const ano = hoje.getFullYear();
  const liturgia = await buscarLiturgia(dia, mes, ano);
  renderLiturgia(liturgia);
});

// Toggle seções
window.toggleLeitura = function (id, event) {
  document.querySelectorAll(".leitura-box").forEach((box) => {
    box.classList.add("d-none");
  });

  const leituraEl = document.getElementById("leitura-" + id);
  if (leituraEl) leituraEl.classList.remove("d-none");

  document.querySelectorAll(".leitura-icon").forEach(icon => icon.classList.add("d-none"));
  const icon = event.currentTarget.querySelector(".leitura-icon");
  if (icon) icon.classList.remove("d-none");
};
