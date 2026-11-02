# Tabela Periódica Interativa e Acessível — Gêmeo Digital 3D

Reprodução tridimensional e interativa da instalação física descrita em
[Manual Maker — Tabela Periódica Interativa e Acessível](https://www.manualmaker.com/projeto/tabela-periodica-interativa):
118 caixas de MDF 3 mm com placas de acrílico gravadas, fitas LED RGB, Arduino, quatro botões de arcade e identificação em braile.

| Link | Endereço |
|---|---|
| Demo 3D | <https://tabela-periodica-3d-six.vercel.app/> |
| Repositório | <https://github.com/EduardoG-13/tabela-periodica-3d> |
| Manual Maker | <https://www.manualmaker.com/projeto/tabela-periodica-interativa> |
| Artigo científico | [DOI 10.56579/rei.v8i1.2479](https://doi.org/10.56579/rei.v8i1.2479) — Souza, D. P. B. et al., *Revista de Estudos Interdisciplinares*, v. 8, n. 1, 2026 |

Créditos do projeto físico: Laura Cunha Resende, Dayse Pereira Barbosa Souza, Eduardo Gabriel de Oliveira, Gisele Cantalice
Salomão da Silva, Ana Paula Nunes Sampaio e Marcos André Ferreira de Araujo Santos, com as equipes de estudantes, Espaço Maker
e manutenção da Escola Sesc de Ensino Médio (Rio de Janeiro).

## Executar

```bash
npm install
npm run dev            # servidor de desenvolvimento (Vite)
npm run build          # verificação TypeScript + build de produção em dist/
npm run validate:data  # valida os 118 elementos (contagem, posições, elétrons, grupos)
```

Requisitos: Node 20+ e um navegador com WebGL 2.

## O que a aplicação faz

- **Cena 3D**: parede de pastilhas marrons, piso de pedra portuguesa, inscrição metálica “Tabela Periódica”, 118 módulos e 2 marcadores (57–71, 89–103) nas posições da foto. Séries f nas colunas 4–18, como na instalação.
- **Módulos**: geometria extraída de `caixa.svg` e `placa.svg` (encaixes finger joint, 5 encaixes de 7,1 mm no topo das paredes, rasgo de luz de 100 × 8 mm, rasgos dos pés do acrílico, furos Ø10 mm nas laterais e Ø2 mm no tampo inferior). Gravação a laser com halo de dispersão, bordas iluminadas, 5 LEDs por módulo, plaquinha com nome em alto-relevo e pontos braile em relevo (grafia braile para a língua portuguesa).
- **Iluminação**: os 4 botões de arcade (na cena e no painel) acendem só o seu grupo e apagam os demais, como no código original (etapa 5.2). Há também “Todos acesos”, “Apagar tudo”, intensidade e ligar/desligar individual.
- **Retirar do nicho**: clique (ou setas + Enter) → o módulo levanta, desliza para fora sem colidir e fica suspenso; arraste para girar 360°, ou use as faces Frente/Trás/Laterais/Topo/Base. Controles: Girar módulo, Visualizar interior, Explodir peças, Acender/apagar LED, Voltar ao nicho.
- **Engenharia**: vista explodida em ordem de montagem; cada peça é clicável e mostra material, função, dimensões, fixação e interação, com selo *documentado/estimado*.
- **Caixa de controle (botões)**: objeto próprio, em MDF claro, entre a placa informativa e a coluna 1, logo abaixo da plaquinha de créditos e na altura do potássio, como na foto da instalação. Tampo plano vazio (prateleira) e os 4 botões de arcade na face frontal, na ordem vermelho, verde, amarelo, azul. Cada botão tem corpo, aro, êmbolo e animação de clique; a caixa tem laterais, fundo, tampa, face frontal e sombra de contato. Os botões não têm inscrições (a legenda de cores é da simulação). Medidas estimadas pela foto.
- **Caixa técnica (eletrônica)**: outro objeto, à direita do Rn, montado com 7 das 13 peças de `src/assets/caixa_arduino.svg` (contornos, encaixes, rasgos, grade de entrada de ar no fundo, grade de saída numa lateral, furo Ø80 do cooler no tampo, rasgo elíptico 92 × 64 mm para os cabos). Dentro: fonte 24 V / 2 A, 1 Arduino, cooler, chave geral, disjuntor, pontos de conversão “a confirmar”, fios e conectores de 3 vias, tudo em posição estimada. A parte de tensão de rede não é representada.
- **Inspeção** (clique numa das caixas ou use Engenharia → “Inspecionar…”): a câmera aproxima; na caixa de controle é possível pressionar os botões, abrir a tampa, explodir as peças e, só com o comando “Desmontar botões da face”, soltar os botões; na caixa técnica, deixar o painel transparente e explodir as peças, com marcadores numerados ligados ao painel lateral. “Voltar à montagem original” (ou Esc) desfaz tudo.
- **Eletrônica**: modos Instalação normal, Circuito visível, Fluxo de alimentação, Fluxo de dados, Módulos identificados e Visão explodida do sistema; visão traseira.
- **Placa informativa** com QR Codes reais, plaquinha de créditos e uma placa extra (marcada como acréscimo da simulação) com QR do projeto e do guia de acessibilidade.
- **Acessibilidade**: navegação completa por teclado, visualização plana como grade acessível (alternativa textual à cena), descrição textual da cena, narração por voz com legendas, redução de animações e texto ampliado (125%/150%).

Atalhos na cena 3D: setas navegam, Enter retira, Esc devolve, 1–4 botões dos grupos, 0 todos, R recentraliza, +/− zoom, E explode, I interior, L LED.

## Estrutura

```
src/
  data/        elements.ts (fonte única dos 118 elementos), elementDetails.ts, physicalProps.generated.ts,
               categories.ts, construction.ts (medidas doc/est e peças), electronics.ts, boardText.ts, validate.ts
  config/      buttonGroups.ts (mapeamento editável dos botões), links.ts (destinos dos QR Codes)
  lib/         layout.ts (grade e posições), braille.ts, textures.ts (canvas/RG8), format.ts
  scene/       Scene, Room, TableModules (InstancedMesh), SelectedModule, moduleGeometry, materials,
               ledRuntime, ButtonBox (caixa de controle), TechBox (caixa técnica), InfoBoard, Electronics,
               CameraRig, Highlight, Labels
  data/        controlBoxes.ts (peças, notas e origem das duas caixas), caixaArduino.generated.json
               (contornos e furos extraídos de caixa_arduino.svg)
  assets/      caixa_arduino.svg (prancha de corte original, só leitura)
  ui/          Sidebar, LightingControls, InfoPanel, Controls, EngineeringPanel, InspectionPanel, A11yPanel, FlatTable
  state/       store.ts (zustand)
scripts/       validate-data.ts, build-title-font.mjs
```

## Fidelidade: documentado × estimado

| Item | Origem |
|---|---|
| Caixa 180,2 × 100,2 × 50,2 mm, MDF 3 mm, encaixes, rasgos e furos | `caixa.svg` (documentado) |
| Acrílico 140 × 126 mm (120 visíveis + pés 10 × 6 mm), 8 mm | `placa.svg` + lista de materiais |
| Disposição das gravações (número, configuração, símbolo, nome, massa) | `placa.svg` |
| 5 LEDs por elemento; terminais 5V/GND/DATA; DIN → DOUT | página do projeto e `caixa.svg` |
| Fonte 24 V / 2 A, 1 Arduino, cooler 12 V, mini interruptor, disjuntor, canaletas PVC, conectores 3 vias | lista de materiais |
| Passo dos nichos (190 × 205 mm), profundidade, plaquinha 135 × 36 mm, passo dos LEDs | **estimados** pela foto |
| Conversão 24 V → 5 V e obtenção dos 12 V do cooler | **a confirmar** (não documentado; a simulação não conecta 24 V às fitas) |
| Ordem da cadeia de dados, barramentos e pontos de injeção | **ilustrativos** |
| Ordem e famílias dos botões (vermelho Hidrogênio, verde Metais, amarelo Não Metais/Ametais, azul Gases Nobres) | documentação principal do projeto (síntese do Prêmio Carolina Bori) |
| Elementos de cada botão | lidos das cores dos LEDs na foto (editável em `src/config/buttonGroups.ts`) |
| Caixa de controle: posição, 248 × 71 × 65 mm, passo dos botões 55 mm, aro Ø34 | **estimados** pela foto de detalhe (plaquinha de créditos de 105 mm como escala) |
| Caixa técnica: contornos, encaixes, furos, grades, furo Ø80, rasgo elíptico | `caixa_arduino.svg` (documentado) |
| Caixa técnica: qual peça vai em qual face, posição na parede, espessura 3 mm | **estimados** |
| Posição e tamanho de fonte, Arduino, cooler, chave e disjuntor dentro da caixa | **estimados** (o SVG não indica) |
| 1 Arduino | etapa 5.2 do Manual Maker; a lista de materiais cita 4 (protótipo). Ajuste em `ARDUINO_COUNT` |

Selos usados na interface: *documentado* (arquivo de corte, página do Manual Maker ou documentação do projeto), *estimado* (medido em foto ou suposto), *ilustrativo* (roteamento só para explicar) e *a confirmar* (não documentado).

### Sobre `caixa_arduino.svg`

Prancha de corte 2D de 1250,29 × 1028,65 mm (viewBox `-390.388 -574.650032 1250.289488 1028.650012`), com 930 paths, 54 rects e 1 circle, sem textos nem IDs. As cores das linhas (preto, azul, vermelho, verde) foram mantidas como camadas; o significado de cada cor para a cortadora não está documentado. O tamanho da prancha não é o tamanho da caixa: a caixa vem dos contornos das peças (painel de 293,1 × 183,1 mm, paredes de 123,2 mm). Das 13 peças, 7 entram na montagem 3D; as outras aparecem no painel de inspeção como “não usadas”.

## Dados científicos

- Massas: valores abreviados de massa atômica padrão IUPAC/CIAAW; elementos sem massa padrão mostram o número de massa do isótopo de referência entre colchetes.
- Configurações eletrônicas do estado fundamental (Z ≥ 104 marcadas como previstas).
- Densidade, fusão, ebulição e eletronegatividade: conjunto aberto [Periodic-Table-JSON](https://github.com/Bowserinator/Periodic-Table-JSON) (valores compilados da Wikipédia; previsões para Z ≥ 100).
- Descrições, aplicações e curiosidades redigidas em português para fins educativos.

## QR Codes

Destinos em `src/config/links.ts`, sobrescrevíveis por `.env` (`VITE_QR_HISTORIA`, `VITE_QR_PROJETO`, `VITE_QR_ACESSIBILIDADE`, ...).
O QR do guia de acessibilidade aponta para `<demo>/#guia-acessibilidade`, nunca para localhost quando há demo definida.

Links do projeto (`PROJECT_LINKS`), também sobrescrevíveis:

| Variável | Padrão |
|---|---|
| `VITE_DEMO_URL` | `https://tabela-periodica-3d-six.vercel.app/` |
| `VITE_REPO_URL` | `https://github.com/EduardoG-13/tabela-periodica-3d` |
| `VITE_MANUALMAKER_URL` | página do projeto no Manual Maker |
| `VITE_ARTICLE_URL` | `https://doi.org/10.56579/rei.v8i1.2479` |

Repositório e demo estão listados na página do Manual Maker e responderam HTTP 200 em outubro de 2026. Para um deploy em outro endereço, defina `VITE_DEMO_URL`; para ocultar um link, defina a variável como vazia.

## Desempenho

Peças repetidas usam `InstancedMesh` (uma chamada de desenho por tipo de peça; 590 LEDs em uma única malha). Nenhuma luz dinâmica por LED: brilho emissivo + bloom. Texturas das gravações em RG8 (2 bytes/pixel) geradas progressivamente; o módulo retirado recebe textura de 1024 px. DPR limitado e ajustado pelo `PerformanceMonitor`; “Modo econômico” desativa sombras.

## Fontes

Tinos (gravações e título) e Arimo (plaquinhas e interface), licença OFL, via `@fontsource`. O título 3D usa `src/assets/fonts/tinos-title.typeface.json`, gerado por `node scripts/build-title-font.mjs`.
