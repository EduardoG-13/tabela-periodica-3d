# Tabela Periódica Interativa e Acessível — Gêmeo Digital 3D

Reprodução tridimensional e interativa da instalação física descrita em
[Manual Maker — Tabela Periódica Interativa e Acessível](https://www.manualmaker.com/projeto/tabela-periodica-interativa):
118 caixas de MDF 3 mm com placas de acrílico gravadas, fitas LED RGB, Arduino, quatro botões de arcade e identificação em braile.

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
               ledRuntime, ButtonBox, InfoBoard, Electronics, CameraRig, Highlight, Labels
  ui/          Sidebar, LightingControls, InfoPanel, Controls, EngineeringPanel, A11yPanel, FlatTable
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
| Mapeamento dos botões | lido das cores dos LEDs na foto (editável em `src/config/buttonGroups.ts`) |

## Dados científicos

- Massas: valores abreviados de massa atômica padrão IUPAC/CIAAW; elementos sem massa padrão mostram o número de massa do isótopo de referência entre colchetes.
- Configurações eletrônicas do estado fundamental (Z ≥ 104 marcadas como previstas).
- Densidade, fusão, ebulição e eletronegatividade: conjunto aberto [Periodic-Table-JSON](https://github.com/Bowserinator/Periodic-Table-JSON) (valores compilados da Wikipédia; previsões para Z ≥ 100).
- Descrições, aplicações e curiosidades redigidas em português para fins educativos.

## QR Codes

Destinos em `src/config/links.ts`, sobrescrevíveis por `.env` (`VITE_QR_HISTORIA`, `VITE_QR_PROJETO`, `VITE_QR_ACESSIBILIDADE`, ...).
O guia de acessibilidade aponta para `#guia-acessibilidade` deste aplicativo; ao publicar, defina `VITE_QR_ACESSIBILIDADE` com o endereço público.

## Desempenho

Peças repetidas usam `InstancedMesh` (uma chamada de desenho por tipo de peça; 590 LEDs em uma única malha). Nenhuma luz dinâmica por LED: brilho emissivo + bloom. Texturas das gravações em RG8 (2 bytes/pixel) geradas progressivamente; o módulo retirado recebe textura de 1024 px. DPR limitado e ajustado pelo `PerformanceMonitor`; “Modo econômico” desativa sombras.

## Fontes

Tinos (gravações e título) e Arimo (plaquinhas e interface), licença OFL, via `@fontsource`. O título 3D usa `src/assets/fonts/tinos-title.typeface.json`, gerado por `node scripts/build-title-font.mjs`.
